import crypto from "crypto";
import { pool } from "../database/db.js";


const DEFAULT_PROFILE = Object.freeze({

    preferredName: "",

    occupation: "",

    professionalRole: "",

    industry: "",

    educationLevel: "",

    expertise: "",

    interests: "",

    goals: "",

    preferredLanguage: "Auto",

    responseDepth: "Balanced",

    responseStyle: "Adaptive",

    customInstructions: ""

});


const LIMITS = Object.freeze({

    preferredName: 80,

    occupation: 120,

    professionalRole: 120,

    industry: 120,

    educationLevel: 160,

    expertise: 700,

    interests: 1200,

    goals: 1200,

    preferredLanguage: 80,

    responseDepth: 40,

    responseStyle: 60,

    customInstructions: 2400

});


function clean(value, max = 1000) {

    return String(value ?? "")
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, max);

}


function sanitizeProfile(input = {}) {

    const output = {
        ...DEFAULT_PROFILE
    };

    for (
        const key
        of Object.keys(DEFAULT_PROFILE)
    ) {

        output[key] =
            clean(
                input[key] ??
                DEFAULT_PROFILE[key],

                LIMITS[key]
            );

    }

    return output;

}


function signingKey() {

    /*
     * Preferred:
     * AP_AUTH_SECRET
     *
     * Safe production fallback:
     * DATABASE_URL is already a private server secret.
     *
     * A dedicated AP_AUTH_SECRET can be added later
     * without changing the architecture.
     */

    const source =
        process.env.AP_AUTH_SECRET ||
        process.env.DATABASE_URL;

    if (!source) {

        throw new Error(
            "AP personalization signing secret unavailable."
        );

    }

    return crypto
        .createHash("sha256")
        .update(
            "ap-synapse-personalization-v1:" +
            source
        )
        .digest();

}


function sign(encoded) {

    return crypto
        .createHmac(
            "sha256",
            signingKey()
        )
        .update(encoded)
        .digest("base64url");

}


export function issuePersonalizationToken(
    googleId
) {

    const sub =
        clean(
            googleId,
            240
        );

    if (!sub) {

        throw new Error(
            "Google user id required."
        );

    }

    const now =
        Math.floor(
            Date.now() / 1000
        );

    const payload = {

        v: 1,

        sub,

        iat: now,

        exp:
            now +
            60 * 60 * 24 * 30

    };


    const encoded =
        Buffer
            .from(
                JSON.stringify(
                    payload
                )
            )
            .toString(
                "base64url"
            );


    return (
        encoded +
        "." +
        sign(encoded)
    );

}


function verifyToken(token) {

    try {

        const [
            encoded,
            supplied
        ] =
            String(
                token || ""
            )
            .split(".");


        if (
            !encoded ||
            !supplied
        ) {

            return null;

        }


        const expected =
            sign(encoded);


        const a =
            Buffer.from(
                supplied
            );

        const b =
            Buffer.from(
                expected
            );


        if (
            a.length !== b.length ||
            !crypto.timingSafeEqual(
                a,
                b
            )
        ) {

            return null;

        }


        const payload =
            JSON.parse(

                Buffer
                    .from(
                        encoded,
                        "base64url"
                    )
                    .toString(
                        "utf8"
                    )

            );


        const now =
            Math.floor(
                Date.now() / 1000
            );


        if (
            payload?.v !== 1 ||
            !payload?.sub ||
            Number(
                payload.exp
            ) < now
        ) {

            return null;

        }


        return payload;

    }
    catch {

        return null;

    }

}


function createGuestIdentity(
    raw
) {

    const hash =
        crypto
            .createHash(
                "sha256"
            )
            .update(
                clean(
                    raw ||
                    "default",

                    500
                )
            )
            .digest(
                "hex"
            );


    return (
        "guest:" +
        hash
    );

}


export function resolvePersonalizationIdentity(
    req,
    sessionId = "default"
) {

    const authorization =
        clean(
            req?.headers
                ?.authorization,

            500
        );


    if (
        authorization
            .toLowerCase()
            .startsWith(
                "bearer "
            )
    ) {

        const token =
            authorization
                .slice(7)
                .trim();


        const payload =
            verifyToken(
                token
            );


        if (
            payload?.sub
        ) {

            return {

                identityId:
                    `user:${payload.sub}`,

                authenticated:
                    true,

                googleId:
                    payload.sub

            };

        }

    }


    const browserIdentity =

        req?.headers
            ?.[
                "x-personalization-id"
            ] ||

        sessionId ||

        req?.ip ||

        "default";


    return {

        identityId:
            createGuestIdentity(
                browserIdentity
            ),

        authenticated:
            false,

        googleId:
            ""

    };

}


export async function ensurePersonalizationIdentity(
    identityId,
    {
        email = "",
        name = ""
    } = {}
) {

    await pool.query(
        `
        INSERT INTO
            personalization_profiles
        (
            identity_id,
            email,
            name
        )
        VALUES
        (
            $1,
            $2,
            $3
        )

        ON CONFLICT
            (identity_id)

        DO UPDATE SET

            email =
                CASE

                    WHEN
                        EXCLUDED.email <> ''

                    THEN
                        EXCLUDED.email

                    ELSE
                        personalization_profiles.email

                END,

            name =
                CASE

                    WHEN
                        EXCLUDED.name <> ''

                    THEN
                        EXCLUDED.name

                    ELSE
                        personalization_profiles.name

                END,

            updated_at =
                NOW()
        `,
        [

            clean(
                identityId,
                320
            ),

            clean(
                email,
                320
            ),

            clean(
                name,
                180
            )

        ]
    );

}


export async function getPersonalizationProfile(
    identityId
) {

    await ensurePersonalizationIdentity(
        identityId
    );


    const result =
        await pool.query(
            `
            SELECT

                identity_id,

                email,

                name,

                enabled,

                memory_enabled,

                profile_data,

                created_at,

                updated_at

            FROM
                personalization_profiles

            WHERE
                identity_id = $1

            LIMIT 1
            `,
            [
                identityId
            ]
        );


    const row =
        result.rows[0];


    if (!row) {

        return null;

    }


    return {

        identityId:
            row.identity_id,

        email:
            row.email || "",

        name:
            row.name || "",

        enabled:
            row.enabled !== false,

        memoryEnabled:
            row.memory_enabled !== false,

        ...DEFAULT_PROFILE,

        ...sanitizeProfile(
            row.profile_data ||
            {}
        ),

        createdAt:
            row.created_at,

        updatedAt:
            row.updated_at

    };

}


export async function updatePersonalizationProfile(
    identityId,
    input = {}
) {

    await ensurePersonalizationIdentity(
        identityId
    );


    const profile =
        sanitizeProfile(
            input
        );


    await pool.query(
        `
        UPDATE
            personalization_profiles

        SET

            enabled = $2,

            memory_enabled = $3,

            profile_data =
                $4::jsonb,

            updated_at =
                NOW()

        WHERE
            identity_id = $1
        `,
        [

            identityId,

            input.enabled !== false,

            input.memoryEnabled !== false,

            JSON.stringify(
                profile
            )

        ]
    );


    return getPersonalizationProfile(
        identityId
    );

}


async function memoryEnabled(
    identityId
) {

    const profile =
        await getPersonalizationProfile(
            identityId
        );


    return (
        profile
            ?.memoryEnabled !== false
    );

}


function memoryHash(
    category,
    content
) {

    return crypto
        .createHash(
            "sha256"
        )
        .update(
            category +
            "\n" +
            content.toLowerCase()
        )
        .digest(
            "hex"
        );

}


export async function rememberPersonalizationFact(
    identityId,
    {
        category = "context",
        content = "",
        importance = 5
    } = {}
) {

    if (
        !(await memoryEnabled(
            identityId
        ))
    ) {

        return null;

    }


    const safeCategory =
        clean(
            category,
            40
        ) ||
        "context";


    const safeContent =
        clean(
            content,
            1600
        );


    if (!safeContent) {

        return null;

    }


    const safeImportance =
        Math.max(
            1,
            Math.min(
                10,
                Number(
                    importance
                ) ||
                5
            )
        );


    const hash =
        memoryHash(
            safeCategory,
            safeContent
        );


    const result =
        await pool.query(
            `
            INSERT INTO
                personalization_memories
            (
                identity_id,
                category,
                content,
                content_hash,
                importance
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )

            ON CONFLICT
                (
                    identity_id,
                    content_hash
                )

            DO UPDATE SET

                importance =
                    GREATEST(
                        personalization_memories.importance,
                        EXCLUDED.importance
                    ),

                updated_at =
                    NOW()

            RETURNING

                id,

                category,

                content,

                importance,

                created_at,

                updated_at
            `,
            [

                identityId,

                safeCategory,

                safeContent,

                hash,

                safeImportance

            ]
        );


    return (
        result.rows[0] ||
        null
    );

}


/*
 * Only deliberately retain useful,
 * relatively non-sensitive continuity.
 *
 * AP Synapse still stores conversation turns
 * separately for retrieval.
 */
export async function maybeRememberFromUserMessage(
    identityId,
    message
) {

    if (
        !(await memoryEnabled(
            identityId
        ))
    ) {

        return;

    }


    const value =
        clean(
            message,
            5000
        );


    if (!value) {

        return;

    }


    const candidates = [];


    const occupation =

        value.match(
            /\b(?:my\s+(?:occupation|profession|job)\s+is|i\s+work\s+as)\s+(?:an?\s+)?([^.!?\n]{2,100})/i
        ) ||

        value.match(
            /\b(?:i\s+am|i'm)\s+(?:an?\s+)?(doctor|teacher|student|engineer|developer|designer|lawyer|nurse|researcher|accountant|architect|entrepreneur|writer|manager|consultant)\b/i
        );


    if (
        occupation?.[1]
    ) {

        candidates.push({

            category:
                "occupation",

            content:
                "The user says their occupation or role is " +
                clean(
                    occupation[1],
                    100
                ) +
                ".",

            importance:
                9

        });

    }


    const rules = [

        {

            category:
                "goal",

            regex:
                /\b(?:my\s+(?:current\s+)?goal\s+is|i\s+want\s+to\s+achieve)\s+([^.!?\n]{3,220})/i,

            prefix:
                "The user's stated goal is ",

            importance:
                8

        },

        {

            category:
                "education",

            regex:
                /\b(?:i\s+am\s+studying|i'm\s+studying|i\s+study)\s+([^.!?\n]{2,180})/i,

            prefix:
                "The user says they are studying ",

            importance:
                7

        },

        {

            category:
                "interest",

            regex:
                /\b(?:i\s+am\s+interested\s+in|i'm\s+interested\s+in|my\s+interests\s+(?:are|include))\s+([^.!?\n]{2,240})/i,

            prefix:
                "The user is interested in ",

            importance:
                6

        },

        {

            category:
                "preference",

            regex:
                /\b(?:i\s+prefer|please\s+usually\s+give\s+me)\s+([^.!?\n]{2,220})/i,

            prefix:
                "The user prefers ",

            importance:
                6

        },

        {

            category:
                "project",

            regex:
                /\b(?:my\s+(?:current\s+)?project\s+is|i'm\s+working\s+on|i\s+am\s+working\s+on)\s+([^.!?\n]{2,240})/i,

            prefix:
                "The user is working on ",

            importance:
                8

        }

    ];


    for (
        const rule
        of rules
    ) {

        const match =
            value.match(
                rule.regex
            );


        if (
            match?.[1]
        ) {

            candidates.push({

                category:
                    rule.category,

                content:
                    rule.prefix +
                    clean(
                        match[1],
                        240
                    ) +
                    ".",

                importance:
                    rule.importance

            });

        }

    }


    for (
        const candidate
        of candidates
    ) {

        await rememberPersonalizationFact(
            identityId,
            candidate
        );

    }

}


export async function savePersonalizationTurn(
    identityId,
    sessionId,
    role,
    content
) {

    if (
        !(await memoryEnabled(
            identityId
        ))
    ) {

        return;

    }


    const safeContent =
        clean(
            content,
            16000
        );


    if (!safeContent) {

        return;

    }


    await pool.query(
        `
        INSERT INTO
            personalization_turns
        (
            identity_id,
            session_id,
            role,
            content
        )

        VALUES
        (
            $1,
            $2,
            $3,
            $4
        )
        `,
        [

            identityId,

            clean(
                sessionId,
                320
            ),

            role === "assistant"
                ? "assistant"
                : "user",

            safeContent

        ]
    );

}


export async function listPersonalizationMemories(
    identityId,
    limit = 100
) {

    const safeLimit =
        Math.max(
            1,
            Math.min(
                200,
                Number(
                    limit
                ) ||
                100
            )
        );


    const result =
        await pool.query(
            `
            SELECT

                id,

                category,

                content,

                importance,

                created_at,

                updated_at

            FROM
                personalization_memories

            WHERE
                identity_id = $1

            ORDER BY

                importance DESC,

                updated_at DESC

            LIMIT $2
            `,
            [
                identityId,
                safeLimit
            ]
        );


    return result.rows;

}


export async function deletePersonalizationMemory(
    identityId,
    id
) {

    await pool.query(
        `
        DELETE FROM
            personalization_memories

        WHERE
            identity_id = $1

        AND
            id = $2
        `,
        [
            identityId,
            Number(id)
        ]
    );

}


export async function clearPersonalizationMemory(
    identityId
) {

    await pool.query(
        `
        DELETE FROM
            personalization_memories

        WHERE
            identity_id = $1
        `,
        [
            identityId
        ]
    );


    await pool.query(
        `
        DELETE FROM
            personalization_turns

        WHERE
            identity_id = $1
        `,
        [
            identityId
        ]
    );

}


function unique(
    values
) {

    const seen =
        new Set();


    return values.filter(
        value => {

            const key =
                String(
                    value ||
                    ""
                )
                .trim()
                .toLowerCase();


            if (
                !key ||
                seen.has(
                    key
                )
            ) {

                return false;

            }


            seen.add(
                key
            );


            return true;

        }
    );

}


function profileLines(
    profile
) {

    const pairs = [

        [
            "Preferred name",
            profile.preferredName
        ],

        [
            "Occupation",
            profile.occupation
        ],

        [
            "Professional role",
            profile.professionalRole
        ],

        [
            "Industry",
            profile.industry
        ],

        [
            "Education level",
            profile.educationLevel
        ],

        [
            "Expertise",
            profile.expertise
        ],

        [
            "Interests",
            profile.interests
        ],

        [
            "Goals",
            profile.goals
        ],

        [
            "Preferred language",
            profile.preferredLanguage
        ],

        [
            "Preferred response depth",
            profile.responseDepth
        ],

        [
            "Preferred response style",
            profile.responseStyle
        ],

        [
            "Custom instructions",
            profile.customInstructions
        ]

    ];


    return pairs

        .filter(
            (
                [
                    ,
                    value
                ]
            ) =>
                clean(
                    value,
                    2400
                )
        )

        .map(
            (
                [
                    label,
                    value
                ]
            ) =>
                label +
                ": " +
                clean(
                    value,
                    2400
                )
        );

}


export async function getPersonalizationContext(
    identityId,
    currentMessage
) {

    const profile =
        await getPersonalizationProfile(
            identityId
        );


    if (
        !profile?.enabled
    ) {

        return "";

    }


    const profileContext =
        profileLines(
            profile
        );


    let memoryContext = [];

    let recentContext = [];


    if (
        profile.memoryEnabled
    ) {

        const query =
            clean(
                currentMessage,
                1800
            );


        const memories =
            await pool.query(
                `
                SELECT

                    category,

                    content,

                    importance,

                    ts_rank(
                        to_tsvector(
                            'simple',
                            content
                        ),

                        plainto_tsquery(
                            'simple',
                            $2
                        )
                    ) AS rank

                FROM
                    personalization_memories

                WHERE
                    identity_id = $1

                ORDER BY

                    rank DESC,

                    importance DESC,

                    updated_at DESC

                LIMIT 8
                `,
                [
                    identityId,
                    query
                ]
            );


        const relevantTurns =
            await pool.query(
                `
                SELECT

                    role,

                    content,

                    created_at,

                    ts_rank(
                        to_tsvector(
                            'simple',
                            content
                        ),

                        plainto_tsquery(
                            'simple',
                            $2
                        )
                    ) AS rank

                FROM
                    personalization_turns

                WHERE
                    identity_id = $1

                AND
                (
                    $2 = ''

                    OR

                    to_tsvector(
                        'simple',
                        content
                    )

                    @@

                    plainto_tsquery(
                        'simple',
                        $2
                    )
                )

                ORDER BY

                    rank DESC,

                    created_at DESC

                LIMIT 8
                `,
                [
                    identityId,
                    query
                ]
            );


        const recentTurns =
            await pool.query(
                `
                SELECT

                    role,

                    content,

                    created_at

                FROM
                    personalization_turns

                WHERE
                    identity_id = $1

                ORDER BY
                    created_at DESC

                LIMIT 6
                `,
                [
                    identityId
                ]
            );


        memoryContext =
            unique([

                ...memories.rows.map(
                    row =>
                        "[" +
                        row.category +
                        "] " +
                        clean(
                            row.content,
                            900
                        )
                ),

                ...relevantTurns.rows.map(
                    row =>
                        "[past " +
                        row.role +
                        "] " +
                        clean(
                            row.content,
                            900
                        )
                )

            ])
            .slice(
                0,
                10
            );


        recentContext =
            unique(

                recentTurns
                    .rows
                    .reverse()
                    .map(
                        row =>
                            "[recent " +
                            row.role +
                            "] " +
                            clean(
                                row.content,
                                700
                            )
                    )

            )
            .slice(
                -6
            );

    }


    if (
        !profileContext.length &&
        !memoryContext.length &&
        !recentContext.length
    ) {

        return "";

    }


    const lines = [

        "AP SYNAPSE PERSONALIZATION CONTEXT",

        "",

        "Use this context silently.",

        "Never mention the profile or memory system unless the user explicitly asks.",

        "Use only details relevant to the current request.",

        "Never force the user's occupation, interests or goals into unrelated answers.",

        "When occupation, education or expertise is relevant, adapt vocabulary, examples, assumptions and useful depth.",

        "The current user request overrides saved response-style preferences when they conflict.",

        "Do not invent missing facts.",

        ""

    ];


    if (
        profileContext.length
    ) {

        lines.push(

            "PROFILE",

            ...profileContext,

            ""

        );

    }


    if (
        memoryContext.length
    ) {

        lines.push(

            "RELEVANT LONG-TERM MEMORY",

            ...memoryContext,

            ""

        );

    }


    if (
        recentContext.length
    ) {

        lines.push(

            "RECENT CROSS-CONVERSATION CONTINUITY",

            ...recentContext,

            ""

        );

    }


    return lines
        .join("\n")
        .slice(
            0,
            9000
        );

}


export function composePersonalizedMessage(
    originalMessage,
    context
) {

    const current =
        clean(
            originalMessage,
            12000
        );


    if (!context) {

        return current;

    }


    return [

        "<ap_synapse_internal_context>",

        context,

        "</ap_synapse_internal_context>",

        "",

        "CURRENT USER MESSAGE:",

        current

    ]
    .join(
        "\n"
    );

}

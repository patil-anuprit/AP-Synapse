import crypto from "node:crypto";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";


const IS_PRODUCTION =
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true";


const ALLOWED_ORIGINS =
    new Set([
        "https://ap-synapse.vercel.app",
        "https://ap-synapse.com",
        "https://www.ap-synapse.com"
    ]);


for (
    const value
    of String(
        process.env.AP_SECURITY_ALLOWED_ORIGINS ||
        ""
    )
        .split(",")
        .map(value => value.trim())
        .filter(Boolean)
) {

    ALLOWED_ORIGINS.add(value);
}


function isLocalDevelopmentOrigin(origin) {

    if (IS_PRODUCTION) {
        return false;
    }

    try {

        const url =
            new URL(origin);

        return (
            url.protocol === "http:" &&
            (
                url.hostname === "127.0.0.1" ||
                url.hostname === "localhost"
            )
        );

    }
    catch {

        return false;
    }
}


const corsOptions = {

    origin(
        origin,
        callback
    ) {

        /*
         * Native/mobile/server requests may legitimately have
         * no Origin header. CORS is not authentication.
         */

        if (!origin) {

            callback(
                null,
                true
            );

            return;
        }


        if (
            ALLOWED_ORIGINS.has(origin) ||
            isLocalDevelopmentOrigin(origin)
        ) {

            callback(
                null,
                true
            );

            return;
        }


        const error =
            new Error(
                "AP_ORIGIN_REJECTED"
            );

        error.code =
            "AP_ORIGIN_REJECTED";

        callback(error);
    },


    credentials:
        true,


    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],


    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Session-Id",
        "X-Request-Id"
    ],


    maxAge:
        86400
};


function limiter(
    windowMs,
    limit
) {

    return rateLimit({

        windowMs,

        limit,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        skip(req) {

            return (
                req.path === "/health"
            );
        },

        handler(
            req,
            res
        ) {

            res.status(429).json({
                error:
                    "Too many requests.",

                requestId:
                    req.apRequestId ||
                    ""
            });
        }
    });
}


const globalLimiter =
    limiter(
        60 * 1000,
        240
    );


const chatLimiter =
    limiter(
        5 * 60 * 1000,
        75
    );


const authLimiter =
    limiter(
        15 * 60 * 1000,
        30
    );


const uploadLimiter =
    limiter(
        15 * 60 * 1000,
        20
    );


const generationLimiter =
    limiter(
        10 * 60 * 1000,
        40
    );


function validRequestId(value) {

    return (
        typeof value === "string" &&
        /^[A-Za-z0-9._:-]{8,100}$/.test(value)
    );
}


export function installAPProductionSecurity(
    app
) {

    /*
     * Render runs behind a reverse proxy.
     */

    if (
        process.env.RENDER === "true"
    ) {

        app.set(
            "trust proxy",
            1
        );
    }


    app.disable(
        "x-powered-by"
    );


    /*
     * FAIL CLOSED:
     * laptop-only Ollama/Qwen paths may never become production
     * Render paths accidentally.
     */

    if (IS_PRODUCTION) {

        process.env.AP_LOCAL_QWEN_DIRECT =
            "false";

        process.env.AP_LOCAL_SPECIALIST_ENABLED =
            "false";

        process.env.AP_SYNAPSE_RUNTIME_PRIMARY =
            "false";

        process.env.AP_SYNAPSE_RUNTIME_ENABLED =
            "false";
    }


    /*
     * Request correlation without logging message contents.
     */

    app.use(
        (
            req,
            res,
            next
        ) => {

            const incoming =
                String(
                    req.get(
                        "x-request-id"
                    ) ||
                    ""
                );


            const requestId =
                validRequestId(incoming)
                    ? incoming
                    : crypto.randomUUID();


            req.apRequestId =
                requestId;


            res.setHeader(
                "X-Request-Id",
                requestId
            );


            next();
        }
    );


    /*
     * API security headers.
     */

    app.use(
        helmet({

            contentSecurityPolicy:
                false,

            crossOriginEmbedderPolicy:
                false,

            crossOriginOpenerPolicy:
                false,

            crossOriginResourcePolicy:
                false,

            referrerPolicy: {
                policy:
                    "no-referrer"
            },

            hsts:
                IS_PRODUCTION
                    ? {
                        maxAge:
                            31536000,

                        includeSubDomains:
                            true,

                        preload:
                            false
                    }
                    : false
        })
    );


    app.use(
        cors(
            corsOptions
        )
    );


    /*
     * Prevent intermediary caching of chats/account data.
     */

    app.use(
        (
            req,
            res,
            next
        ) => {

            res.setHeader(
                "Cache-Control",
                "no-store"
            );

            res.setHeader(
                "Pragma",
                "no-cache"
            );

            res.setHeader(
                "X-Content-Type-Options",
                "nosniff"
            );

            res.setHeader(
                "Permissions-Policy",
                "geolocation=(), payment=(), usb=(), serial=()"
            );


            next();
        }
    );


    /*
     * Reject absurd request URLs before expensive processing.
     */

    app.use(
        (
            req,
            res,
            next
        ) => {

            if (
                req.originalUrl.length >
                4096
            ) {

                return res
                    .status(414)
                    .json({
                        error:
                            "Request URL too long."
                    });
            }


            next();
        }
    );


    /*
     * Do not expose internal diagnostic configuration publicly.
     */

    app.use(
        (
            req,
            res,
            next
        ) => {

            if (
                IS_PRODUCTION &&
                (
                    req.path === "/email/status" ||
                    req.path === "/database/status"
                )
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Not found."
                    });
            }


            next();
        }
    );


    app.use(
        globalLimiter
    );


    app.use(
        "/chat",
        chatLimiter
    );


    app.use(
        "/aprisha",
        chatLimiter
    );


    app.use(
        "/auth",
        authLimiter
    );


    app.use(
        "/upload",
        uploadLimiter
    );


    app.use(
        "/image",
        generationLimiter
    );
}
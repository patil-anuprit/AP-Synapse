import {
    promises as fs
} from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
    rankTextItems
} from "./APRetrieval.js";

function baseDir() {
    return (
        process.env
            .AP_STAGE3_DATA_DIR ||
        path.join(
            process.cwd(),
            ".ap-unified-data"
        )
    );
}

function memoryPath() {
    return path.join(
        baseDir(),
        "memory.json"
    );
}

async function ensureDir() {
    await fs.mkdir(
        baseDir(),
        {
            recursive: true
        }
    );
}

async function readStore() {
    try {
        const raw =
            await fs.readFile(
                memoryPath(),
                "utf8"
            );

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (
        error
    ) {
        if (
            error?.code ===
            "ENOENT"
        ) {
            return [];
        }

        throw error;
    }
}

async function writeStore(items) {
    await ensureDir();

    const target =
        memoryPath();

    const temp =
        target +
        ".tmp-" +
        crypto
            .randomBytes(6)
            .toString("hex");

    await fs.writeFile(
        temp,
        JSON.stringify(
            items,
            null,
            2
        ),
        "utf8"
    );

    await fs.rename(
        temp,
        target
    );
}

function safeIdentity(
    identityId
) {
    const value =
        String(
            identityId ||
            "anonymous"
        )
            .trim();

    return (
        value ||
        "anonymous"
    );
}

export async function remember({
    identityId,
    text,
    tags = [],
    metadata = {}
}) {
    const clean =
        String(text || "")
            .trim();

    if (!clean) {
        throw new Error(
            "Memory text is required."
        );
    }

    const item = {
        id:
            crypto
                .randomUUID(),

        identityId:
            safeIdentity(
                identityId
            ),

        text:
            clean,

        tags:
            Array.isArray(tags)
                ? tags.slice(0, 20)
                : [],

        metadata,

        createdAt:
            new Date()
                .toISOString()
    };

    const current =
        await readStore();

    /*
     * Bound local development memory so the
     * proof store cannot grow without limit.
     */
    const next =
        [
            ...current,
            item
        ].slice(-2000);

    await writeStore(next);

    return item;
}

export async function recall(
    identityId,
    query,
    {
        topK = 5
    } = {}
) {
    const id =
        safeIdentity(
            identityId
        );

    const all =
        await readStore();

    const scoped =
        all.filter(
            item =>
                item.identityId ===
                id
        );

    return rankTextItems(
        query,
        scoped,
        {
            topK,
            getText:
                item =>
                    (
                        item.text +
                        " " +
                        (
                            item.tags ||
                            []
                        ).join(" ")
                    )
        }
    );
}

export async function clearMemory(
    identityId
) {
    const id =
        safeIdentity(
            identityId
        );

    const all =
        await readStore();

    await writeStore(
        all.filter(
            item =>
                item.identityId !==
                id
        )
    );
}

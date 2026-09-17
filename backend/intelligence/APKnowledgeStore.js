import {
    promises as fs
} from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
    chunkText
} from "./APTextChunker.js";
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

function storePath() {
    return path.join(
        baseDir(),
        "knowledge.json"
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
                storePath(),
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
        storePath();

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

export async function addKnowledgeDocument({
    id,
    title = "Untitled",
    text,
    metadata = {}
}) {
    const documentId =
        id ||
        crypto
            .randomUUID();

    const chunks =
        chunkText(text);

    const now =
        new Date()
            .toISOString();

    const entries =
        chunks.map(
            (
                chunk,
                index
            ) => ({
                id:
                    documentId +
                    ":" +
                    index,

                documentId,

                title,

                text:
                    chunk,

                chunkIndex:
                    index,

                metadata,

                createdAt:
                    now
            })
        );

    const current =
        await readStore();

    const filtered =
        current.filter(
            item =>
                item.documentId !==
                documentId
        );

    await writeStore([
        ...filtered,
        ...entries
    ]);

    return {
        documentId,
        chunks:
            entries.length
    };
}

export async function retrieveKnowledge(
    query,
    {
        topK = 4
    } = {}
) {
    const items =
        await readStore();

    return rankTextItems(
        query,
        items,
        {
            topK,
            getText:
                item =>
                    (
                        item.title +
                        " " +
                        item.text
                    )
        }
    );
}

export async function clearKnowledgeStore() {
    await writeStore([]);
}

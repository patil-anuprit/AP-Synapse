import { randomUUID } from "node:crypto";

const LEVEL_PRIORITY = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 100
};

function configuredLevel() {
    const value = String(
        process.env.AP_LOG_LEVEL || "info"
    ).toLowerCase();

    return Object.hasOwn(LEVEL_PRIORITY, value)
        ? value
        : "info";
}

function cleanText(value, maxLength = 420) {
    const cleaned = String(value ?? "")
        .replace(/\borg_[A-Za-z0-9_-]+\b/g, "org_[redacted]")
        .replace(/\b(sk|gsk|AIza)[A-Za-z0-9._-]{12,}\b/g, "$1[redacted]")
        .replace(/https?:\/\/\S+/gi, "[url]")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

    return cleaned.length > maxLength
        ? cleaned.slice(0, maxLength) + "..."
        : cleaned;
}

function fieldValue(value) {
    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    return JSON.stringify(cleanText(value));
}

export function createAPRequestId() {
    return randomUUID()
        .replaceAll("-", "")
        .slice(0, 12);
}

export function apErrorFields(error) {
    const providerError =
        error?.error?.error ||
        error?.error ||
        {};

    const directStatus = Number(
        error?.status ||
        error?.response?.status
    );

    return {
        status: Number.isFinite(directStatus)
            ? directStatus
            : undefined,
        code:
            error?.code ||
            providerError?.code ||
            undefined,
        type:
            providerError?.type ||
            error?.name ||
            undefined,
        reason:
            error?.reason ||
            undefined,
        detail: cleanText(
            providerError?.message ||
            error?.message ||
            "unknown provider error"
        )
    };
}

export function apLog(
    level,
    event,
    fields = {}
) {
    const normalizedLevel =
        Object.hasOwn(LEVEL_PRIORITY, level)
            ? level
            : "info";

    if (
        LEVEL_PRIORITY[normalizedLevel] <
        LEVEL_PRIORITY[configuredLevel()]
    ) {
        return;
    }

    const entries = Object.entries(fields)
        .filter(([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== ""
        )
        .map(([key, value]) =>
            `${key}=${fieldValue(value)}`
        );

    const line = [
        "[AP]",
        `level=${normalizedLevel.toUpperCase()}`,
        `event=${cleanText(event, 100)}`,
        ...entries
    ].join(" ");

    if (normalizedLevel === "error") {
        console.error(line);
        return;
    }

    if (normalizedLevel === "warn") {
        console.warn(line);
        return;
    }

    console.log(line);
}

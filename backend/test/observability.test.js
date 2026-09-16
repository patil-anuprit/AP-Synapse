import assert from "node:assert/strict";
import test from "node:test";

import {
    apErrorFields,
    apLog,
    createAPRequestId
} from "../services/observability.js";

test("request IDs are short and correlation-safe", () => {
    const first = createAPRequestId();
    const second = createAPRequestId();

    assert.match(first, /^[a-f0-9]{12}$/);
    assert.match(second, /^[a-f0-9]{12}$/);
    assert.notEqual(first, second);
});

test("provider errors keep diagnostics but redact identifiers and URLs", () => {
    const fields = apErrorFields({
        status: 413,
        error: {
            error: {
                code: "rate_limit_exceeded",
                type: "tokens",
                message:
                    "Organization org_01secret requested 12149 tokens. " +
                    "See https://console.example.test/billing"
            }
        },
        headers: {
            authorization: "secret"
        }
    });

    assert.equal(fields.status, 413);
    assert.equal(fields.code, "rate_limit_exceeded");
    assert.equal(fields.type, "tokens");
    assert.match(fields.detail, /12149/);
    assert.match(fields.detail, /org_\[redacted\]/);
    assert.match(fields.detail, /\[url\]/);
    assert.doesNotMatch(fields.detail, /org_01secret/);
    assert.equal("headers" in fields, false);
});

test("structured log output is one readable ASCII line", () => {
    const originalLog = console.log;
    const lines = [];

    console.log = line => lines.push(line);

    try {
        apLog("info", "provider.completed", {
            request: "abc123",
            provider: "Groq",
            output_characters: 42
        });
    }
    finally {
        console.log = originalLog;
    }

    assert.equal(lines.length, 1);
    assert.match(lines[0], /^\[AP\] /);
    assert.match(lines[0], /event=provider\.completed/);
    assert.match(lines[0], /provider="Groq"/);
    assert.doesNotMatch(lines[0], /[^\x00-\x7F]/);
});

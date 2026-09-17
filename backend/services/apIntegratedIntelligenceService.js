import {
    createAPIntegratedStream,
    solveAPIntegrated
} from "../intelligence/index.js";

/*
 * Stage 4 service boundary.
 *
 * This file is intentionally NOT wired into services/router.js yet.
 * Stage 5 can place it behind a feature flag and preserve the current
 * provider failover chain as fallback after local integration passes.
 */

export async function createStream(
    messages,
    requestContext = {},
    options = {}
) {
    return createAPIntegratedStream(
        messages,
        requestContext,
        options
    );
}

export async function solve(
    messages,
    requestContext = {},
    options = {}
) {
    return solveAPIntegrated(
        messages,
        requestContext,
        options
    );
}

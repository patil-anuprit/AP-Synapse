import crypto from "crypto";
import express from "express";

import {
    sendWeeklyIntelligenceBriefs,
    getWeeklyIntelligenceStatus
} from "../services/weeklyIntelligenceNetwork.js";

/*
 * AP SYNAPSE — WEEKLY ADMIN TRIGGER V1
 *
 * POST /admin/weekly-intelligence/run
 *
 * Security:
 * - requires AP_ADMIN_KEY from backend environment;
 * - accepts the secret only through x-ap-admin-key or Bearer auth;
 * - compares secrets using timingSafeEqual;
 * - never returns recipient addresses;
 * - never bypasses Weekly Intelligence deduplication/preferences.
 */

const router =
    express.Router();

let runInProgress =
    false;


function clean(value, max = 4096) {

    return String(
        value || ""
    )
        .trim()
        .slice(
            0,
            max
        );

}


function readPresentedKey(req) {

    const headerKey =
        clean(
            req.get(
                "x-ap-admin-key"
            )
        );

    if (headerKey) {
        return headerKey;
    }

    const authorization =
        clean(
            req.get(
                "authorization"
            )
        );

    const match =
        authorization.match(
            /^Bearer\s+(.+)$/i
        );

    return match
        ? clean(
            match[1]
        )
        : "";

}


function secretsEqual(
    presented,
    expected
) {

    const left =
        Buffer.from(
            String(
                presented ||
                ""
            ),
            "utf8"
        );

    const right =
        Buffer.from(
            String(
                expected ||
                ""
            ),
            "utf8"
        );

    if (
        left.length === 0 ||
        right.length === 0 ||
        left.length !== right.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        left,
        right
    );

}


function requireAdmin(
    req,
    res,
    next
) {

    const expected =
        clean(
            process.env.AP_ADMIN_KEY
        );

    if (!expected) {

        console.error(
            "AP Weekly Admin Trigger unavailable: AP_ADMIN_KEY is not configured."
        );

        return res
            .status(503)
            .json({
                ok:
                    false,
                error:
                    "admin_trigger_not_configured"
            });
    }

    const presented =
        readPresentedKey(
            req
        );

    if (
        !secretsEqual(
            presented,
            expected
        )
    ) {

        /*
         * Deliberately do not reveal whether the key was absent
         * or merely incorrect.
         */
        return res
            .status(401)
            .json({
                ok:
                    false,
                error:
                    "unauthorized"
            });
    }

    next();

}


router.post(
    "/run",
    requireAdmin,
    async (
        req,
        res
    ) => {

        if (runInProgress) {

            return res
                .status(409)
                .json({
                    ok:
                        false,
                    error:
                        "weekly_run_already_in_progress"
                });
        }

        runInProgress =
            true;

        try {

            const startedAt =
                new Date()
                    .toISOString();

            const result =
                await sendWeeklyIntelligenceBriefs();

            const completedAt =
                new Date()
                    .toISOString();

            /*
             * No recipient addresses are returned.
             * Weekly preferences and one-per-week dedupe remain
             * enforced by sendWeeklyIntelligenceBriefs().
             */
            return res
                .status(200)
                .set(
                    "Cache-Control",
                    "no-store"
                )
                .json({
                    ok:
                        true,
                    mode:
                        "production_weekly_intelligence",
                    startedAt,
                    completedAt,
                    weekKey:
                        result?.weekKey ||
                        null,
                    eligible:
                        Number(
                            result?.eligible ||
                            0
                        ),
                    sent:
                        Number(
                            result?.sent ||
                            0
                        ),
                    failed:
                        Number(
                            result?.failed ||
                            0
                        )
                });

        }
        catch (error) {

            console.error(
                "AP Weekly Admin Trigger failed:",
                error?.message ||
                error
            );

            return res
                .status(500)
                .set(
                    "Cache-Control",
                    "no-store"
                )
                .json({
                    ok:
                        false,
                    error:
                        "weekly_intelligence_run_failed"
                });

        }
        finally {

            runInProgress =
                false;

        }

    }
);



/*
 * AP_WEEKLY_INTELLIGENCE_STATUS_V1
 *
 * GET /admin/weekly-intelligence/status
 *
 * Protected by the same AP_ADMIN_KEY as the production send trigger.
 * Returns aggregate counts only.
 */
router.get(
    "/status",
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            const status =
                await getWeeklyIntelligenceStatus();

            return res
                .status(200)
                .set(
                    "Cache-Control",
                    "no-store"
                )
                .json({
                    ok:
                        true,
                    mode:
                        "weekly_intelligence_status",

                    ...status
                });

        }
        catch (error) {

            console.error(
                "AP Weekly Intelligence Status failed:",
                error?.message ||
                error
            );

            return res
                .status(500)
                .set(
                    "Cache-Control",
                    "no-store"
                )
                .json({
                    ok:
                        false,
                    error:
                        "weekly_intelligence_status_failed"
                });

        }

    }
);

export default router;
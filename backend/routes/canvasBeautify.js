import express from "express";
import {
    beautifyCanvasSketch
} from "../services/canvasBeautifyService.js";

const router = express.Router();
const MAX_DATA_URI_LENGTH =
    10 * 1024 * 1024;

const ALLOWED_STYLES =
    new Set([
        "auto",
        "realistic",
        "storybook",
        "architecture",
        "3d",
        "watercolor",
        "cartoon",
        "fantasy"
    ]);

router.post(
    "/beautify",
    async (req, res) => {
        try {
            res.setHeader(
                "Cache-Control",
                "no-store"
            );

            const sketchDataUrl =
                req.body?.sketchDataUrl;

            const description =
                String(
                    req.body?.description || ""
                )
                    .trim()
                    .slice(0, 1200);

            const requestedStyle =
                String(
                    req.body?.style || "auto"
                )
                    .trim()
                    .toLowerCase();

            const style =
                ALLOWED_STYLES.has(
                    requestedStyle
                )
                    ? requestedStyle
                    : "auto";

            if (
                typeof sketchDataUrl !==
                    "string" ||
                !sketchDataUrl.startsWith(
                    "data:image/"
                )
            ) {
                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "A canvas sketch image is required."
                    });
            }

            if (
                sketchDataUrl.length >
                MAX_DATA_URI_LENGTH
            ) {
                return res
                    .status(413)
                    .json({
                        ok: false,
                        error:
                            "The sketch is too large. Please try again."
                    });
            }

            const result =
                await beautifyCanvasSketch({
                    sketchDataUrl,
                    style,
                    description
                });

            return res.json(result);
        }
        catch (error) {
            console.error(
                "AP CANVAS BEAUTIFY ERROR:",
                error
            );

            const message =
                String(
                    error?.message ||
                    "Canvas beautification failed."
                )
                    .slice(0, 240);

            return res
                .status(500)
                .json({
                    ok: false,
                    error: message
                });
        }
    }
);

export default router;
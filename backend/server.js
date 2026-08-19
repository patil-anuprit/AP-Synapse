import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateImage } from "./services/imageService.js";
import https from "https";
import upload from "./services/upload.js";
import { readDocument } from "./services/documentReader.js";
import { generateVisualImage } from "./services/visualForge.js";
import { OAuth2Client } from "google-auth-library";
import { searchWebSources } from "./services/webSources.js";
import {
    sendWelcomeEmail,
    sendSignInNotification
} from "./services/emailService.js";

import {
    dispatchCommunication,
    COMMUNICATION_TYPES,
    notifyResearchComplete
} from "./services/communicationEngine.js";

import {
    DEFAULT_COMMUNICATION_PREFERENCES,
    normalizeCommunicationPreferences
} from "./services/communicationPreferences.js";

import {
    testDatabaseConnection
} from "./database/db.js";

import {
    initializeDatabase
} from "./database/initialize.js";

import {
    startCommunicationScheduler
} from "./services/communicationScheduler.js";

import brain from "./core/index.js";

import {
    detectIntent,
    buildReasoning,
    buildMessages,
    validateResponse
} from "./engines/index.js";

import {
    buildConversation,
    remember,
    getProfile,
    savePreference,
    forgetPreference
} from "./memory/index.js";

import { createAIStream } from "./services/router.js";

dotenv.config();

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {

    res.json({

    status: "online",

    name: "AP Synapse",

    version: "1.0.0",

    uptime: process.uptime()

});

});

app.get("/health", (_req, res) => {

    res.status(200).json({
        status: "ok",
        service: "AP Synapse",
        uptime: Math.floor(process.uptime())
    });

});

app.post(
    "/upload",
    upload.single("file"),
    async (req, res) => {

        let uploadedFile = req.file;

        try {

            console.log("========== UPLOAD START ==========");

            if (!uploadedFile) {

                return res.status(400).json({
                    success: false,
                    error: "No file uploaded."
                });

            }

            console.log("File:", {
                name: uploadedFile.originalname,
                type: uploadedFile.mimetype,
                size: uploadedFile.size
            });

            const content =
                await readDocument(uploadedFile);

            const isImageContent =
                content &&
                typeof content === "object" &&
                content.type === "image";

            if (
               !content ||
               (
                   !isImageContent &&
                   typeof content === "string" &&
                   !content.trim()
                )
            ) {

                return res.status(422).json({
                    success: false,
                    error: "The uploaded file contains no readable content."
                });

            }

            console.log(
                "Document length:",
                content.length
            );

            const sessionId =
                req.headers["x-session-id"] ||
                req.ip ||
                "default";

                

            remember(
                sessionId,
                "document",
                content
            );

            return res.json({

                success: true,

                original:
                    uploadedFile.originalname,

                mimeType:
                    uploadedFile.mimetype,

                size:
                    uploadedFile.size,

                content

            });

        }

        catch (error) {

            console.error(
                "========== UPLOAD ERROR =========="
            );

            console.error(error);

            return res.status(500).json({

                success: false,

                error:
                    error.message ||
                    "Unable to process uploaded file."

            });

        }

        finally {

            /*
             * IMPORTANT:
             * Remove the temporary uploaded file
             * after processing.
             */

            if (
                uploadedFile?.path
            ) {

                try {

                    const fs =
                        await import("fs/promises");

                    await fs.unlink(
                        uploadedFile.path
                    );

                    console.log(
                        "Temporary upload removed."
                    );

                }

                catch (cleanupError) {

                    console.warn(
                        "Upload cleanup warning:",
                        cleanupError.message
                    );

                }

            }

        }

    }
);

app.post("/chat", async (req, res) => {

    const requestStart = performance.now();

    try {

        const message = req.body?.message?.trim();
        const web = true;
        const documentImage = req.body?.documentImage || "";

        if (!message) {
            return res.status(400).json({
                error: "Message is required."
            });
        }

        const sessionId =
            req.headers["x-session-id"] ||
            req.ip ||
            "default";

        console.log(
            `âš¡ CHAT START | ${message.slice(0, 80)}`
        );
    // ==========================================
    // AP SYNAPSE — VISUAL FORGE
    // PRIMARY + ONLY IMAGE ENGINE
    // ==========================================

    try {

        console.log(
            "🎨 AP SYNAPSE → VISUAL FORGE → fal"
        );

        const visualResult =
            await generateVisualImage(prompt);

        console.log(
            "✅ VISUAL FORGE IMAGE GENERATED"
        );

        return res.json(
            visualResult
        );

    }

    catch (visualError) {

        console.error(
            "❌ VISUAL FORGE IMAGE FAILED:"
        );

        console.error(
            visualError
        );

        return res.status(502).json({

            type: "error",

            code:
                "VISUAL_FORGE_IMAGE_FAILED",

            error:
                visualError?.message ||
                "AP Synapse Visual Forge could not generate the image."

        });

    }
    return res.status(502).json({
        error:
            "All AP Synapse image-generation providers are currently unavailable."
    });

    } catch (error) {

        console.error("Chat request failed:", error);

        return res.status(500).json({
            error: "Unable to process chat request."
        });
    }

});

// ==========================================
// AP SYNAPSE â€” GOOGLE SIGN-IN VERIFICATION
// ==========================================

app.post("/auth/google", async (req, res) => {
    try {
        console.log("ðŸ” Google authentication request received.");

        // ------------------------------------------
        // 1. Receive Google credential
        // ------------------------------------------

        const credential = req.body?.credential;

        if (!credential) {
            console.warn("âš ï¸ Google credential missing.");
            return res.status(400).json({
                success: false,
                error: "Google credential is required."
            });
        }

        console.log("âœ… Google credential received.");

        // ------------------------------------------
        // 2. Verify credential with Google
        // ------------------------------------------

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // ------------------------------------------
        // 3. Extract verified Google identity
        // ------------------------------------------

        const payload = ticket.getPayload();

        if (!payload) {
            console.warn("âš ï¸ Google returned no payload.");
            return res.status(401).json({
                success: false,
                error: "Invalid Google credential."
            });
        }

        // ------------------------------------------
        // 4. Build AP Synapse user
        // ------------------------------------------

        const user = {
            googleId: payload.sub || "",
            name: payload.name || "AP Synapse User",
            email: payload.email || "",
            picture: payload.picture || "",
            emailVerified: payload.email_verified === true
        };

        // ==========================================
        // AP SYNAPSE â€” SIGN-IN SECURITY EMAIL
        // ==========================================

        try {

            if (user.email) {

                await dispatchCommunication({

                    type:
                       COMMUNICATION_TYPES.SECURITY,

                    email:
                       user.email,

                    name:
                       user.name || "AP Synapse User",

                    sessionId:
                       sessionId,

                    payload: {

                       title:
                           "New sign-in detected.",

                       subject:
                           "New sign-in to your AP Synapse account",

                       message:
                           "Your AP Synapse account was just signed in to using Google. If this was you, no action is required."

                    }

                });

                console.log(
                    "âœ‰ï¸ AP Synapse security communication dispatched:",
                    user.email
                );

            }

        } catch (emailError) {

            // Email failure must NEVER break Google Sign-In.

            console.error(
                "âš ï¸ Sign-in security communication failed:",
                emailError.message
            );

        }

        // ------------------------------------------
        // 5. Successful authentication
        // ------------------------------------------

        console.log("âœ… Google Sign-In verified successfully.");
        console.log("ðŸ‘¤ User:", user.name);
        console.log("ðŸ“§ Email:", user.email);

        return res.status(200).json({
            success: true,
            message: "Google Sign-In successful.",
            user
        });
    } catch (error) {
        console.error("âŒ Google Sign-In verification failed.");
        console.error(error);
        return res.status(401).json({
            success: false,
            error: "Google authentication failed."
        });
    }
});

// ============================================================
// AP SYNAPSE â€” EMAIL SERVICE TEST
// TEMPORARY PRODUCTION-SAFE DIAGNOSTIC ENDPOINT
// ============================================================

app.get("/email/status", (req, res) => {

    res.json({
        service: "AP Synapse Email Service",
        provider: "Brevo",
        configured: Boolean(
            process.env.BREVO_API_KEY &&
            process.env.BREVO_SENDER_EMAIL
        ),
        senderConfigured:
            Boolean(process.env.BREVO_SENDER_EMAIL),
        replyToConfigured:
            Boolean(process.env.BREVO_REPLY_TO_EMAIL)
    });

});

app.post("/email/test-welcome", async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "email is required."
            });
        }

        const result = await sendWelcomeEmail({
            email,
            name: name || "AP Synapse User"
        });

        return res.json({
            success: true,
            message: "Welcome email sent successfully.",
            messageId: result?.messageId || null
        });

    } catch (error) {
        console.error("AP Synapse test email error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Email sending failed."
        });
    }
});

// ============================================================
// AP SYNAPSE â€” PERSISTENT COMMUNICATION PREFERENCES
// ============================================================

app.get("/communication/preferences", async (req, res) => {

    try {

        const sessionId =
            req.headers["x-session-id"] ||
            req.ip ||
            "default";

        const profile =
            await getProfile(sessionId);

        return res.json({

            success: true,

            persistent: true,

            sessionId,

            preferences:
                profile.preferences

        });

    }

    catch (error) {

        console.error(
            "AP Synapse communication preference GET error:",
            error
        );

        return res.status(500).json({

            success: false,

            persistent: true,

            error:
                error.message ||
                "Unable to load communication preferences."

        });

    }

});


app.post("/communication/preferences", async (req, res) => {

    try {

        const sessionId =
            req.headers["x-session-id"] ||
            req.ip ||
            "default";

        const requestedPreferences =
            req.body?.preferences || {};

        const normalized =
            normalizeCommunicationPreferences(
                requestedPreferences
            );

        for (const [key, value] of Object.entries(normalized)) {

            await savePreference(
                sessionId,
                key,
                value
            );

        }

        const profile =
            await getProfile(sessionId);

        return res.json({

            success: true,

            persistent: true,

            sessionId,

            message:
                "Communication preferences saved successfully.",

            preferences:
                profile.preferences

        });

    }

    catch (error) {

        console.error(
            "AP Synapse communication preference POST error:",
            error
        );

        return res.status(400).json({

            success: false,

            persistent: true,

            error:
                error.message ||
                "Unable to save communication preferences."

        });

    }

});

// ============================================================
// AP SYNAPSE â€” COMMUNICATION EVENT DISPATCH
// ============================================================

app.post("/communication/send", async (req, res) => {

    try {

        const sessionId =
            req.headers["x-session-id"] ||
            req.ip ||
            "default";

        const {
            type,
            email,
            name,
            payload = {}
        } = req.body || {};

        if (!type) {
            return res.status(400).json({
                success: false,
                error: "Communication type is required."
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Recipient email is required."
            });
        }

        const profile =
            await getProfile(sessionId);

        const result =
            await dispatchCommunication({

                type,

                email,

                name:
                    name ||
                    profile.name ||
                    "AP Synapse User",

                sessionId,

                preferences:
                    profile.preferences,

                payload

            });

        return res.json({

            success: true,

            ...result

        });

    }

    catch (error) {

        console.error(
            "AP Synapse communication dispatch error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                error.message ||
                "Communication failed."

        });

    }

});

app.get("/database/status", async (req, res) => {

    try {

        const status =
            await testDatabaseConnection();

        res.json({
            service: "AP Synapse Database",
            provider: "PostgreSQL",
            ...status
        });

    } catch (error) {

        res.status(500).json({
            service: "AP Synapse Database",
            connected: false
        });

    }

});

initializeDatabase()
    .then(() => {

        startCommunicationScheduler();

        app.listen(PORT, () => {

            console.log(
                `AP Synapse backend running on port ${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error(
            "AP Synapse database initialization failed:",
            error
        );

        process.exit(1);

    });


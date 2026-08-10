import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
    maxRetries: 2,
    timeoutInSeconds: 15
});

const sender = {
    name: process.env.BREVO_SENDER_NAME || "AP Synapse",
    email: process.env.BREVO_SENDER_EMAIL
};

export async function sendAPSynapseEmail({
    to,
    name = "AP Synapse User",
    subject,
    htmlContent,
    textContent
}) {
    if (!process.env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is not configured.");
    }

    if (!sender.email) {
        throw new Error("BREVO_SENDER_EMAIL is not configured.");
    }

    if (!to) {
        throw new Error("Recipient email is required.");
    }

    const result = await brevo.transactionalEmails.sendTransacEmail({
        sender,
        to: [
            {
                email: to,
                name
            }
        ],
        subject,
        htmlContent,
        textContent
    });

    console.log(
        "✉️ AP Synapse email sent:",
        result.messageId
    );

    return result;
}

export async function sendWelcomeEmail({
    email,
    name
}) {
    return sendAPSynapseEmail({
        to: email,
        name,
        subject: "Welcome to AP Synapse",
        textContent:
            `Welcome to AP Synapse, ${name}.\n\n` +
            "Your account has been successfully connected with Google.\n\n" +
            "— AP Synapse",
        htmlContent: `
<!doctype html>
<html>
<body style="margin:0;background:#111;color:#f5f5f5;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:40px auto;padding:36px;background:#181818;border:1px solid #303030;border-radius:18px;">
        <div style="font-size:13px;letter-spacing:2px;color:#c9a96a;">
            AP SYNAPSE
        </div>

        <h1 style="font-weight:500;margin:24px 0 12px;">
            Welcome, ${escapeHtml(name)}
        </h1>

        <p style="color:#c7c7c7;line-height:1.7;">
            Your AP Synapse account has been successfully connected
            with Google.
        </p>

        <p style="color:#c7c7c7;line-height:1.7;">
            Your intelligence workspace is ready.
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #303030;color:#888;font-size:13px;">
            AP Synapse — The next generation of artificial intelligence.
        </div>
    </div>
</body>
</html>
        `
    });
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
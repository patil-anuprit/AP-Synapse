import { BrevoClient } from "@getbrevo/brevo";

// ============================================================
// AP SYNAPSE — PRODUCTION EMAIL SERVICE
// ============================================================

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
    maxRetries: 3,
    timeoutInSeconds: 30
});

const SERVICE_NAME = "AP Synapse Email Service";

const sender = {
    name:
        process.env.BREVO_SENDER_NAME ||
        "AP Synapse",

    email:
        process.env.BREVO_SENDER_EMAIL ||
        ""
};

const replyTo =
    process.env.BREVO_REPLY_TO_EMAIL
        ? {
            email:
                process.env.BREVO_REPLY_TO_EMAIL,

            name:
                process.env.BREVO_REPLY_TO_NAME ||
                "AP Synapse"
        }
        : undefined;


// ============================================================
// CONFIGURATION
// ============================================================

function assertConfiguration() {

    if (!process.env.BREVO_API_KEY) {
        throw new Error(
            "BREVO_API_KEY is not configured."
        );
    }

    if (!sender.email) {
        throw new Error(
            "BREVO_SENDER_EMAIL is not configured."
        );
    }

}


// ============================================================
// VALIDATION
// ============================================================

function validateEmail(email) {

    const value =
        String(email || "")
            .trim()
            .toLowerCase();

    if (!value) {
        throw new Error(
            "Recipient email is required."
        );
    }

    const valid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (!valid) {
        throw new Error(
            "Invalid recipient email address."
        );
    }

    return value;

}


function normalizeName(name) {

    return String(
        name || "AP Synapse User"
    ).trim();

}


// ============================================================
// HTML SECURITY
// ============================================================

function escapeHtml(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// PREMIUM EMAIL DOCUMENT
// ============================================================

function buildEmailDocument({

    title,
    preheader = "",
    body

}) {

    const safeTitle =
        escapeHtml(title);

    const safePreheader =
        escapeHtml(preheader);

    return `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width,initial-scale=1.0"
>

<meta
    name="color-scheme"
    content="dark light"
>

<title>${safeTitle}</title>

</head>

<body
style="
    margin:0;
    padding:0;
    background:#0b0c0d;
    color:#f5f5f5;
    font-family:Arial,Helvetica,sans-serif;
"
>

<div
style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
"
>
${safePreheader}
</div>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#0b0c0d;"
>

<tr>

<td
    align="center"
    style="padding:40px 16px;"
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width:620px;
        background:#121416;
        border:1px solid #292d31;
        border-radius:18px;
        overflow:hidden;
    "
>

<tr>

<td
style="
    padding:28px 30px 20px;
    border-bottom:1px solid #292d31;
"
>

<div
style="
    font-size:19px;
    font-weight:700;
    letter-spacing:.3px;
"
>
AP Synapse
</div>

<div
style="
    margin-top:6px;
    font-size:12px;
    color:#9da3aa;
    letter-spacing:.5px;
"
>
THE NEXT GENERATION OF ARTIFICIAL INTELLIGENCE
</div>

</td>

</tr>

<tr>

<td
style="
    padding:32px 30px;
    font-size:15px;
    line-height:1.7;
"
>

${body}

</td>

</tr>

<tr>

<td
style="
    padding:20px 30px 26px;
    border-top:1px solid #292d31;
    color:#858b92;
    font-size:12px;
    line-height:1.6;
"
>

AP Synapse<br>
The next generation of artificial intelligence.

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>`;

}


// ============================================================
// CORE EMAIL SENDER
// ============================================================

export async function sendAPSynapseEmail({

    to,
    name = "AP Synapse User",
    subject,
    htmlContent,
    textContent,
    tags = [],
    replyToOverride

}) {

    assertConfiguration();

    const recipient =
        validateEmail(to);

    const recipientName =
        normalizeName(name);

    if (!subject) {
        throw new Error(
            "Email subject is required."
        );
    }

    if (!htmlContent && !textContent) {
        throw new Error(
            "Email content is required."
        );
    }

    const request = {

        sender,

        to: [
            {
                email: recipient,
                name: recipientName
            }
        ],

        subject,

        htmlContent,

        textContent,

        tags: [
            "ap-synapse",
            "transactional",
            ...tags
        ]

    };

    const finalReplyTo =
        replyToOverride ||
        replyTo;

    if (finalReplyTo) {
        request.replyTo =
            finalReplyTo;
    }

    try {

        const result =
            await brevo
                .transactionalEmails
                .sendTransacEmail(request);

        console.log(
            `✉️ ${SERVICE_NAME}: email sent`,
            {
                recipient,
                subject,
                messageId:
                    result?.messageId ||
                    null
            }
        );

        return result;

    }

    catch (error) {

        console.error(
            `❌ ${SERVICE_NAME}: email failed`,
            {
                recipient,
                subject,
                statusCode:
                    error?.statusCode,
                message:
                    error?.message
            }
        );

        throw error;

    }

}


// ============================================================
// WELCOME EMAIL
// ============================================================

export async function sendWelcomeEmail({

    email,
    name

}) {

    const safeName =
        escapeHtml(
            normalizeName(name)
        );

    const safeEmail =
        escapeHtml(
            validateEmail(email)
        );

    return sendAPSynapseEmail({

        to: email,

        name,

        subject:
            "Welcome to AP Synapse",

        tags: [
            "welcome",
            "account"
        ],

        textContent:
`Welcome to AP Synapse, ${normalizeName(name)}.

Your Google account has been successfully connected to AP Synapse.

Your intelligence workspace is ready.

Account: ${safeEmail}

— AP Synapse`,

        htmlContent:
            buildEmailDocument({

                title:
                    "Welcome to AP Synapse",

                preheader:
                    "Your AP Synapse workspace is ready.",

                body: `

<h1
style="
    margin:0 0 14px;
    font-size:26px;
    line-height:1.25;
"
>
Welcome to AP Synapse.
</h1>

<p>
Hello ${safeName},
</p>

<p>
Your Google account has been successfully connected to AP Synapse.
</p>

<p>
Your intelligence workspace is ready.
</p>

<div
style="
    margin:24px 0;
    padding:16px 18px;
    background:#191c1f;
    border:1px solid #30353a;
    border-radius:12px;
"
>

<div
style="
    color:#8f969e;
    font-size:12px;
    margin-bottom:5px;
"
>
CONNECTED ACCOUNT
</div>

<div>
${safeEmail}
</div>

</div>

<p>
Welcome to AP Synapse.
</p>

`

            })

    });

}


// ============================================================
// GOOGLE SIGN-IN SECURITY EMAIL
// ============================================================

export async function sendSignInNotification({

    email,
    name

}) {

    const safeName =
        escapeHtml(
            normalizeName(name)
        );

    return sendAPSynapseEmail({

        to: email,

        name,

        subject:
            "New sign-in to your AP Synapse account",

        tags: [
            "security",
            "google-signin",
            "authentication"
        ],

        textContent:
`Hello ${normalizeName(name)}.

Your AP Synapse account was just signed in to using Google.

If this was you, no action is required.

If you do not recognize this activity, please review your AP Synapse account security.

— AP Synapse`,

        htmlContent:
            buildEmailDocument({

                title:
                    "New AP Synapse sign-in",

                preheader:
                    "A new sign-in to your AP Synapse account was detected.",

                body: `

<h1
style="
    margin:0 0 14px;
    font-size:26px;
    line-height:1.25;
"
>
New sign-in detected.
</h1>

<p>
Hello ${safeName},
</p>

<p>
Your AP Synapse account was just signed in to using Google.
</p>

<div
style="
    margin:24px 0;
    padding:16px 18px;
    background:#191c1f;
    border:1px solid #30353a;
    border-radius:12px;
"
>

<strong>
If this was you
</strong>

<div
style="
    margin-top:6px;
    color:#a7adb4;
"
>
No action is required.
</div>

</div>

<p>
If you do not recognize this activity, please review your AP Synapse account security.
</p>

`

            })

    });

}


// ============================================================
// ACCOUNT SECURITY EMAIL
// ============================================================

export async function sendSecurityNotification({

    email,

    name,

    title =
        "AP Synapse security notification",

    message,

    subject =
        "Security notification — AP Synapse"

}) {

    const safeName =
        escapeHtml(
            normalizeName(name)
        );

    const safeMessage =
        escapeHtml(
            message ||
            "A security-related event occurred on your AP Synapse account."
        );

    const safeTitle =
        escapeHtml(title);

    return sendAPSynapseEmail({

        to: email,

        name,

        subject,

        tags: [
            "security"
        ],

        textContent:
`Hello ${normalizeName(name)}.

${message || "A security-related event occurred on your AP Synapse account."}

— AP Synapse`,

        htmlContent:
            buildEmailDocument({

                title: safeTitle,

                preheader:
                    "Important security information from AP Synapse.",

                body: `

<h1
style="
    margin:0 0 14px;
    font-size:26px;
    line-height:1.25;
"
>
${safeTitle}
</h1>

<p>
Hello ${safeName},
</p>

<div
style="
    margin:22px 0;
    padding:18px;
    background:#191c1f;
    border:1px solid #30353a;
    border-radius:12px;
"
>
${safeMessage}
</div>

`

            })

    });

}


// ============================================================
// GENERIC ACCOUNT EVENT EMAIL
// ============================================================

export async function sendAccountEventEmail({

    email,

    name,

    subject,

    title,

    message,

    tag = "account"

}) {

    const safeName =
        escapeHtml(
            normalizeName(name)
        );

    const safeTitle =
        escapeHtml(
            title ||
            "AP Synapse account update"
        );

    const safeMessage =
        escapeHtml(
            message || ""
        );

    return sendAPSynapseEmail({

        to: email,

        name,

        subject:
            subject ||
            "AP Synapse account update",

        tags: [
            tag,
            "account"
        ],

        textContent:
`Hello ${normalizeName(name)}.

${message || ""}

— AP Synapse`,

        htmlContent:
            buildEmailDocument({

                title:
                    safeTitle,

                body: `

<h1
style="
    margin:0 0 14px;
    font-size:26px;
    line-height:1.25;
"
>
${safeTitle}
</h1>

<p>
Hello ${safeName},
</p>

<p>
${safeMessage}
</p>

`

            })

    });

}


// ============================================================
// SYSTEM NOTIFICATION
// ============================================================

export async function sendSystemNotification({

    email,

    name = "AP Synapse User",

    subject =
        "AP Synapse system notification",

    message

}) {

    return sendAccountEventEmail({

        email,

        name,

        subject,

        title:
            "AP Synapse system notification",

        message,

        tag:
            "system"

    });

}


// ============================================================
// WORKSPACE NOTIFICATION
// ============================================================

export async function sendWorkspaceNotification({

    email,

    name,

    subject =
        "AP Synapse workspace update",

    title =
        "Workspace update",

    message

}) {

    return sendAccountEventEmail({

        email,

        name,

        subject,

        title,

        message,

        tag:
            "workspace"

    });

}


// ============================================================
// EMAIL SERVICE STATUS
// ============================================================

export function isEmailServiceConfigured() {

    return Boolean(
        process.env.BREVO_API_KEY &&
        process.env.BREVO_SENDER_EMAIL
    );

}


export function getEmailServiceStatus() {

    return {

        service:
            SERVICE_NAME,

        configured:
            isEmailServiceConfigured(),

        senderConfigured:
            Boolean(sender.email),

        replyToConfigured:
            Boolean(replyTo),

        provider:
            "Brevo"

    };

}


// ============================================================
// SAFE HELPERS
// ============================================================

export {
    escapeHtml
};
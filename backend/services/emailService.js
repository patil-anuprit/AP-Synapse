import { BrevoClient } from "@getbrevo/brevo";

// ============================================================
// AP SYNAPSE — EMAIL SERVICE
// Production transactional email gateway
// ============================================================

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,

    // Brevo currently supports automatic retries for
    // retryable failures such as 408, 429 and 5xx.
    maxRetries: 3,

    // Keep transactional authentication responsive.
    timeoutInSeconds: 30
});

const SERVICE_NAME = "AP Synapse Email Service";

const sender = {
    name:
        process.env.BREVO_SENDER_NAME ||
        "AP Synapse",

    email:
        process.env.BREVO_SENDER_EMAIL || ""
};

const replyTo =
    process.env.BREVO_REPLY_TO_EMAIL
        ? {
            email: process.env.BREVO_REPLY_TO_EMAIL,
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

    // Practical application-level validation.
    // Brevo remains the final authority on deliverability.
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
// EMAIL LAYOUT
// ============================================================

function buildEmailDocument({
    title,
    preheader = "",
    body
}) {

    return `
<!DOCTYPE html>

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

<title>${escapeHtml(title)}</title>

</head>

<body style="
    margin:0;
    padding:0;
    background:#0b0c0e;
    color:#f5f5f5;
    font-family:
        Arial,
        Helvetica,
        sans-serif;
">

<div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
    color:transparent;
">
${escapeHtml(preheader)}
</div>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="
        width:100%;
        background:#0b0c0e;
        padding:40px 16px;
    "
>

<tr>

<td align="center">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="
        width:100%;
        max-width:620px;
        background:#151719;
        border:1px solid #292b2e;
        border-radius:18px;
        overflow:hidden;
    "
>

<tr>

<td style="
    padding:28px 34px;
    border-bottom:1px solid #292b2e;
">

<div style="
    font-size:13px;
    letter-spacing:2px;
    font-weight:600;
    color:#c9a85c;
">
AP SYNAPSE
</div>

</td>

</tr>

<tr>

<td style="
    padding:38px 34px;
">

${body}

</td>

</tr>

<tr>

<td style="
    padding:22px 34px;
    border-top:1px solid #292b2e;
">

<div style="
    color:#777b80;
    font-size:12px;
    line-height:1.7;
">

AP Synapse<br>

The next generation of artificial intelligence.

</div>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`;

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

<h1 style="
    margin:0 0 18px;
    font-size:30px;
    line-height:1.2;
    font-weight:500;
    color:#ffffff;
">
Welcome, ${safeName}.
</h1>

<p style="
    margin:0 0 18px;
    color:#c7c9cc;
    font-size:15px;
    line-height:1.7;
">
Your Google account has been successfully connected
to AP Synapse.
</p>

<p style="
    margin:0 0 28px;
    color:#c7c9cc;
    font-size:15px;
    line-height:1.7;
">
Your intelligence workspace is ready.
</p>

<div style="
    padding:18px 20px;
    background:#101214;
    border:1px solid #292b2e;
    border-radius:12px;
">

<div style="
    color:#c9a85c;
    font-size:12px;
    letter-spacing:1.2px;
    margin-bottom:7px;
">
ACCOUNT
</div>

<div style="
    color:#eeeeee;
    font-size:14px;
">
${safeEmail}
</div>

</div>

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

<h1 style="
    margin:0 0 18px;
    font-size:28px;
    line-height:1.2;
    font-weight:500;
">
New sign-in detected
</h1>

<p style="
    color:#c7c9cc;
    font-size:15px;
    line-height:1.7;
">
Hello ${safeName}.
</p>

<p style="
    color:#c7c9cc;
    font-size:15px;
    line-height:1.7;
">
Your AP Synapse account was just signed in to using
Google.
</p>

<div style="
    margin-top:25px;
    padding:18px 20px;
    background:#101214;
    border:1px solid #292b2e;
    border-radius:12px;
    color:#c7c9cc;
    font-size:14px;
    line-height:1.7;
">

If this was you, no action is required.

</div>

<p style="
    margin-top:25px;
    color:#85888c;
    font-size:12px;
    line-height:1.7;
">
If you do not recognize this activity, please review
your AP Synapse account security.
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

                title,

                preheader:
                    "Important security information from AP Synapse.",

                body: `

<h1 style="
    margin:0 0 18px;
    font-size:28px;
    font-weight:500;
">
${escapeHtml(title)}
</h1>

<p style="
    color:#c7c9cc;
    line-height:1.7;
">
Hello ${safeName}.
</p>

<div style="
    margin-top:24px;
    padding:20px;
    background:#101214;
    border:1px solid #292b2e;
    border-radius:12px;
    color:#c7c9cc;
    line-height:1.7;
">
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

                title: safeTitle,

                body: `

<h1 style="
    margin:0 0 18px;
    font-size:28px;
    font-weight:500;
">
${safeTitle}
</h1>

<p style="
    color:#c7c9cc;
    line-height:1.7;
">
Hello ${safeName}.
</p>

<p style="
    color:#c7c9cc;
    line-height:1.7;
">
${safeMessage}
</p>

`

            })

    });

}


// ============================================================
// SYSTEM / ADMIN NOTIFICATION
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
// AI / WORKSPACE NOTIFICATION
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
// SERVICE HEALTH CHECK
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
// EXPORT SAFE HELPERS
// ============================================================

export {
    escapeHtml
};
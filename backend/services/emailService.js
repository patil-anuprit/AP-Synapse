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

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

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

    if (!subject) {
        throw new Error("Email subject is required.");
    }

    const result =
        await brevo.transactionalEmails.sendTransacEmail({
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


// =========================================================
// AP SYNAPSE — WELCOME EMAIL
// =========================================================

export async function sendWelcomeEmail({
    email,
    name
}) {
    const safeName =
        escapeHtml(name || "AP Synapse User");

    return sendAPSynapseEmail({
        to: email,
        name,

        subject:
            "Welcome to AP Synapse",

        textContent:
`Welcome to AP Synapse, ${name}.

Your Google account has been successfully connected to AP Synapse.

Your intelligence workspace is ready.

— AP Synapse`,

        htmlContent: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width, initial-scale=1.0">
<title>Welcome to AP Synapse</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#0b0c0e;
    color:#f5f5f5;
    font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#0b0c0e;padding:40px 16px;">

<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
       style="
            max-width:620px;
            background:#151719;
            border:1px solid #292b2e;
            border-radius:18px;
            overflow:hidden;
       ">

<tr>
<td style="
    padding:30px 34px;
    border-bottom:1px solid #292b2e;
">

<div style="
    font-size:13px;
    letter-spacing:2px;
    color:#c9a85c;
    font-weight:600;
">
AP SYNAPSE
</div>

</td>
</tr>

<tr>
<td style="padding:38px 34px;">

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
    text-transform:uppercase;
    margin-bottom:7px;
">
Account
</div>

<div style="
    color:#eeeeee;
    font-size:14px;
">
${escapeHtml(email)}
</div>

</div>

<p style="
    margin:30px 0 0;
    color:#85888c;
    font-size:12px;
    line-height:1.6;
">
If you did not connect this Google account to AP Synapse,
please review your account activity.
</p>

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
    line-height:1.6;
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
`
    });
}


// =========================================================
// AP SYNAPSE — SIGN-IN SECURITY EMAIL
// =========================================================

export async function sendSignInNotification({
    email,
    name
}) {
    const safeName =
        escapeHtml(name || "AP Synapse User");

    return sendAPSynapseEmail({
        to: email,
        name,

        subject:
            "New sign-in to your AP Synapse account",

        textContent:
`Hello ${name},

Your AP Synapse account was just signed in with Google.

If this was you, no action is required.

If you do not recognize this activity, please review your account security.

— AP Synapse`,

        htmlContent: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1.0">
<title>AP Synapse Security Notification</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#0b0c0e;
    color:#fff;
    font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0"
style="padding:40px 16px;background:#0b0c0e;">

<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
style="
    max-width:620px;
    background:#151719;
    border:1px solid #292b2e;
    border-radius:18px;
">

<tr>
<td style="padding:30px 34px;">

<div style="
    color:#c9a85c;
    font-size:13px;
    letter-spacing:2px;
    font-weight:600;
">
AP SYNAPSE
</div>

<h1 style="
    margin:30px 0 16px;
    font-size:26px;
    font-weight:500;
">
New sign-in detected
</h1>

<p style="
    color:#c7c9cc;
    line-height:1.7;
    font-size:15px;
">
Hello ${safeName},
</p>

<p style="
    color:#c7c9cc;
    line-height:1.7;
    font-size:15px;
">
Your AP Synapse account was just accessed using
Google Sign-In.
</p>

<div style="
    margin-top:25px;
    padding:18px;
    border-radius:12px;
    background:#101214;
    border:1px solid #292b2e;
    color:#bfc2c6;
    font-size:14px;
">
If this was you, no action is required.
</div>

<p style="
    margin-top:25px;
    color:#85888c;
    font-size:12px;
    line-height:1.6;
">
If you do not recognize this activity, please review
your AP Synapse account security.
</p>

</td>
</tr>

<tr>
<td style="
    padding:22px 34px;
    border-top:1px solid #292b2e;
    color:#777b80;
    font-size:12px;
">
AP Synapse — The next generation of artificial intelligence.
</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`
    });
}
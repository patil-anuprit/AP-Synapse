import express from "express";
import { createAIStream } from "./router.js";

const router = express.Router();

const MAX_ACTIONS = 6;

const SYSTEM_PROMPT = `
You are the Aprisha Android action planner inside AP Synapse.

Your job is NOT to chat.
Your job is to decide whether the user's request can be executed with the
currently supported Aprisha Android action tools.

Return JSON only. Never use markdown or code fences.

Allowed top-level schemas:

1)
{
  "type": "device_plan",
  "summary": "short description",
  "requires_confirmation": false,
  "actions": [
    {
      "command": "natural command that the Android native router already understands",
      "label": "short human readable step"
    }
  ],
  "success_reply": "short spoken completion message"
}

2)
{
  "type": "chat"
}

Supported Android command families:
- call / phone / ring a contact
- message / text / sms a contact, optionally with message text
- open / launch / start an installed app
- navigate to / directions to / take me to a destination
- set or start a timer
- set an alarm
- flashlight on or off
- volume up / down / mute / unmute / percentage where supported
- media play / pause / next / previous where supported

Rules:
- Use at most 6 actions.
- Keep every action as a command that can be executed locally on Android.
- If the user asks a normal knowledge question, research request, writing task,
  image task, document task, or anything not executable by those Android
  command families, return {"type":"chat"}.
- Never invent device capabilities.
- Never plan financial transactions, purchases, password/account changes,
  security bypasses, permission bypasses, hidden surveillance, or destructive
  actions.
- A plan containing a phone call or message must set
  "requires_confirmation": true.
- If several supported device actions are requested in one sentence, create a
  multi-step device_plan.
- Do not add extra commentary outside JSON.

Examples:

User: Open YouTube and then set a timer for 10 minutes
Return:
{
  "type":"device_plan",
  "summary":"Open YouTube and start a 10 minute timer",
  "requires_confirmation":false,
  "actions":[
    {"command":"open youtube","label":"Open YouTube"},
    {"command":"set timer for 10 minutes","label":"Start 10 minute timer"}
  ],
  "success_reply":"Done."
}

User: Call Mom and then open Maps
Return:
{
  "type":"device_plan",
  "summary":"Call Mom and open Maps",
  "requires_confirmation":true,
  "actions":[
    {"command":"call mom","label":"Call Mom"},
    {"command":"open maps","label":"Open Maps"}
  ],
  "success_reply":"Done."
}

User: Explain photosynthesis
Return:
{"type":"chat"}
`;

function stripFences(value) {
    return String(value || "")
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function isAllowedCommand(value) {
    const command = String(value || "").trim().toLowerCase();

    if (!command) return false;

    return (
        /^(?:please\s+)?(?:call|phone|ring)\s+.+/.test(command) ||
        /^(?:please\s+)?(?:message|text|sms)\s+.+/.test(command) ||
        /^(?:please\s+)?(?:open|launch|start)\s+.+/.test(command) ||
        /^(?:please\s+)?(?:navigate to|directions to|take me to|go to)\s+.+/.test(command) ||
        /(?:set|start)\s+(?:a\s+)?timer\b/.test(command) ||
        /\bset\s+(?:an?\s+)?alarm\b/.test(command) ||
        /\bflashlight\b/.test(command) ||
        /^(?:volume|mute|unmute)\b/.test(command) ||
        /^(?:play|pause|resume|next|previous|skip)\b/.test(command)
    );
}

function isConsequential(value) {
    const command = String(value || "").trim().toLowerCase();

    return (
        /^(?:please\s+)?(?:call|phone|ring)\s+/.test(command) ||
        /^(?:please\s+)?(?:message|text|sms)\s+/.test(command)
    );
}

async function collectAIText(messages) {
    const stream = await createAIStream(messages);

    let result = "";

    for await (const chunk of stream) {
        result += chunk?.choices?.[0]?.delta?.content || "";
    }

    return result.trim();
}

router.post("/plan", async (req, res) => {
    const message = String(req.body?.message || "").trim();

    if (!message) {
        return res.status(400).json({
            type: "chat",
            error: "Message is required."
        });
    }

    try {
        const raw = await collectAIText([
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user",
                content: message
            }
        ]);

        let plan;

        try {
            plan = JSON.parse(stripFences(raw));
        } catch {
            return res.json({
                type: "chat"
            });
        }

        if (
            !plan ||
            plan.type !== "device_plan" ||
            !Array.isArray(plan.actions)
        ) {
            return res.json({
                type: "chat"
            });
        }

        const actions = plan.actions
            .map((action) => ({
                command: String(action?.command || "").trim(),
                label: String(action?.label || "").trim()
            }))
            .filter((action) => isAllowedCommand(action.command))
            .slice(0, MAX_ACTIONS);

        if (!actions.length) {
            return res.json({
                type: "chat"
            });
        }

        const consequential =
            actions.some((action) =>
                isConsequential(action.command)
            );

        return res.json({
            type: "device_plan",
            summary:
                String(plan.summary || "Complete this task")
                    .trim()
                    .slice(0, 240),
            requires_confirmation:
                Boolean(plan.requires_confirmation) ||
                consequential,
            actions,
            success_reply:
                String(plan.success_reply || "Done.")
                    .trim()
                    .slice(0, 160)
        });
    } catch (error) {
        console.error(
            "APRISHA AGENT PLAN ERROR:",
            error
        );

        return res.json({
            type: "chat"
        });
    }
});

export default router;
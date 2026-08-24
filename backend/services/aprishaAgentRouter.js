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


// ============================================================
// AP_APRISHA_CLOSED_LOOP_BACKEND_V12
// Aprisha V12: Plan -> Act -> Observe -> Replan
// ============================================================

const APRISHA_V12_LOOP_PROMPT = `
You are Aprisha V12, the closed-loop Android task controller inside AP Synapse.

Your job is to choose exactly ONE next executable Android action.

You receive:
- the user's original goal
- a ledger containing actions already attempted
- the real response returned by Aprisha's Android tools

You must use those real results when deciding what to do next.

Return JSON only. No markdown.

If another action is required:

{
  "type": "agent_step",
  "done": false,
  "summary": "short description",
  "requires_confirmation": false,
  "action": {
    "command": "one supported Aprisha command",
    "label": "short spoken label"
  }
}

If the task is finished:

{
  "type": "agent_step",
  "done": true,
  "success_reply": "short truthful completion response"
}

If the request cannot be executed with supported Android tools:

{
  "type": "chat"
}

SUPPORTED ACTION FAMILIES:

- call / phone / ring a contact
- message / text / sms a contact
- open / launch / start an app
- navigate to / directions to / take me to a destination
- timer
- alarm
- flashlight
- volume / mute / unmute
- media play / pause / next / previous
- battery level
- Android settings
- camera
- web search
- calendar today / tomorrow
- free time today / tomorrow
- reminders
- tomorrow calendar-event preparation
- current time
- current date

RULES:

- Choose only ONE action at a time.
- Maximum overall execution is six steps.
- Read the previous ledger before choosing.
- Never repeat a successful action unless repetition is explicitly required.
- Never claim success unless the ledger shows success.
- If a previous action was blocked, choose a safe alternative only if one exists.
- Calls and messages require confirmation.
- Never perform purchases or financial transactions.
- Never change passwords or account security.
- Never bypass permissions or Android security.
- Never perform hidden monitoring or surveillance.
- Never perform destructive actions.
- Never invent device capabilities.
`;


function aprishaV12AllowedCommand(value) {

    const command =
        String(value || "")
            .trim()
            .toLowerCase();

    if (!command) return false;

    return (
        /^(?:please\s+)?(?:call|phone|ring)(?:\s+to)?\s+.+/.test(command) ||

        /^(?:please\s+)?(?:message|text|sms)(?:\s+to)?\s+.+/.test(command) ||

        /^(?:please\s+)?(?:open|launch|start)\s+.+/.test(command) ||

        /^(?:please\s+)?(?:navigate to|directions to|take me to|go to)\s+.+/.test(command) ||

        /(?:set|start)\s+(?:a\s+)?timer\b/.test(command) ||

        /\bset\s+(?:an?\s+)?alarm\b/.test(command) ||

        /\bflashlight\b/.test(command) ||

        /^(?:volume|mute|unmute)\b/.test(command) ||

        /^(?:play|pause|resume|next|previous|skip)\b/.test(command) ||

        /^(?:battery|battery level|what(?:'s| is) my battery|how much battery)/.test(command) ||

        /^(?:open\s+)?(?:wi-?fi|bluetooth|display|screen|sound|notification|location|gps|phone|device)?\s*settings$/.test(command) ||

        /^(?:open|launch)\s+camera$/.test(command) ||

        /^(?:search the web for|search web for|search online for|web search for|look up)\s+.+/.test(command) ||

        /^(?:what do i have|what is on my calendar|show my calendar)\s+(?:today|tomorrow)\??$/.test(command) ||

        /^(?:when am i free|when do i have free time)\s+(?:today|tomorrow)\??$/.test(command) ||

        /^remind me in\s+\d+\s+(?:minutes?|hours?)(?:\s+to\s+.+)?$/.test(command) ||

        /^remind me tomorrow at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)(?:\s+to\s+.+)?$/.test(command) ||

        /^(?:add|create)\s+(?:an?\s+)?event\s+.+\s+tomorrow\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)$/.test(command) ||

        /^(?:what time is it|tell me the time|current time)$/.test(command) ||

        /^(?:what is the date|what date is it|todays date|current date)$/.test(command)
    );
}


function aprishaV12Consequential(value) {

    const command =
        String(value || "")
            .trim()
            .toLowerCase();

    return (
        /^(?:please\s+)?(?:call|phone|ring)(?:\s+to)?\s+/.test(command) ||
        /^(?:please\s+)?(?:message|text|sms)(?:\s+to)?\s+/.test(command)
    );
}


router.post("/loop", async (req, res) => {

    const goal =
        String(req.body?.goal || "")
            .trim()
            .slice(0, 1200);

    if (!goal) {
        return res.status(400).json({
            type: "chat",
            error: "Goal is required."
        });
    }


    const ledger =
        Array.isArray(req.body?.ledger)
            ? req.body.ledger
                .slice(0, MAX_ACTIONS)
                .map((entry, index) => ({
                    step:
                        Number(entry?.step || index + 1),

                    command:
                        String(entry?.command || "")
                            .trim()
                            .slice(0, 320),

                    label:
                        String(entry?.label || "")
                            .trim()
                            .slice(0, 160),

                    status:
                        String(entry?.status || "")
                            .trim()
                            .slice(0, 40),

                    response:
                        String(entry?.response || "")
                            .trim()
                            .slice(0, 800)
                }))
            : [];


    if (ledger.length >= MAX_ACTIONS) {

        return res.json({
            type: "agent_step",
            done: true,
            success_reply:
                "I reached the safe six-step limit for this task."
        });
    }


    try {

        const state =
            JSON.stringify(
                {
                    goal,
                    completed_steps: ledger,
                    steps_remaining:
                        MAX_ACTIONS - ledger.length
                },
                null,
                2
            );


        const raw =
            await collectAIText([
                {
                    role: "system",
                    content:
                        APRISHA_V12_LOOP_PROMPT
                },
                {
                    role: "user",
                    content: state
                }
            ]);


        let decision;

        try {

            decision =
                JSON.parse(
                    stripFences(raw)
                );

        } catch {

            if (ledger.length > 0) {

                return res.json({
                    type: "agent_step",
                    done: true,
                    success_reply:
                        "I completed part of the task, but I couldn't safely determine the next step."
                });
            }

            return res.json({
                type: "chat"
            });
        }


        if (
            !decision ||
            decision.type === "chat"
        ) {

            return res.json({
                type: "chat"
            });
        }


        if (decision.done === true) {

            return res.json({
                type: "agent_step",
                done: true,
                success_reply:
                    String(
                        decision.success_reply ||
                        "Done."
                    )
                        .trim()
                        .slice(0, 240)
            });
        }


        const command =
            String(
                decision.action?.command ||
                ""
            ).trim();


        const label =
            String(
                decision.action?.label ||
                command
            )
                .trim()
                .slice(0, 160);


        if (
            !command ||
            !aprishaV12AllowedCommand(command)
        ) {

            if (ledger.length > 0) {

                return res.json({
                    type: "agent_step",
                    done: true,
                    success_reply:
                        "I couldn't find another supported Android action to safely continue."
                });
            }

            return res.json({
                type: "chat"
            });
        }


        return res.json({

            type:
                "agent_step",

            done:
                false,

            summary:
                String(
                    decision.summary ||
                    label ||
                    "Continue task"
                )
                    .trim()
                    .slice(0, 240),

            requires_confirmation:
                Boolean(
                    decision.requires_confirmation
                )
                ||
                aprishaV12Consequential(
                    command
                ),

            action: {
                command:
                    command.slice(
                        0,
                        320
                    ),

                label
            }
        });

    } catch (error) {

        console.error(
            "APRISHA V12 LOOP ERROR:",
            error
        );


        if (ledger.length > 0) {

            return res.json({
                type: "agent_step",
                done: true,
                success_reply:
                    "I completed part of the task, but the planning service became unavailable."
            });
        }


        return res.json({
            type: "chat"
        });
    }
});


export default router;
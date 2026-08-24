package com.apsynapse.app.presence;

// AP_APRISHA_CLOSED_LOOP_AGENT_V12

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;

import java.net.HttpURLConnection;
import java.net.URL;

import java.nio.charset.StandardCharsets;

import java.util.Locale;


public final class AprishaClosedLoopAgent {

    private static final String LOOP_API =
            "https://ap-synapse-backend.onrender.com/aprisha/loop";

    private static final String PREFS =
            "aprisha_closed_loop_v12";

    private static final String KEY_PENDING =
            "pending_state";

    private static final String KEY_PENDING_UNTIL =
            "pending_until";

    private static final long CONFIRM_WINDOW_MS =
            90_000L;

    private static final int MAX_STEPS =
            6;


    private AprishaClosedLoopAgent() {}


    // =====================================================
    // PUBLIC RESULT
    // =====================================================

    public static final class Result {

        public final boolean handled;
        public final String response;

        private Result(
                boolean handled,
                String response
        ) {

            this.handled = handled;

            this.response =
                    response == null
                            ? ""
                            : response;
        }


        public static Result handled(
                String response
        ) {

            return new Result(
                    true,
                    response
            );
        }


        public static Result ignored() {

            return new Result(
                    false,
                    ""
            );
        }
    }


    // =====================================================
    // INTERNAL TOOL RESULT
    // =====================================================

    private static final class ToolResult {

        final String status;
        final String response;

        ToolResult(
                String status,
                String response
        ) {

            this.status =
                    status == null
                            ? "unsupported"
                            : status;

            this.response =
                    response == null
                            ? ""
                            : response;
        }
    }


    // =====================================================
    // PENDING CONFIRMATION
    // =====================================================

    public static boolean hasPending(
            Context context
    ) {

        if (context == null) {
            return false;
        }

        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
                );

        String state =
                prefs.getString(
                        KEY_PENDING,
                        ""
                );

        long until =
                prefs.getLong(
                        KEY_PENDING_UNTIL,
                        0L
                );

        if (
                state == null ||
                state.trim().isEmpty()
        ) {

            return false;
        }

        if (
                System.currentTimeMillis() >
                until
        ) {

            clearPending(
                    prefs
            );

            return false;
        }

        return true;
    }


    // =====================================================
    // COMPOUND-TASK DETECTION
    // =====================================================

    public static boolean looksCandidate(
            String original
    ) {

        if (original == null) {
            return false;
        }

        String command =
                original
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (command.isEmpty()) {
            return false;
        }

        boolean chained =
                command.contains(" and then ")
                ||
                command.contains(" then ")
                ||
                command.contains(", then ")
                ||
                command.contains(" after that")
                ||
                command.contains(" followed by ")
                ||
                command.contains(" before it")
                ||
                command.contains(" after it")
                ||
                command.contains(" before my ")
                ||
                command.contains(" after my ");

        if (!chained) {
            return false;
        }

        return
                command.matches(
                        ".*\\b(" +
                        "call|" +
                        "phone|" +
                        "ring|" +
                        "message|" +
                        "text|" +
                        "sms|" +
                        "open|" +
                        "launch|" +
                        "start|" +
                        "navigate|" +
                        "directions|" +
                        "timer|" +
                        "alarm|" +
                        "flashlight|" +
                        "volume|" +
                        "mute|" +
                        "unmute|" +
                        "play|" +
                        "pause|" +
                        "battery|" +
                        "settings|" +
                        "camera|" +
                        "search|" +
                        "remind|" +
                        "calendar|" +
                        "free" +
                        ")\\b.*"
                )
                ||
                command.contains(
                        "what do i have"
                )
                ||
                command.contains(
                        "when am i free"
                );
    }


    // =====================================================
    // MAIN ROUTER
    // =====================================================

    public static Result route(
            Context context,
            String original
    ) {

        if (
                context == null ||
                original == null
        ) {

            return Result.ignored();
        }

        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
                );


        // -------------------------------------------------
        // RESUME A PENDING CONSEQUENTIAL ACTION
        // -------------------------------------------------

        if (
                hasPending(
                        context
                )
        ) {

            String reply =
                    original
                            .trim()
                            .toLowerCase(
                                    Locale.ROOT
                            );


            if (
                    isCancellation(
                            reply
                    )
            ) {

                clearPending(
                        prefs
                );

                return Result.handled(
                        "Cancelled."
                );
            }


            if (
                    !isConfirmation(
                            reply
                    )
            ) {

                return Result.handled(
                        "That step needs confirmation. Say yes to continue or cancel."
                );
            }


            String saved =
                    prefs.getString(
                            KEY_PENDING,
                            ""
                    );


            clearPending(
                    prefs
            );


            try {

                JSONObject state =
                        new JSONObject(
                                saved
                        );

                String goal =
                        state.optString(
                                "goal",
                                ""
                        );

                JSONArray ledger =
                        state.optJSONArray(
                                "ledger"
                        );

                if (ledger == null) {
                    ledger =
                            new JSONArray();
                }

                JSONObject action =
                        state.optJSONObject(
                                "action"
                        );

                if (action == null) {

                    return Result.handled(
                            "I couldn't restore that pending step."
                    );
                }


                ToolResult execution =
                        executeTool(
                                context,
                                action.optString(
                                        "command",
                                        ""
                                )
                        );


                appendLedger(
                        ledger,
                        action,
                        execution
                );


                return continueLoop(
                        context,
                        goal,
                        ledger
                );

            }
            catch (Throwable error) {

                return Result.handled(
                        "I couldn't restore that pending task."
                );
            }
        }


        // -------------------------------------------------
        // ONLY CLAIM COMPOUND TASKS
        // -------------------------------------------------

        if (
                !looksCandidate(
                        original
                )
        ) {

            return Result.ignored();
        }


        return continueLoop(
                context,
                original.trim(),
                new JSONArray()
        );
    }


    // =====================================================
    // CLOSED LOOP
    // =====================================================

    private static Result continueLoop(
            Context context,
            String goal,
            JSONArray ledger
    ) {

        if (
                goal == null ||
                goal.trim().isEmpty()
        ) {

            return Result.ignored();
        }


        for (
                int guard = 0;
                guard < MAX_STEPS;
                guard++
        ) {

            if (
                    ledger.length() >=
                    MAX_STEPS
            ) {

                return Result.handled(
                        buildLimitReply(
                                ledger
                        )
                );
            }


            JSONObject decision =
                    requestDecision(
                            goal,
                            ledger
                    );


            if (decision == null) {

                if (
                        ledger.length() == 0
                ) {

                    return Result.ignored();
                }

                return Result.handled(
                        buildPartialReply(
                                ledger,
                                "I couldn't safely determine the next step."
                        )
                );
            }


            String type =
                    decision.optString(
                            "type",
                            ""
                    );


            if (
                    "chat".equals(
                            type
                    )
            ) {

                if (
                        ledger.length() == 0
                ) {

                    return Result.ignored();
                }

                return Result.handled(
                        buildPartialReply(
                                ledger,
                                "I couldn't continue with the available Android tools."
                        )
                );
            }


            if (
                    decision.optBoolean(
                            "done",
                            false
                    )
            ) {

                String finalReply =
                        decision.optString(
                                "success_reply",
                                ""
                        ).trim();


                if (
                        !finalReply.isEmpty()
                ) {

                    return Result.handled(
                            finalReply
                    );
                }


                return Result.handled(
                        buildPartialReply(
                                ledger,
                                "Done."
                        )
                );
            }


            JSONObject action =
                    decision.optJSONObject(
                            "action"
                    );


            if (action == null) {

                return Result.handled(
                        buildPartialReply(
                                ledger,
                                "I couldn't determine another supported step."
                        )
                );
            }


            String command =
                    action.optString(
                            "command",
                            ""
                    ).trim();


            if (command.isEmpty()) {

                return Result.handled(
                        buildPartialReply(
                                ledger,
                                "I couldn't determine another supported step."
                        )
                );
            }


            // Never silently repeat a successful command.

            if (
                    wasSuccessful(
                            ledger,
                            command
                    )
            ) {

                return Result.handled(
                        buildPartialReply(
                                ledger,
                                "I stopped because a completed step was about to be repeated."
                        )
                );
            }


            boolean needsConfirmation =
                    decision.optBoolean(
                            "requires_confirmation",
                            false
                    )
                    ||
                    isConsequential(
                            command
                    );


            if (needsConfirmation) {

                storePending(
                        context,
                        goal,
                        ledger,
                        action
                );


                String label =
                        action.optString(
                                "label",
                                command
                        ).trim();


                return Result.handled(
                        "I can " +
                        label +
                        ". Say yes to continue or cancel."
                );
            }


            ToolResult execution =
                    executeTool(
                            context,
                            command
                    );


            appendLedger(
                    ledger,
                    action,
                    execution
            );


            /*
             * No static-plan continuation occurs here.
             *
             * The loop now contacts AP Synapse again using
             * the ACTUAL result stored in the ledger.
             */
        }


        return Result.handled(
                buildLimitReply(
                        ledger
                )
        );
    }


    // =====================================================
    // TOOL EXECUTION REGISTRY
    // =====================================================

    private static ToolResult executeTool(
            Context context,
            String command
    ) {

        if (
                command == null ||
                command.trim().isEmpty()
        ) {

            return new ToolResult(
                    "unsupported",
                    "The requested action was empty."
            );
        }


        // -------------------------------------------------
        // V10 TIME + CALENDAR
        // -------------------------------------------------

        try {

            AprishaScheduleCore.Result schedule =
                    AprishaScheduleCore.route(
                            context,
                            command
                    );

            if (schedule.handled) {

                return classify(
                        schedule.response
                );
            }

        }
        catch (Throwable ignored) {}


        // -------------------------------------------------
        // V8 UNIVERSAL LOCAL CORE
        // -------------------------------------------------

        try {

            AprishaUniversalCore.Result universal =
                    AprishaUniversalCore.route(
                            context,
                            command
                    );

            if (universal.handled) {

                return classify(
                        universal.response
                );
            }

        }
        catch (Throwable ignored) {}


        // -------------------------------------------------
        // FULL NATIVE DEVICE ACTIONS
        // -------------------------------------------------

        try {

            PresenceDeviceActions.Result device =
                    PresenceDeviceActions.handle(
                            context,
                            command
                    );

            if (device.handled) {

                return classify(
                        device.response
                );
            }

        }
        catch (Throwable ignored) {}


        return new ToolResult(
                "unsupported",
                "That action is not available through Aprisha's current Android tools."
        );
    }


    // =====================================================
    // RESULT OBSERVATION
    // =====================================================

    private static ToolResult classify(
            String response
    ) {

        String value =
                response == null
                        ? ""
                        : response.trim();

        String lower =
                value.toLowerCase(
                        Locale.ROOT
                );


        boolean blocked =
                lower.contains("couldn't")
                ||
                lower.contains("could not")
                ||
                lower.contains("cannot ")
                ||
                lower.contains("can't ")
                ||
                lower.contains("permission")
                ||
                lower.contains("not available")
                ||
                lower.contains("isn't available")
                ||
                lower.contains("not supported")
                ||
                lower.contains("not found")
                ||
                lower.contains("couldn't find")
                ||
                lower.contains("isn't valid")
                ||
                lower.contains("invalid")
                ||
                lower.contains("failed")
                ||
                lower.contains("unable")
                ||
                lower.contains("required");


        String status =
                blocked
                        ? "blocked"
                        : "success";


        if (value.isEmpty()) {

            value =
                    blocked
                            ? "The action was blocked."
                            : "The action was dispatched.";
        }


        return new ToolResult(
                status,
                value
        );
    }


    // =====================================================
    // EXECUTION LEDGER
    // =====================================================

    private static void appendLedger(
            JSONArray ledger,
            JSONObject action,
            ToolResult result
    ) {

        try {

            JSONObject entry =
                    new JSONObject();

            entry.put(
                    "step",
                    ledger.length() + 1
            );

            entry.put(
                    "command",
                    action.optString(
                            "command",
                            ""
                    )
            );

            entry.put(
                    "label",
                    action.optString(
                            "label",
                            ""
                    )
            );

            entry.put(
                    "status",
                    result.status
            );

            entry.put(
                    "response",
                    result.response
            );

            ledger.put(
                    entry
            );

        }
        catch (Throwable ignored) {}
    }


    private static boolean wasSuccessful(
            JSONArray ledger,
            String command
    ) {

        if (
                ledger == null ||
                command == null
        ) {

            return false;
        }


        for (
                int i = 0;
                i < ledger.length();
                i++
        ) {

            JSONObject entry =
                    ledger.optJSONObject(
                            i
                    );

            if (entry == null) {
                continue;
            }


            boolean sameCommand =
                    command.equalsIgnoreCase(
                            entry.optString(
                                    "command",
                                    ""
                            )
                    );


            boolean succeeded =
                    "success".equals(
                            entry.optString(
                                    "status",
                                    ""
                            )
                    );


            if (
                    sameCommand &&
                    succeeded
            ) {

                return true;
            }
        }


        return false;
    }


    // =====================================================
    // AP SYNAPSE /loop REQUEST
    // =====================================================

    private static JSONObject requestDecision(
            String goal,
            JSONArray ledger
    ) {

        HttpURLConnection connection =
                null;


        try {

            URL url =
                    new URL(
                            LOOP_API
                    );


            connection =
                    (HttpURLConnection)
                            url.openConnection();


            connection.setRequestMethod(
                    "POST"
            );

            connection.setConnectTimeout(
                    10_000
            );

            connection.setReadTimeout(
                    25_000
            );

            connection.setDoOutput(
                    true
            );

            connection.setRequestProperty(
                    "Content-Type",
                    "application/json; charset=utf-8"
            );


            JSONObject body =
                    new JSONObject();

            body.put(
                    "goal",
                    goal
            );

            body.put(
                    "ledger",
                    ledger
            );

            body.put(
                    "source",
                    "aprisha-closed-loop-v12"
            );


            byte[] bytes =
                    body.toString()
                            .getBytes(
                                    StandardCharsets.UTF_8
                            );


            connection.setFixedLengthStreamingMode(
                    bytes.length
            );


            try (
                    OutputStream output =
                            connection.getOutputStream()
            ) {

                output.write(
                        bytes
                );
            }


            int code =
                    connection.getResponseCode();


            InputStream input =
                    code >= 200 &&
                    code < 300
                            ?
                            connection.getInputStream()
                            :
                            connection.getErrorStream();


            if (input == null) {
                return null;
            }


            StringBuilder response =
                    new StringBuilder();


            try (
                    BufferedReader reader =
                            new BufferedReader(
                                    new InputStreamReader(
                                            input,
                                            StandardCharsets.UTF_8
                                    )
                            )
            ) {

                String line;

                while (
                        (
                                line =
                                        reader.readLine()
                        )
                        !=
                        null
                ) {

                    response.append(
                            line
                    );
                }
            }


            if (
                    code < 200 ||
                    code >= 300
            ) {

                return null;
            }


            return new JSONObject(
                    response.toString()
            );

        }
        catch (Throwable error) {

            return null;

        }
        finally {

            if (connection != null) {

                connection.disconnect();
            }
        }
    }


    // =====================================================
    // CONFIRMATION STATE
    // =====================================================

    private static void storePending(
            Context context,
            String goal,
            JSONArray ledger,
            JSONObject action
    ) {

        try {

            JSONObject state =
                    new JSONObject();

            state.put(
                    "goal",
                    goal
            );

            state.put(
                    "ledger",
                    new JSONArray(
                            ledger.toString()
                    )
            );

            state.put(
                    "action",
                    new JSONObject(
                            action.toString()
                    )
            );


            context
                    .getSharedPreferences(
                            PREFS,
                            Context.MODE_PRIVATE
                    )
                    .edit()
                    .putString(
                            KEY_PENDING,
                            state.toString()
                    )
                    .putLong(
                            KEY_PENDING_UNTIL,
                            System.currentTimeMillis()
                            +
                            CONFIRM_WINDOW_MS
                    )
                    .apply();

        }
        catch (Throwable ignored) {}
    }


    private static void clearPending(
            SharedPreferences prefs
    ) {

        prefs.edit()
                .remove(
                        KEY_PENDING
                )
                .remove(
                        KEY_PENDING_UNTIL
                )
                .apply();
    }


    // =====================================================
    // CONFIRMATION LANGUAGE
    // =====================================================

    private static boolean isConsequential(
            String command
    ) {

        if (command == null) {
            return false;
        }


        String value =
                command
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );


        return
                value.matches(
                        "^(?:please\\s+)?(?:call|phone|ring)(?:\\s+to)?\\s+.+"
                )
                ||
                value.matches(
                        "^(?:please\\s+)?(?:message|text|sms)(?:\\s+to)?\\s+.+"
                );
    }


    private static boolean isConfirmation(
            String value
    ) {

        return
                value.equals("yes")
                ||
                value.equals("yeah")
                ||
                value.equals("yep")
                ||
                value.equals("yes please")
                ||
                value.equals("confirm")
                ||
                value.equals("confirmed")
                ||
                value.equals("continue")
                ||
                value.equals("do it")
                ||
                value.equals("go ahead");
    }


    private static boolean isCancellation(
            String value
    ) {

        return
                value.equals("no")
                ||
                value.equals("nope")
                ||
                value.equals("cancel")
                ||
                value.equals("cancel it")
                ||
                value.equals("stop")
                ||
                value.equals("don't")
                ||
                value.equals("do not");
    }


    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    private static String buildPartialReply(
            JSONArray ledger,
            String ending
    ) {

        int successes =
                successfulCount(
                        ledger
                );

        String last =
                lastResponse(
                        ledger
                );


        StringBuilder answer =
                new StringBuilder();


        if (successes > 0) {

            answer.append(
                    "I completed "
            );

            answer.append(
                    successes
            );

            answer.append(
                    successes == 1
                            ? " step. "
                            : " steps. "
            );
        }


        if (
                last != null &&
                !last.trim().isEmpty()
        ) {

            answer.append(
                    last.trim()
            );


            if (
                    !last.trim().endsWith(".")
            ) {

                answer.append(
                        "."
                );
            }


            answer.append(
                    " "
            );
        }


        answer.append(
                ending
        );


        return answer
                .toString()
                .trim();
    }


    private static String buildLimitReply(
            JSONArray ledger
    ) {

        return buildPartialReply(
                ledger,
                "I reached the safe six-step limit for this task."
        );
    }


    private static int successfulCount(
            JSONArray ledger
    ) {

        if (ledger == null) {
            return 0;
        }


        int count = 0;


        for (
                int i = 0;
                i < ledger.length();
                i++
        ) {

            JSONObject entry =
                    ledger.optJSONObject(
                            i
                    );


            if (
                    entry != null &&
                    "success".equals(
                            entry.optString(
                                    "status",
                                    ""
                            )
                    )
            ) {

                count++;
            }
        }


        return count;
    }


    private static String lastResponse(
            JSONArray ledger
    ) {

        if (
                ledger == null ||
                ledger.length() == 0
        ) {

            return "";
        }


        JSONObject entry =
                ledger.optJSONObject(
                        ledger.length() - 1
                );


        if (entry == null) {
            return "";
        }


        return entry.optString(
                "response",
                ""
        );
    }
}
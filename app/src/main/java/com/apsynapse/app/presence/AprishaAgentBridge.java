package com.apsynapse.app.presence;

// AP_APRISHA_AGENT_V5

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

public final class AprishaAgentBridge {

    private static final String PLAN_API =
            "https://ap-synapse-backend.onrender.com/aprisha/plan";

    private static final String PREFS =
            "aprisha_agent_v5";

    private static final String KEY_PENDING_PLAN =
            "pending_plan";

    private static final String KEY_PENDING_UNTIL =
            "pending_until";

    private static final long CONFIRM_WINDOW_MS =
            90_000L;

    private AprishaAgentBridge() {}

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

    public static boolean looksCompound(
            String value
    ) {
        if (value == null) {
            return false;
        }

        String text =
                value.toLowerCase(Locale.ROOT);

        return
                text.contains(" and then ") ||
                text.contains(" then ") ||
                text.contains(" after that ") ||
                text.contains(" followed by ") ||
                text.contains(" also ");
    }

    public static boolean looksActionLike(
            String value
    ) {
        if (value == null) {
            return false;
        }

        String text =
                value.trim()
                        .toLowerCase(Locale.ROOT);

        if (text.isEmpty()) {
            return false;
        }

        return
                text.matches(".*\\b(call|phone|ring|message|text|sms|open|launch|start|navigate|directions|timer|alarm|flashlight|volume|mute|unmute|play|pause|resume|next|previous|skip)\\b.*")
                ||
                text.startsWith("take me to ")
                ||
                text.startsWith("go to ");
    }

    public static Result route(
            Context context,
            String originalCommand
    ) {

        if (
                context == null ||
                originalCommand == null
        ) {
            return Result.ignored();
        }

        String command =
                originalCommand.trim();

        if (command.isEmpty()) {
            return Result.ignored();
        }

        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
                );

        String pendingPlan =
                prefs.getString(
                        KEY_PENDING_PLAN,
                        ""
                );

        long pendingUntil =
                prefs.getLong(
                        KEY_PENDING_UNTIL,
                        0L
                );

        if (
                pendingPlan != null &&
                !pendingPlan.isEmpty()
        ) {

            if (
                    System.currentTimeMillis()
                    >
                    pendingUntil
            ) {

                clearPending(prefs);
            }
            else {

                String normalized =
                        command
                                .toLowerCase(Locale.ROOT)
                                .trim();

                if (isConfirmation(normalized)) {

                    clearPending(prefs);

                    try {
                        return executePlan(
                                context,
                                new JSONObject(
                                        pendingPlan
                                )
                        );
                    }
                    catch (Throwable error) {
                        return Result.handled(
                                "I couldn't complete that plan."
                        );
                    }
                }

                if (isCancellation(normalized)) {

                    clearPending(prefs);

                    return Result.handled(
                            "Cancelled."
                    );
                }

                return Result.handled(
                        "I am waiting for confirmation. Say yes to continue or cancel."
                );
            }
        }

        if (!looksActionLike(command)) {
            return Result.ignored();
        }

        JSONObject plan =
                requestPlan(command);

        if (plan == null) {
            return Result.ignored();
        }

        if (
                !"device_plan".equals(
                        plan.optString(
                                "type",
                                ""
                        )
                )
        ) {
            return Result.ignored();
        }

        JSONArray actions =
                plan.optJSONArray(
                        "actions"
                );

        if (
                actions == null ||
                actions.length() == 0
        ) {
            return Result.ignored();
        }

        boolean needsConfirmation =
                plan.optBoolean(
                        "requires_confirmation",
                        false
                );

        if (needsConfirmation) {

            prefs.edit()
                    .putString(
                            KEY_PENDING_PLAN,
                            plan.toString()
                    )
                    .putLong(
                            KEY_PENDING_UNTIL,
                            System.currentTimeMillis()
                            +
                            CONFIRM_WINDOW_MS
                    )
                    .apply();

            String summary =
                    plan.optString(
                            "summary",
                            "complete that task"
                    );

            return Result.handled(
                    "I can " +
                    summary +
                    ". Say yes to continue or cancel."
            );
        }

        return executePlan(
                context,
                plan
        );
    }

    private static Result executePlan(
            Context context,
            JSONObject plan
    ) {

        JSONArray actions =
                plan.optJSONArray(
                        "actions"
                );

        if (
                actions == null ||
                actions.length() == 0
        ) {
            return Result.ignored();
        }

        String lastResponse =
                "";

        int completed =
                0;

        int limit =
                Math.min(
                        actions.length(),
                        6
                );

        for (
                int i = 0;
                i < limit;
                i++
        ) {

            JSONObject action =
                    actions.optJSONObject(i);

            if (action == null) {
                continue;
            }

            String command =
                    action.optString(
                            "command",
                            ""
                    ).trim();

            if (command.isEmpty()) {
                continue;
            }

            PresenceDeviceActions.Result result =
                    PresenceDeviceActions.handle(
                            context,
                            command
                    );

            if (!result.handled) {

                String label =
                        action.optString(
                                "label",
                                "that step"
                        );

                return Result.handled(
                        "I couldn't complete " +
                        label +
                        "."
                );
            }

            completed++;

            if (
                    result.response != null &&
                    !result.response.trim().isEmpty()
            ) {
                lastResponse =
                        result.response.trim();
            }
        }

        if (completed == 0) {
            return Result.ignored();
        }

        String success =
                plan.optString(
                        "success_reply",
                        ""
                ).trim();

        if (!success.isEmpty()) {
            return Result.handled(
                    success
            );
        }

        if (!lastResponse.isEmpty()) {
            return Result.handled(
                    lastResponse
            );
        }

        return Result.handled(
                "Done."
        );
    }

    private static JSONObject requestPlan(
            String message
    ) {

        HttpURLConnection connection =
                null;

        try {

            URL url =
                    new URL(
                            PLAN_API
                    );

            connection =
                    (HttpURLConnection)
                            url.openConnection();

            connection.setRequestMethod(
                    "POST"
            );

            connection.setConnectTimeout(
                    8_000
            );

            connection.setReadTimeout(
                    25_000
            );

            connection.setDoOutput(
                    true
            );

            connection.setRequestProperty(
                    "Content-Type",
                    "application/json"
            );

            connection.setRequestProperty(
                    "Accept",
                    "application/json"
            );

            JSONObject body =
                    new JSONObject();

            body.put(
                    "message",
                    message
            );

            body.put(
                    "source",
                    "aprisha-agent-v5"
            );

            byte[] bytes =
                    body.toString()
                            .getBytes(
                                    StandardCharsets.UTF_8
                            );

            try (
                    OutputStream output =
                            connection
                                    .getOutputStream()
            ) {

                output.write(
                        bytes
                );
            }

            int code =
                    connection.getResponseCode();

            InputStream stream =
                    code >= 200 &&
                    code < 300
                            ?
                            connection.getInputStream()
                            :
                            connection.getErrorStream();

            if (stream == null) {
                return null;
            }

            StringBuilder response =
                    new StringBuilder();

            try (
                    BufferedReader reader =
                            new BufferedReader(
                                    new InputStreamReader(
                                            stream,
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
                    response.append(line);
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

    private static boolean isConfirmation(
            String value
    ) {
        return
                value.equals("yes") ||
                value.equals("yeah") ||
                value.equals("yep") ||
                value.equals("yes please") ||
                value.equals("confirm") ||
                value.equals("confirmed") ||
                value.equals("do it") ||
                value.equals("go ahead") ||
                value.equals("continue");
    }

    private static boolean isCancellation(
            String value
    ) {
        return
                value.equals("no") ||
                value.equals("nope") ||
                value.equals("cancel") ||
                value.equals("cancel it") ||
                value.equals("stop") ||
                value.equals("do not") ||
                value.equals("don't");
    }

    private static void clearPending(
            SharedPreferences prefs
    ) {
        prefs.edit()
                .remove(
                        KEY_PENDING_PLAN
                )
                .remove(
                        KEY_PENDING_UNTIL
                )
                .apply();
    }
}
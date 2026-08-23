package com.apsynapse.app.presence;

// AP_DEVICE_INTELLIGENCE_V2_BRIDGE

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PresenceActionBridge {

    private static final String PREFS = "ap_presence_action_state";
    private static final String KEY_PENDING = "pending_command";
    private static final String KEY_PENDING_NAME = "pending_name";
    private static final String KEY_PENDING_UNTIL = "pending_until";
    private static final String KEY_LAST_CONTACT = "last_contact";
    private static final long CONFIRM_WINDOW_MS = 30_000L;

    private PresenceActionBridge() {}

    public static final class Result {
        public final boolean handled;
        public final String response;

        private Result(boolean handled, String response) {
            this.handled = handled;
            this.response = response == null ? "" : response;
        }

        public static Result handled(String response) {
            return new Result(true, response);
        }

        public static Result ignored() {
            return new Result(false, "");
        }
    }

    public static Result route(Context context, String originalCommand) {
        if (context == null || originalCommand == null) {
            return Result.ignored();
        }

        String command = naturalCommand(originalCommand);
        if (command.isEmpty()) {
            return Result.ignored();
        }

        SharedPreferences prefs = context.getSharedPreferences(
                PREFS,
                Context.MODE_PRIVATE
        );

        String pending = prefs.getString(KEY_PENDING, "");
        String pendingName = prefs.getString(KEY_PENDING_NAME, "");
        long pendingUntil = prefs.getLong(KEY_PENDING_UNTIL, 0L);

        if (pending != null && !pending.isEmpty()) {
            if (System.currentTimeMillis() > pendingUntil) {
                clearPending(prefs);
            } else if (isConfirmation(command)) {
                clearPending(prefs);

                if (pendingName != null && !pendingName.trim().isEmpty()) {
                    prefs.edit().putString(KEY_LAST_CONTACT, pendingName).apply();
                }

                PresenceDeviceActions.Result result =
                        PresenceDeviceActions.handle(context, pending);

                return result.handled
                        ? Result.handled(result.response)
                        : Result.handled("I couldn't complete that action.");
            } else if (isCancellation(command)) {
                clearPending(prefs);
                return Result.handled("Cancelled.");
            } else {
                return Result.handled(
                        "Should I call " +
                        (pendingName == null || pendingName.isEmpty()
                                ? "that contact"
                                : pendingName) +
                        "? Say yes or cancel."
                );
            }
        }

        Matcher call = Pattern.compile(
                "^(?:call|phone|ring)\\s+(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (call.find()) {
            String target = call.group(1).trim();

            if (target.matches("(?i)(her|him|them|that person|again)")) {
                String last = prefs.getString(KEY_LAST_CONTACT, "");
                if (last == null || last.trim().isEmpty()) {
                    return Result.handled("Who would you like me to call?");
                }
                target = last.trim();
            }

            if (target.isEmpty()) {
                return Result.handled("Who would you like me to call?");
            }

            prefs.edit()
                    .putString(KEY_PENDING, "call " + target)
                    .putString(KEY_PENDING_NAME, target)
                    .putLong(
                            KEY_PENDING_UNTIL,
                            System.currentTimeMillis() + CONFIRM_WINDOW_MS
                    )
                    .apply();

            return Result.handled(
                    "Call " + target + " now? Say yes or cancel."
            );
        }

        PresenceDeviceActions.Result result =
                PresenceDeviceActions.handle(context, command);

        return result.handled
                ? Result.handled(result.response)
                : Result.ignored();
    }

    private static String naturalCommand(String value) {
        String result = value
                .toLowerCase(Locale.ROOT)
                .replaceAll("[,.!?;:]+", " ")
                .replaceAll("\\s+", " ")
                .trim();

        result = result.replaceFirst(
                "^(?:hey\\s+)?aprisha(?:\\s+|$)",
                ""
        ).trim();

        result = result.replaceFirst("^please\\s+", "").trim();
        result = result.replaceFirst(
                "^(?:can|could|would|will)\\s+you\\s+",
                ""
        ).trim();
        result = result.replaceFirst("^please\\s+", "").trim();

        return result;
    }

    private static boolean isConfirmation(String value) {
        return value.equals("yes") ||
                value.equals("yeah") ||
                value.equals("yep") ||
                value.equals("yes please") ||
                value.equals("confirm") ||
                value.equals("confirmed") ||
                value.equals("do it") ||
                value.equals("go ahead") ||
                value.equals("call") ||
                value.equals("call them") ||
                value.equals("call him") ||
                value.equals("call her");
    }

    private static boolean isCancellation(String value) {
        return value.equals("no") ||
                value.equals("nope") ||
                value.equals("cancel") ||
                value.equals("cancel it") ||
                value.equals("dont") ||
                value.equals("do not") ||
                value.equals("stop");
    }

    private static void clearPending(SharedPreferences prefs) {
        prefs.edit()
                .remove(KEY_PENDING)
                .remove(KEY_PENDING_NAME)
                .remove(KEY_PENDING_UNTIL)
                .apply();
    }
}
package com.apsynapse.app.presence;

// AP_APRISHA_NOTIFICATION_BRIDGE_V6

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class AprishaNotificationBridge {

    private static final String PREFS =
            "aprisha_notification_v6";

    private static final String KEY_REPLY_TARGET =
            "pending_reply_target";

    private static final String KEY_REPLY_TEXT =
            "pending_reply_text";

    private static final String KEY_REPLY_UNTIL =
            "pending_reply_until";

    private static final long CONFIRM_WINDOW_MS =
            45_000L;

    private AprishaNotificationBridge() {}

    public static final class Result {

        public final boolean handled;
        public final String response;

        private Result(
                boolean handled,
                String response
        ) {

            this.handled =
                    handled;

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
                originalCommand
                        .trim();

        if (command.isEmpty()) {
            return Result.ignored();
        }

        String normalized =
                command
                        .toLowerCase(
                                Locale.ROOT
                        )
                        .replaceAll(
                                "\\s+",
                                " "
                        )
                        .trim();

        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
                );

        String pendingText =
                prefs.getString(
                        KEY_REPLY_TEXT,
                        ""
                );

        long pendingUntil =
                prefs.getLong(
                        KEY_REPLY_UNTIL,
                        0L
                );

        if (
                pendingText != null &&
                !pendingText.isEmpty()
        ) {

            if (
                    System.currentTimeMillis()
                    >
                    pendingUntil
            ) {

                clearPending(
                        prefs
                );
            }
            else {

                if (
                        isConfirmation(
                                normalized
                        )
                ) {

                    String target =
                            prefs.getString(
                                    KEY_REPLY_TARGET,
                                    ""
                            );

                    clearPending(
                            prefs
                    );

                    return Result.handled(
                            AprishaNotificationService.reply(
                                    context,
                                    target,
                                    pendingText
                            )
                    );
                }

                if (
                        isCancellation(
                                normalized
                        )
                ) {

                    clearPending(
                            prefs
                    );

                    return Result.handled(
                            "Cancelled."
                    );
                }

                return Result.handled(
                        "I am waiting for confirmation. Say yes to send the reply or cancel."
                );
            }
        }

        if (
                normalized.equals(
                        "enable notification access"
                )
                ||
                normalized.equals(
                        "open notification access"
                )
                ||
                normalized.contains(
                        "notification access settings"
                )
        ) {

            AprishaNotificationService
                    .openAccessSettings(
                            context
                    );

            return Result.handled(
                    "Opening notification access. Turn on AP Synapse so Aprisha can read and reply to supported notifications."
            );
        }

        if (
                isReadNotificationsCommand(
                        normalized
                )
        ) {

            int count =
                    requestedCount(
                            normalized
                    );

            return Result.handled(
                    AprishaNotificationService
                            .readRecent(
                                    context,
                                    count
                            )
            );
        }

        Matcher targetedReply =
                Pattern.compile(
                        "^reply\\s+to\\s+(.+?)\\s+(?:saying|say|that)\\s+(.+)$",
                        Pattern.CASE_INSENSITIVE
                )
                .matcher(
                        command
                );

        if (
                targetedReply.find()
        ) {

            String target =
                    targetedReply
                            .group(1)
                            .trim();

            String text =
                    targetedReply
                            .group(2)
                            .trim();

            return stageReply(
                    prefs,
                    target,
                    text
            );
        }

        Matcher latestReply =
                Pattern.compile(
                        "^reply\\s+(?:saying|say|that)\\s+(.+)$",
                        Pattern.CASE_INSENSITIVE
                )
                .matcher(
                        command
                );

        if (
                latestReply.find()
        ) {

            String text =
                    latestReply
                            .group(1)
                            .trim();

            return stageReply(
                    prefs,
                    "",
                    text
            );
        }

        return Result.ignored();
    }

    private static Result stageReply(
            SharedPreferences prefs,
            String target,
            String text
    ) {

        if (
                text == null ||
                text.trim().isEmpty()
        ) {

            return Result.handled(
                    "What should I reply?"
            );
        }

        String safeTarget =
                target == null
                        ? ""
                        : target.trim();

        prefs.edit()
                .putString(
                        KEY_REPLY_TARGET,
                        safeTarget
                )
                .putString(
                        KEY_REPLY_TEXT,
                        text.trim()
                )
                .putLong(
                        KEY_REPLY_UNTIL,
                        System.currentTimeMillis()
                                +
                                CONFIRM_WINDOW_MS
                )
                .apply();

        String destination =
                safeTarget.isEmpty()
                        ? "the latest reply-capable conversation"
                        : safeTarget;

        return Result.handled(
                "Reply " +
                text.trim() +
                " to " +
                destination +
                "? Say yes to send or cancel."
        );
    }

    private static boolean isReadNotificationsCommand(
            String normalized
    ) {

        return
                normalized.equals(
                        "read my notifications"
                )
                ||
                normalized.equals(
                        "read notifications"
                )
                ||
                normalized.equals(
                        "show my notifications"
                )
                ||
                normalized.equals(
                        "show notifications"
                )
                ||
                normalized.equals(
                        "what are my notifications"
                )
                ||
                normalized.equals(
                        "what notifications do i have"
                )
                ||
                normalized.equals(
                        "what did i miss"
                )
                ||
                (
                        normalized.contains(
                                "notification"
                        )
                        &&
                        (
                                normalized.startsWith(
                                        "read "
                                )
                                ||
                                normalized.startsWith(
                                        "show "
                                )
                                ||
                                normalized.startsWith(
                                        "tell me "
                                )
                        )
                );
    }

    private static int requestedCount(
            String normalized
    ) {

        Matcher number =
                Pattern.compile(
                        "\\b([1-8])\\b"
                )
                .matcher(
                        normalized
                );

        if (
                number.find()
        ) {

            try {
                return Integer.parseInt(
                        number.group(1)
                );
            }
            catch (Throwable ignored) {
            }
        }

        return 5;
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
                value.equals("send it") ||
                value.equals("do it") ||
                value.equals("go ahead");
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
                value.equals("don't send") ||
                value.equals("do not send");
    }

    private static void clearPending(
            SharedPreferences prefs
    ) {

        prefs.edit()
                .remove(
                        KEY_REPLY_TARGET
                )
                .remove(
                        KEY_REPLY_TEXT
                )
                .remove(
                        KEY_REPLY_UNTIL
                )
                .apply();
    }
}
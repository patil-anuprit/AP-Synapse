package com.apsynapse.app.presence;

// AP_APRISHA_CONTEXT_CORE_V9

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class AprishaContextCore {

    private static final String PREFS =
            "aprisha_context_v9";

    private static final String KEY_LAST_COMMAND =
            "last_safe_command";

    private static final String KEY_LAST_TIME =
            "last_safe_command_time";

    /*
     * Short-lived device-action context.
     *
     * We deliberately do not keep consequential actions such as
     * calls, messages or notification replies here.
     */
    private static final long CONTEXT_WINDOW_MS =
            10 * 60 * 1000L;

    private AprishaContextCore() {}


    public static String resolve(
            Context context,
            String original
    ) {

        if (
                context == null ||
                original == null
        ) {
            return original;
        }

        String raw =
                original.trim();

        if (raw.isEmpty()) {
            return raw;
        }

        String normalized =
                raw.toLowerCase(
                        Locale.ROOT
                );

        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
                );

        String previous =
                getValidPrevious(
                        prefs
                );


        // --------------------------------------------------
        // SIMPLE REPEAT
        // --------------------------------------------------

        if (
                isRepeatRequest(
                        normalized
                )
        ) {

            if (
                    previous != null &&
                    !previous.isEmpty()
            ) {
                return previous;
            }

            return raw;
        }


        // --------------------------------------------------
        // OPEN IT AGAIN
        // --------------------------------------------------

        if (
                previous != null &&
                isOpenCommand(previous) &&
                (
                    normalized.equals("open it again") ||
                    normalized.equals("launch it again") ||
                    normalized.equals("open that again")
                )
        ) {
            return previous;
        }


        // --------------------------------------------------
        // GO THERE AGAIN
        // --------------------------------------------------

        if (
                previous != null &&
                isNavigationCommand(previous) &&
                (
                    normalized.equals("go there again") ||
                    normalized.equals("navigate there again") ||
                    normalized.equals("take me there again")
                )
        ) {
            return previous;
        }


        // --------------------------------------------------
        // TIMER FOLLOW-UPS
        // --------------------------------------------------

        if (
                previous != null &&
                isTimerCommand(previous)
        ) {

            String duration =
                    extractTimerDurationFollowUp(
                            normalized
                    );

            if (
                    duration != null &&
                    !duration.isEmpty()
            ) {

                String resolved =
                        "set timer for " +
                        duration;

                rememberSafe(
                        prefs,
                        resolved
                );

                return resolved;
            }
        }


        // --------------------------------------------------
        // ALARM FOLLOW-UP
        // --------------------------------------------------

        if (
                previous != null &&
                isAlarmCommand(previous)
        ) {

            String alarm =
                    extractAlarmFollowUp(
                            normalized
                    );

            if (
                    alarm != null &&
                    !alarm.isEmpty()
            ) {

                String resolved =
                        "set alarm for " +
                        alarm;

                rememberSafe(
                        prefs,
                        resolved
                );

                return resolved;
            }
        }


        // --------------------------------------------------
        // VOLUME FOLLOW-UP
        // --------------------------------------------------

        if (
                previous != null &&
                isVolumeCommand(previous)
        ) {

            Matcher percent =
                    Pattern.compile(
                            "(?:make it|set it to|change it to)\\s+(\\d{1,3})\\s*(?:percent|%)?"
                    ).matcher(
                            normalized
                    );

            if (percent.matches()) {

                int level;

                try {

                    level =
                            Integer.parseInt(
                                    percent.group(1)
                            );

                }
                catch (Throwable error) {

                    return raw;
                }

                if (
                        level >= 0 &&
                        level <= 100
                ) {

                    String resolved =
                            "volume " +
                            level +
                            " percent";

                    rememberSafe(
                            prefs,
                            resolved
                    );

                    return resolved;
                }
            }
        }


        // --------------------------------------------------
        // REMEMBER ONLY SAFE DEVICE-ACTION CONTEXT
        // --------------------------------------------------

        if (
                isSafeContextCommand(
                        normalized
                )
        ) {

            rememberSafe(
                    prefs,
                    raw
            );
        }

        return raw;
    }


    private static String getValidPrevious(
            SharedPreferences prefs
    ) {

        long time =
                prefs.getLong(
                        KEY_LAST_TIME,
                        0L
                );

        if (
                time <= 0L ||
                System.currentTimeMillis() - time >
                CONTEXT_WINDOW_MS
        ) {

            clear(
                    prefs
            );

            return null;
        }

        String previous =
                prefs.getString(
                        KEY_LAST_COMMAND,
                        ""
                );

        if (
                previous == null ||
                previous.trim().isEmpty()
        ) {
            return null;
        }

        return previous.trim();
    }


    private static void rememberSafe(
            SharedPreferences prefs,
            String command
    ) {

        if (
                command == null ||
                command.trim().isEmpty()
        ) {
            return;
        }

        String normalized =
                command.trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        /*
         * Never store consequential communication commands
         * for automatic contextual replay.
         */
        if (
                isConsequential(
                        normalized
                )
        ) {
            return;
        }

        prefs.edit()
                .putString(
                        KEY_LAST_COMMAND,
                        command.trim()
                )
                .putLong(
                        KEY_LAST_TIME,
                        System.currentTimeMillis()
                )
                .apply();
    }


    private static boolean isRepeatRequest(
            String value
    ) {

        return
                value.equals("again") ||
                value.equals("do that again") ||
                value.equals("do it again") ||
                value.equals("repeat that") ||
                value.equals("repeat it") ||
                value.equals("same again") ||
                value.equals("do the same again");
    }


    private static boolean isSafeContextCommand(
            String value
    ) {

        if (
                value == null ||
                value.isEmpty()
        ) {
            return false;
        }

        if (
                isConsequential(
                        value
                )
        ) {
            return false;
        }

        return
                isOpenCommand(value) ||
                isNavigationCommand(value) ||
                isTimerCommand(value) ||
                isAlarmCommand(value) ||
                isVolumeCommand(value) ||

                value.contains("flashlight") ||

                value.startsWith("play ") ||
                value.equals("play") ||
                value.equals("pause") ||
                value.equals("resume") ||
                value.equals("next") ||
                value.equals("previous") ||
                value.equals("skip") ||

                value.contains(" settings") ||
                value.equals("open settings") ||

                value.startsWith("search the web for ") ||
                value.startsWith("search web for ") ||
                value.startsWith("search online for ") ||
                value.startsWith("web search for ") ||
                value.startsWith("look up ");
    }


    private static boolean isConsequential(
            String value
    ) {

        if (value == null) {
            return false;
        }

        return
                value.matches(
                        ".*\\b(call|phone|ring|message|text|sms|reply|send)\\b.*"
                );
    }


    private static boolean isOpenCommand(
            String value
    ) {

        String text =
                value.toLowerCase(
                        Locale.ROOT
                );

        return
                text.startsWith("open ") ||
                text.startsWith("launch ") ||
                text.startsWith("start ");
    }


    private static boolean isNavigationCommand(
            String value
    ) {

        String text =
                value.toLowerCase(
                        Locale.ROOT
                );

        return
                text.startsWith("navigate to ") ||
                text.startsWith("directions to ") ||
                text.startsWith("take me to ") ||
                text.startsWith("go to ");
    }


    private static boolean isTimerCommand(
            String value
    ) {

        String text =
                value.toLowerCase(
                        Locale.ROOT
                );

        return
                text.contains("timer");
    }


    private static boolean isAlarmCommand(
            String value
    ) {

        String text =
                value.toLowerCase(
                        Locale.ROOT
                );

        return
                text.contains("alarm");
    }


    private static boolean isVolumeCommand(
            String value
    ) {

        String text =
                value.toLowerCase(
                        Locale.ROOT
                );

        return
                text.startsWith("volume") ||
                text.startsWith("mute") ||
                text.startsWith("unmute");
    }


    private static String extractTimerDurationFollowUp(
            String normalized
    ) {

        String[] prefixes = {
                "make it ",
                "set it for ",
                "change it to ",
                "make that ",
                "set that for "
        };

        for (
                String prefix :
                prefixes
        ) {

            if (
                    normalized.startsWith(
                            prefix
                    )
            ) {

                String candidate =
                        normalized.substring(
                                prefix.length()
                        ).trim();

                if (
                        candidate.matches(
                                "\\d+\\s*(seconds?|minutes?|hours?)"
                        )
                ) {
                    return candidate;
                }
            }
        }

        return null;
    }


    private static String extractAlarmFollowUp(
            String normalized
    ) {

        String[] prefixes = {
                "make it ",
                "set it for ",
                "change it to ",
                "make that ",
                "set that for "
        };

        for (
                String prefix :
                prefixes
        ) {

            if (
                    normalized.startsWith(
                            prefix
                    )
            ) {

                String candidate =
                        normalized.substring(
                                prefix.length()
                        ).trim();

                if (
                        candidate.matches(
                                "\\d{1,2}(:\\d{2})?\\s*(am|pm)?"
                        )
                ) {
                    return candidate;
                }
            }
        }

        return null;
    }


    private static void clear(
            SharedPreferences prefs
    ) {

        prefs.edit()
                .remove(
                        KEY_LAST_COMMAND
                )
                .remove(
                        KEY_LAST_TIME
                )
                .apply();
    }
}
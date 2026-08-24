package com.apsynapse.app.presence;

// AP_APRISHA_TIME_CORE_V10

import android.Manifest;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.AlarmClock;
import android.provider.CalendarContract;

import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class AprishaScheduleCore {

    private AprishaScheduleCore() {}

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


    public static Result route(
            Context context,
            String original
    ) {

        if (context == null || original == null) {
            return Result.ignored();
        }

        String raw = original.trim();

        if (raw.isEmpty()) {
            return Result.ignored();
        }

        String command =
                raw.toLowerCase(Locale.ROOT);


        // --------------------------------------------------
        // REMIND ME IN ...
        // --------------------------------------------------

        Matcher relative =
                Pattern.compile(
                        "^remind me in\\s+(\\d+)\\s+(minute|minutes|hour|hours)(?:\\s+to\\s+(.+))?$"
                ).matcher(command);

        if (relative.matches()) {

            int amount;

            try {
                amount = Integer.parseInt(relative.group(1));
            } catch (Throwable error) {
                return Result.handled(
                        "I couldn't understand that reminder time."
                );
            }

            if (amount <= 0 || amount > 1440) {
                return Result.handled(
                        "Please choose a reminder within the next 24 hours."
                );
            }

            Calendar target =
                    Calendar.getInstance();

            if (
                    relative.group(2)
                            .startsWith("hour")
            ) {
                target.add(
                        Calendar.HOUR_OF_DAY,
                        amount
                );
            } else {
                target.add(
                        Calendar.MINUTE,
                        amount
                );
            }

            String message =
                    relative.group(3);

            if (
                    message == null ||
                    message.trim().isEmpty()
            ) {
                message = "Aprisha reminder";
            }

            return createReminder(
                    context,
                    target,
                    message.trim()
            );
        }


        // --------------------------------------------------
        // REMIND ME TOMORROW AT ...
        // --------------------------------------------------

        Matcher tomorrowReminder =
                Pattern.compile(
                        "^remind me tomorrow at\\s+(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm))(?:\\s+to\\s+(.+))?$"
                ).matcher(command);

        if (tomorrowReminder.matches()) {

            Calendar target =
                    parseClockTime(
                            tomorrowReminder.group(1),
                            1
                    );

            if (target == null) {
                return Result.handled(
                        "I couldn't understand that reminder time."
                );
            }

            String message =
                    tomorrowReminder.group(2);

            if (
                    message == null ||
                    message.trim().isEmpty()
            ) {
                message = "Aprisha reminder";
            }

            return createReminder(
                    context,
                    target,
                    message.trim()
            );
        }


        // --------------------------------------------------
        // TODAY CALENDAR
        // --------------------------------------------------

        if (
                command.equals("what do i have today") ||
                command.equals("what is on my calendar today") ||
                command.equals("show my calendar today")
        ) {

            return calendarSummary(
                    context,
                    0,
                    "today"
            );
        }


        // --------------------------------------------------
        // TOMORROW CALENDAR
        // --------------------------------------------------

        if (
                command.equals("what do i have tomorrow") ||
                command.equals("what is on my calendar tomorrow") ||
                command.equals("show my calendar tomorrow")
        ) {

            return calendarSummary(
                    context,
                    1,
                    "tomorrow"
            );
        }


        // --------------------------------------------------
        // FREE TIME
        // --------------------------------------------------

        if (
                command.equals("when am i free today") ||
                command.equals("when do i have free time today")
        ) {

            return freeTime(
                    context,
                    0,
                    "today"
            );
        }

        if (
                command.equals("when am i free tomorrow") ||
                command.equals("when do i have free time tomorrow")
        ) {

            return freeTime(
                    context,
                    1,
                    "tomorrow"
            );
        }


        // --------------------------------------------------
        // CREATE EVENT TOMORROW
        // --------------------------------------------------

        Matcher tomorrowEvent =
                Pattern.compile(
                        "^(?:add|create)\\s+(?:an?\\s+)?event\\s+(.+?)\\s+tomorrow\\s+at\\s+(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm))$"
                ).matcher(command);

        if (tomorrowEvent.matches()) {

            Calendar start =
                    parseClockTime(
                            tomorrowEvent.group(2),
                            1
                    );

            if (start == null) {
                return Result.handled(
                        "I couldn't understand that event time."
                );
            }

            return prepareEvent(
                    context,
                    tomorrowEvent.group(1),
                    start
            );
        }


        return Result.ignored();
    }


    private static Result createReminder(
            Context context,
            Calendar target,
            String message
    ) {

        try {

            Intent intent =
                    new Intent(
                            AlarmClock.ACTION_SET_ALARM
                    );

            intent.putExtra(
                    AlarmClock.EXTRA_HOUR,
                    target.get(Calendar.HOUR_OF_DAY)
            );

            intent.putExtra(
                    AlarmClock.EXTRA_MINUTES,
                    target.get(Calendar.MINUTE)
            );

            intent.putExtra(
                    AlarmClock.EXTRA_MESSAGE,
                    message
            );

            intent.putExtra(
                    AlarmClock.EXTRA_SKIP_UI,
                    true
            );

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );

            context.startActivity(intent);

            return Result.handled(
                    "Done. I'll remind you at " +
                    formatTime(
                            target.getTimeInMillis()
                    ) +
                    "."
            );

        } catch (Throwable error) {

            return Result.handled(
                    "I couldn't create that reminder."
            );
        }
    }


    private static Result calendarSummary(
            Context context,
            int offset,
            String name
    ) {

        if (!hasCalendarPermission(context)) {
            return Result.handled(
                    "Calendar access is required. Open Aprisha setup and allow Calendar."
            );
        }

        long[] range =
                dayRange(offset);

        List<EventItem> events =
                queryEvents(
                        context,
                        range[0],
                        range[1]
                );

        if (events == null) {
            return Result.handled(
                    "I couldn't read your calendar."
            );
        }

        if (events.isEmpty()) {
            return Result.handled(
                    "You don't have any calendar events " +
                    name +
                    "."
            );
        }

        StringBuilder answer =
                new StringBuilder();

        answer.append("You have ");
        answer.append(events.size());
        answer.append(
                events.size() == 1
                        ? " event "
                        : " events "
        );
        answer.append(name);
        answer.append(". ");

        int limit =
                Math.min(
                        events.size(),
                        5
                );

        for (
                int i = 0;
                i < limit;
                i++
        ) {

            EventItem event =
                    events.get(i);

            if (i > 0) {
                answer.append(" Then ");
            }

            answer.append(event.title);

            if (!event.allDay) {
                answer.append(" at ");
                answer.append(
                        formatTime(event.begin)
                );
            }

            answer.append(".");
        }

        return Result.handled(
                answer.toString()
        );
    }


    private static Result freeTime(
            Context context,
            int offset,
            String name
    ) {

        if (!hasCalendarPermission(context)) {
            return Result.handled(
                    "Calendar access is required. Open Aprisha setup and allow Calendar."
            );
        }

        long[] range =
                dayRange(offset);

        Calendar start =
                Calendar.getInstance();

        start.setTimeInMillis(range[0]);
        start.set(Calendar.HOUR_OF_DAY, 8);

        Calendar end =
                Calendar.getInstance();

        end.setTimeInMillis(range[0]);
        end.set(Calendar.HOUR_OF_DAY, 20);

        List<EventItem> events =
                queryEvents(
                        context,
                        start.getTimeInMillis(),
                        end.getTimeInMillis()
                );

        if (events == null) {
            return Result.handled(
                    "I couldn't read your calendar."
            );
        }

        long cursor =
                start.getTimeInMillis();

        ArrayList<String> free =
                new ArrayList<>();

        for (EventItem event : events) {

            if (event.allDay) {
                continue;
            }

            long begin =
                    Math.max(
                            event.begin,
                            start.getTimeInMillis()
                    );

            long finish =
                    Math.min(
                            event.end,
                            end.getTimeInMillis()
                    );

            if (
                    begin > cursor &&
                    begin - cursor >=
                    60L * 60L * 1000L
            ) {

                free.add(
                        formatTime(cursor) +
                        " to " +
                        formatTime(begin)
                );

                if (free.size() >= 3) {
                    break;
                }
            }

            if (finish > cursor) {
                cursor = finish;
            }
        }

        if (
                free.size() < 3 &&
                end.getTimeInMillis() - cursor >=
                60L * 60L * 1000L
        ) {

            free.add(
                    formatTime(cursor) +
                    " to " +
                    formatTime(
                            end.getTimeInMillis()
                    )
            );
        }

        if (free.isEmpty()) {
            return Result.handled(
                    "I couldn't find a free one-hour block between 8 AM and 8 PM " +
                    name +
                    "."
            );
        }

        StringBuilder answer =
                new StringBuilder(
                        "Your first free window " +
                        name +
                        " is "
                );

        answer.append(free.get(0));

        if (free.size() > 1) {

            answer.append(
                    ". Other free windows include "
            );

            for (
                    int i = 1;
                    i < free.size();
                    i++
            ) {

                if (i > 1) {
                    answer.append(", ");
                }

                answer.append(
                        free.get(i)
                );
            }
        }

        answer.append(".");

        return Result.handled(
                answer.toString()
        );
    }


    private static List<EventItem> queryEvents(
            Context context,
            long start,
            long end
    ) {

        ArrayList<EventItem> result =
                new ArrayList<>();

        Cursor cursor = null;

        try {

            Uri.Builder builder =
                    CalendarContract
                            .Instances
                            .CONTENT_URI
                            .buildUpon();

            ContentUris.appendId(
                    builder,
                    start
            );

            ContentUris.appendId(
                    builder,
                    end
            );

            String[] projection = {
                    CalendarContract.Instances.TITLE,
                    CalendarContract.Instances.BEGIN,
                    CalendarContract.Instances.END,
                    CalendarContract.Instances.ALL_DAY
            };

            cursor =
                    context
                            .getContentResolver()
                            .query(
                                    builder.build(),
                                    projection,
                                    null,
                                    null,
                                    CalendarContract
                                            .Instances
                                            .BEGIN +
                                            " ASC"
                            );

            if (cursor == null) {
                return result;
            }

            int titleIndex =
                    cursor.getColumnIndex(
                            CalendarContract.Instances.TITLE
                    );

            int beginIndex =
                    cursor.getColumnIndex(
                            CalendarContract.Instances.BEGIN
                    );

            int endIndex =
                    cursor.getColumnIndex(
                            CalendarContract.Instances.END
                    );

            int allDayIndex =
                    cursor.getColumnIndex(
                            CalendarContract.Instances.ALL_DAY
                    );

            while (cursor.moveToNext()) {

                String title =
                        titleIndex >= 0
                                ? cursor.getString(titleIndex)
                                : "Untitled event";

                if (
                        title == null ||
                        title.trim().isEmpty()
                ) {
                    title = "Untitled event";
                }

                long begin =
                        beginIndex >= 0
                                ? cursor.getLong(beginIndex)
                                : start;

                long finish =
                        endIndex >= 0
                                ? cursor.getLong(endIndex)
                                : begin;

                boolean allDay =
                        allDayIndex >= 0 &&
                        cursor.getInt(
                                allDayIndex
                        ) != 0;

                result.add(
                        new EventItem(
                                title.trim(),
                                begin,
                                finish,
                                allDay
                        )
                );
            }

            return result;

        } catch (Throwable error) {

            return null;

        } finally {

            if (cursor != null) {
                try {
                    cursor.close();
                } catch (Throwable ignored) {}
            }
        }
    }


    private static Result prepareEvent(
            Context context,
            String title,
            Calendar start
    ) {

        try {

            Calendar end =
                    (Calendar) start.clone();

            end.add(
                    Calendar.HOUR_OF_DAY,
                    1
            );

            Intent intent =
                    new Intent(
                            Intent.ACTION_INSERT
                    );

            intent.setData(
                    CalendarContract
                            .Events
                            .CONTENT_URI
            );

            intent.putExtra(
                    CalendarContract.Events.TITLE,
                    title
            );

            intent.putExtra(
                    CalendarContract.EXTRA_EVENT_BEGIN_TIME,
                    start.getTimeInMillis()
            );

            intent.putExtra(
                    CalendarContract.EXTRA_EVENT_END_TIME,
                    end.getTimeInMillis()
            );

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );

            context.startActivity(intent);

            return Result.handled(
                    "I've prepared the event for " +
                    formatTime(
                            start.getTimeInMillis()
                    ) +
                    ". Review it in Calendar and save it."
            );

        } catch (Throwable error) {

            return Result.handled(
                    "I couldn't open Calendar for that event."
            );
        }
    }


    private static boolean hasCalendarPermission(
            Context context
    ) {

        if (Build.VERSION.SDK_INT < 23) {
            return true;
        }

        return
                context.checkSelfPermission(
                        Manifest.permission.READ_CALENDAR
                )
                ==
                PackageManager.PERMISSION_GRANTED;
    }


    private static long[] dayRange(
            int offset
    ) {

        Calendar start =
                Calendar.getInstance();

        start.add(
                Calendar.DAY_OF_YEAR,
                offset
        );

        start.set(
                Calendar.HOUR_OF_DAY,
                0
        );

        start.set(
                Calendar.MINUTE,
                0
        );

        start.set(
                Calendar.SECOND,
                0
        );

        start.set(
                Calendar.MILLISECOND,
                0
        );

        Calendar end =
                (Calendar) start.clone();

        end.add(
                Calendar.DAY_OF_YEAR,
                1
        );

        return new long[]{
                start.getTimeInMillis(),
                end.getTimeInMillis()
        };
    }


    private static Calendar parseClockTime(
            String value,
            int dayOffset
    ) {

        if (value == null) {
            return null;
        }

        Matcher matcher =
                Pattern.compile(
                        "^(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)$",
                        Pattern.CASE_INSENSITIVE
                ).matcher(
                        value.trim()
                );

        if (!matcher.matches()) {
            return null;
        }

        int hour;
        int minute = 0;

        try {

            hour =
                    Integer.parseInt(
                            matcher.group(1)
                    );

            if (matcher.group(2) != null) {
                minute =
                        Integer.parseInt(
                                matcher.group(2)
                        );
            }

        } catch (Throwable error) {
            return null;
        }

        if (
                hour < 1 ||
                hour > 12 ||
                minute < 0 ||
                minute > 59
        ) {
            return null;
        }

        String ampm =
                matcher.group(3)
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (hour == 12) {

            hour =
                    ampm.equals("am")
                            ? 0
                            : 12;

        } else if (
                ampm.equals("pm")
        ) {

            hour += 12;
        }

        Calendar target =
                Calendar.getInstance();

        target.add(
                Calendar.DAY_OF_YEAR,
                dayOffset
        );

        target.set(
                Calendar.HOUR_OF_DAY,
                hour
        );

        target.set(
                Calendar.MINUTE,
                minute
        );

        target.set(
                Calendar.SECOND,
                0
        );

        target.set(
                Calendar.MILLISECOND,
                0
        );

        return target;
    }


    private static String formatTime(
            long millis
    ) {

        return DateFormat
                .getTimeInstance(
                        DateFormat.SHORT
                )
                .format(
                        millis
                );
    }


    private static final class EventItem {

        final String title;
        final long begin;
        final long end;
        final boolean allDay;

        EventItem(
                String title,
                long begin,
                long end,
                boolean allDay
        ) {

            this.title = title;
            this.begin = begin;
            this.end = end;
            this.allDay = allDay;
        }
    }
}
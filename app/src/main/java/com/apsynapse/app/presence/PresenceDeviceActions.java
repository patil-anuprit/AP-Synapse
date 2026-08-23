package com.apsynapse.app.presence;

// AP_DEVICE_INTELLIGENCE_V2_ACTIONS

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.BatteryManager;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.provider.Settings;
import android.view.KeyEvent;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.DateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PresenceDeviceActions {

    private PresenceDeviceActions() {}

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

    public static Result handle(Context context, String originalCommand) {
        if (context == null || originalCommand == null) {
            return Result.ignored();
        }

        String command = normalize(originalCommand);
        if (command.isEmpty()) {
            return Result.ignored();
        }

        Matcher call = Pattern.compile(
                "^(?:call|phone|ring)\\s+(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (call.find()) {
            return callContact(context, call.group(1).trim());
        }

        Matcher message = Pattern.compile(
                "^(?:send\\s+)?(?:a\\s+)?(?:message|text|sms)(?:\\s+to)?\\s+" +
                "(.+?)(?:\\s+(?:saying|say|that)\\s+(.+))?$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (message.find()) {
            return composeSms(
                    context,
                    message.group(1).trim(),
                    message.group(2)
            );
        }

        Matcher reminderAfter = Pattern.compile(
                "^(?:remind me|set (?:a )?reminder)\\s+(?:to\\s+)?(.+?)\\s+" +
                "(?:in|after)\\s+(.+?)\\s+(seconds?|minutes?|hours?)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (reminderAfter.find()) {
            int amount = parseSpokenNumber(reminderAfter.group(2));
            return setTimer(
                    context,
                    amount,
                    reminderAfter.group(3),
                    reminderAfter.group(1).trim()
            );
        }

        Matcher reminderBefore = Pattern.compile(
                "^(?:remind me|set (?:a )?reminder)\\s+(?:in|after)\\s+" +
                "(.+?)\\s+(seconds?|minutes?|hours?)\\s+(?:to\\s+)?(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (reminderBefore.find()) {
            int amount = parseSpokenNumber(reminderBefore.group(1));
            return setTimer(
                    context,
                    amount,
                    reminderBefore.group(2),
                    reminderBefore.group(3).trim()
            );
        }

        // AP_NATIVE_ROUTING_V5
        Matcher timer = Pattern.compile(
                "(?:(?:set|start)\\s+(?:a\\s+)?timer|timer)\\s+" +
                "(?:for\\s+)?" +
                "(.+?)\\s+" +
                "(seconds?|minutes?|hours?)\\b",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (timer.find()) {
            int amount = parseSpokenNumber(timer.group(1));
            return setTimer(context, amount, timer.group(2), "Aprisha");
        }

        Matcher alarm = Pattern.compile(
                "^(?:set|create)\\s+(?:an?\\s+)?alarm\\s+(?:for\\s+|at\\s+)?(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (alarm.find()) {
            AlarmTime time = parseAlarmTime(alarm.group(1));

            if (time == null) {
                return Result.handled("That alarm time isn't valid.");
            }

            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
                    .putExtra(AlarmClock.EXTRA_HOUR, time.hour)
                    .putExtra(AlarmClock.EXTRA_MINUTES, time.minute)
                    .putExtra(AlarmClock.EXTRA_MESSAGE, "Aprisha")
                    .putExtra(AlarmClock.EXTRA_SKIP_UI, true)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            return startIntent(
                    context,
                    intent,
                    "Alarm set.",
                    "I couldn't set the alarm."
            );
        }

        if (matches(command,
                "turn on flashlight", "turn the flashlight on",
                "flashlight on", "turn on torch", "torch on")) {
            return setFlashlight(context, true);
        }

        if (matches(command,
                "turn off flashlight", "turn the flashlight off",
                "flashlight off", "turn off torch", "torch off")) {
            return setFlashlight(context, false);
        }

        AudioManager audio = (AudioManager) context.getSystemService(
                Context.AUDIO_SERVICE
        );

        if (command.contains("volume up") || command.contains("increase volume")) {
            if (audio != null) {
                audio.adjustStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        AudioManager.ADJUST_RAISE,
                        AudioManager.FLAG_SHOW_UI
                );
            }
            return Result.handled("Volume increased.");
        }

        if (command.contains("volume down") || command.contains("decrease volume")) {
            if (audio != null) {
                audio.adjustStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        AudioManager.ADJUST_LOWER,
                        AudioManager.FLAG_SHOW_UI
                );
            }
            return Result.handled("Volume decreased.");
        }

        Matcher volumePercent = Pattern.compile(
                "(?:set\\s+)?volume\\s+(?:to\\s+)?(\\d{1,3})(?:\\s*percent)?"
        ).matcher(command);

        if (volumePercent.matches()) {
            int percent = Math.max(
                    0,
                    Math.min(100, Integer.parseInt(volumePercent.group(1)))
            );
            if (audio != null) {
                int maximum = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int level = Math.round(maximum * (percent / 100f));
                audio.setStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        level,
                        AudioManager.FLAG_SHOW_UI
                );
            }
            return Result.handled("Volume set to " + percent + " percent.");
        }

        if (command.equals("mute") || command.contains("mute volume")) {
            if (audio != null) {
                audio.adjustStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        AudioManager.ADJUST_MUTE,
                        AudioManager.FLAG_SHOW_UI
                );
            }
            return Result.handled("Muted.");
        }

        if (command.equals("unmute") || command.contains("unmute volume")) {
            if (audio != null) {
                audio.adjustStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        AudioManager.ADJUST_UNMUTE,
                        AudioManager.FLAG_SHOW_UI
                );
            }
            return Result.handled("Unmuted.");
        }

        if (matches(command, "pause", "pause music", "pause media")) {
            return mediaKey(context, KeyEvent.KEYCODE_MEDIA_PAUSE, "Paused.");
        }

        if (matches(command, "play", "resume", "resume music", "play music")) {
            return mediaKey(context, KeyEvent.KEYCODE_MEDIA_PLAY, "Playing.");
        }

        if (matches(command, "next", "next song", "next track")) {
            return mediaKey(context, KeyEvent.KEYCODE_MEDIA_NEXT, "Skipping forward.");
        }

        if (matches(command, "previous", "previous song", "previous track")) {
            return mediaKey(context, KeyEvent.KEYCODE_MEDIA_PREVIOUS, "Going back.");
        }

        if (matches(command, "stop music", "stop media")) {
            return mediaKey(context, KeyEvent.KEYCODE_MEDIA_STOP, "Stopped.");
        }

        if (
                command.contains("battery") &&
                !command.contains("settings") &&
                !command.contains("saver")
        ) {
            BatteryManager battery =
                    (BatteryManager) context.getSystemService(
                            Context.BATTERY_SERVICE
                    );

            int level = battery == null
                    ? -1
                    : battery.getIntProperty(
                            BatteryManager.BATTERY_PROPERTY_CAPACITY
                    );

            boolean charging = battery != null && battery.isCharging();

            return level >= 0
                    ? Result.handled(
                            "Your battery is at " +
                            level +
                            " percent" +
                            (charging ? " and is charging." : ".")
                    )
                    : Result.handled(
                            "I couldn't read the battery level."
                    );
        }

        if (matches(command, "what time is it", "tell me the time", "current time")) {
            return Result.handled(
                    "It is " + DateFormat.getTimeInstance(DateFormat.SHORT).format(new Date()) + "."
            );
        }

        if (matches(command, "what is the date", "what date is it", "todays date", "current date")) {
            return Result.handled(
                    "Today is " + DateFormat.getDateInstance(DateFormat.FULL).format(new Date()) + "."
            );
        }

        if (matches(command, "open camera", "take a photo", "take photo", "take a picture")) {
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            return startIntent(
                    context,
                    intent,
                    "Opening Camera.",
                    "I couldn't open the camera."
            );
        }

        if (matches(command, "record video", "take a video", "open video camera")) {
            Intent intent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            return startIntent(
                    context,
                    intent,
                    "Opening the video camera.",
                    "I couldn't open the video camera."
            );
        }

        Matcher youtube = Pattern.compile(
                "^(?:play|search(?: for)?)\\s+(.+?)\\s+(?:on|in)\\s+youtube$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (youtube.find()) {
            return openUri(
                    context,
                    "https://www.youtube.com/results?search_query=" + encode(youtube.group(1)),
                    "Opening YouTube results.",
                    "I couldn't open YouTube."
            );
        }

        Matcher navigation = Pattern.compile(
                "^(?:navigate to|directions to|take me to|go to)\\s+(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (navigation.find()) {
            String destination = navigation.group(1).trim();
            Intent intent = new Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("geo:0,0?q=" + encode(destination))
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            return startIntent(
                    context,
                    intent,
                    "Opening directions to " + destination + ".",
                    "I couldn't open navigation."
            );
        }

        Matcher webSearch = Pattern.compile(
                "^(?:search(?: the web)? for|google)\\s+(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (webSearch.find()) {
            return openUri(
                    context,
                    "https://www.google.com/search?q=" + encode(webSearch.group(1)),
                    "Opening search results.",
                    "I couldn't open search."
            );
        }

        Matcher calendar = Pattern.compile(
                "^(?:add|create|schedule)\\s+(?:a\\s+)?(?:calendar\\s+)?(?:event|meeting)(?:\\s+(?:called|named))?\\s+(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (calendar.find()) {
            Intent intent = new Intent(Intent.ACTION_INSERT)
                    .setData(CalendarContract.Events.CONTENT_URI)
                    .putExtra(CalendarContract.Events.TITLE, calendar.group(1).trim())
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            return startIntent(
                    context,
                    intent,
                    "Opening the calendar event.",
                    "I couldn't open Calendar."
            );
        }

        if (command.contains("wifi settings") || command.contains("wi fi settings") ||
                command.equals("open wifi") || command.equals("open wi fi")) {
            return openSettings(context, Settings.ACTION_WIFI_SETTINGS, "Opening Wi-Fi settings.");
        }

        if (matches(command,
                "turn on wifi", "turn wifi on", "wifi on",
                "turn on wi fi", "turn wi fi on", "wi fi on",
                "turn off wifi", "turn wifi off", "wifi off",
                "turn off wi fi", "turn wi fi off", "wi fi off")) {
            return openSettings(
                    context,
                    Settings.ACTION_WIFI_SETTINGS,
                    "Opening Wi-Fi settings. Android requires you to confirm that change."
            );
        }

        if (command.contains("bluetooth settings") || command.equals("open bluetooth")) {
            return openSettings(context, Settings.ACTION_BLUETOOTH_SETTINGS, "Opening Bluetooth settings.");
        }

        if (matches(command,
                "turn on bluetooth", "turn bluetooth on", "bluetooth on",
                "turn off bluetooth", "turn bluetooth off", "bluetooth off")) {
            return openSettings(
                    context,
                    Settings.ACTION_BLUETOOTH_SETTINGS,
                    "Opening Bluetooth settings. Android requires you to confirm that change."
            );
        }

        if (command.contains("display settings") || command.contains("brightness settings")) {
            return openSettings(context, Settings.ACTION_DISPLAY_SETTINGS, "Opening display settings.");
        }

        if (command.contains("sound settings")) {
            return openSettings(context, Settings.ACTION_SOUND_SETTINGS, "Opening sound settings.");
        }

        if (command.contains("notification settings")) {
            return openSettings(context, "android.settings.NOTIFICATION_SETTINGS", "Opening notification settings.");
        }

        if (command.contains("location settings")) {
            return openSettings(context, Settings.ACTION_LOCATION_SOURCE_SETTINGS, "Opening location settings.");
        }

        if (command.contains("battery settings")) {
            return openSettings(context, Settings.ACTION_BATTERY_SAVER_SETTINGS, "Opening battery settings.");
        }

        if (command.contains("do not disturb settings") || command.equals("open do not disturb")) {
            return openSettings(context, Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS, "Opening Do Not Disturb settings.");
        }

        if (command.contains("phone settings") || command.equals("open settings")) {
            return openSettings(context, Settings.ACTION_SETTINGS, "Opening Settings.");
        }

        Matcher open = Pattern.compile(
                "^(?:open|launch|start|visit)\\s+(.+)$",
                Pattern.CASE_INSENSITIVE
        ).matcher(command);

        if (open.find()) {
            return openInstalledApp(context, open.group(1).trim());
        }

        return Result.ignored();
    }

    private static Result setTimer(Context context, int amount, String rawUnit, String label) {
        if (amount <= 0) {
            return Result.handled("Please tell me a valid timer duration.");
        }

        String unit = rawUnit == null ? "seconds" : rawUnit.toLowerCase(Locale.ROOT);
        long seconds = unit.startsWith("hour")
                ? amount * 3600L
                : unit.startsWith("minute") ? amount * 60L : amount;
        seconds = Math.max(1L, Math.min(86_400L, seconds));

        String safeLabel = label == null || label.trim().isEmpty()
                ? "Aprisha"
                : label.trim();

        Intent intent = new Intent(AlarmClock.ACTION_SET_TIMER)
                .putExtra(AlarmClock.EXTRA_LENGTH, (int) seconds)
                .putExtra(AlarmClock.EXTRA_MESSAGE, safeLabel)
                .putExtra(AlarmClock.EXTRA_SKIP_UI, true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        return startIntent(
                context,
                intent,
                "Timer set for " + amount + " " + unit + ".",
                "I couldn't start the timer."
        );
    }

    private static AlarmTime parseAlarmTime(String rawValue) {
        if (rawValue == null) {
            return null;
        }

        String value = rawValue
                .toLowerCase(Locale.ROOT)
                .replace('.', ' ')
                .replaceAll("\\s+", " ")
                .trim();

        String meridiem = null;
        Matcher suffix = Pattern.compile("(am|pm|a m|p m)$").matcher(value);
        if (suffix.find()) {
            meridiem = suffix.group(1).replace(" ", "");
            value = value.substring(0, suffix.start()).trim();
        }

        int hour;
        int minute = 0;
        Matcher numeric = Pattern.compile(
                "^(\\d{1,2})(?:(?::|\\s+)(\\d{1,2}))?$"
        ).matcher(value);

        if (numeric.matches()) {
            hour = Integer.parseInt(numeric.group(1));
            if (numeric.group(2) != null) {
                minute = Integer.parseInt(numeric.group(2));
            }
        } else {
            String[] words = value.split(" ");
            if (words.length < 1 || words.length > 3) {
                return null;
            }

            hour = parseSpokenNumber(words[0]);
            if (words.length > 1) {
                StringBuilder minutes = new StringBuilder();
                for (int index = 1; index < words.length; index++) {
                    if (minutes.length() > 0) {
                        minutes.append(' ');
                    }
                    minutes.append(words[index]);
                }
                minute = parseSpokenNumber(minutes.toString());
            }
        }

        if (hour < 0 || minute < 0 || minute > 59) {
            return null;
        }

        if (meridiem != null) {
            if (hour < 1 || hour > 12) {
                return null;
            }
            if ("pm".equals(meridiem) && hour != 12) {
                hour += 12;
            } else if ("am".equals(meridiem) && hour == 12) {
                hour = 0;
            }
        } else if (hour > 23) {
            return null;
        }

        return new AlarmTime(hour, minute);
    }

    private static final class AlarmTime {
        final int hour;
        final int minute;

        AlarmTime(int hour, int minute) {
            this.hour = hour;
            this.minute = minute;
        }
    }

    private static int parseSpokenNumber(String value) {
        if (value == null) {
            return -1;
        }

        String normalized = value
                .toLowerCase(Locale.ROOT)
                .replace('-', ' ')
                .replaceAll("\\s+", " ")
                .trim();

        if (normalized.equals("a") || normalized.equals("an")) {
            return 1;
        }

        try {
            return Integer.parseInt(normalized);
        } catch (NumberFormatException ignored) {}

        int total = 0;

        for (String word : normalized.split(" ")) {
            switch (word) {
                case "zero": break;
                case "oh": break;
                case "one": total += 1; break;
                case "two": total += 2; break;
                case "three": total += 3; break;
                case "four": total += 4; break;
                case "five": total += 5; break;
                case "six": total += 6; break;
                case "seven": total += 7; break;
                case "eight": total += 8; break;
                case "nine": total += 9; break;
                case "ten": total += 10; break;
                case "eleven": total += 11; break;
                case "twelve": total += 12; break;
                case "thirteen": total += 13; break;
                case "fourteen": total += 14; break;
                case "fifteen": total += 15; break;
                case "sixteen": total += 16; break;
                case "seventeen": total += 17; break;
                case "eighteen": total += 18; break;
                case "nineteen": total += 19; break;
                case "twenty": total += 20; break;
                case "thirty": total += 30; break;
                case "forty": total += 40; break;
                case "fifty": total += 50; break;
                case "sixty": total += 60; break;
                case "seventy": total += 70; break;
                case "eighty": total += 80; break;
                case "ninety": total += 90; break;
                case "and": break;
                case "hundred":
                    total = Math.max(1, total) * 100;
                    break;
                default:
                    return -1;
            }
        }

        return total;
    }

    private static String normalize(String value) {
        return value
                .toLowerCase(Locale.ROOT)
                .replaceAll("[,.!?;:]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static boolean matches(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.equals(candidate)) {
                return true;
            }
        }
        return false;
    }

    private static Result callContact(Context context, String name) {
        String number;
        String compact = name.replaceAll("[^0-9+]", "");

        if (compact.replace("+", "").length() >= 7) {
            number = compact;
        } else {
            if (context.checkSelfPermission(Manifest.permission.READ_CONTACTS)
                    != PackageManager.PERMISSION_GRANTED) {
                return Result.handled("I need Contacts permission before I can call saved contacts.");
            }
            number = findPhoneNumber(context, name);
        }

        if (number == null || number.trim().isEmpty()) {
            return Result.handled("I couldn't find " + name + " in your contacts.");
        }

        Uri uri = Uri.fromParts("tel", number, null);

        if (context.checkSelfPermission(Manifest.permission.CALL_PHONE)
                == PackageManager.PERMISSION_GRANTED) {
            try {
                Intent call = new Intent(Intent.ACTION_CALL, uri)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(call);
                return Result.handled("Calling " + name + ".");
            } catch (Throwable ignored) {}
        }

        Intent dial = new Intent(Intent.ACTION_DIAL, uri)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return startIntent(
                context,
                dial,
                "I opened the call for " + name + ".",
                "I couldn't start the call."
        );
    }

    private static String findPhoneNumber(Context context, String name) {
        Cursor cursor = null;
        String fallback = null;

        try {
            cursor = context.getContentResolver().query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    new String[]{
                            ContactsContract.CommonDataKinds.Phone.NUMBER,
                            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
                    },
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " LIKE ?",
                    new String[]{"%" + name + "%"},
                    ContactsContract.CommonDataKinds.Phone.IS_SUPER_PRIMARY + " DESC"
            );

            if (cursor != null) {
                int numberIndex = cursor.getColumnIndex(
                        ContactsContract.CommonDataKinds.Phone.NUMBER
                );
                int nameIndex = cursor.getColumnIndex(
                        ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
                );

                while (cursor.moveToNext()) {
                    if (numberIndex < 0) {
                        break;
                    }
                    String number = cursor.getString(numberIndex);
                    String display = nameIndex >= 0 ? cursor.getString(nameIndex) : "";
                    if (fallback == null) {
                        fallback = number;
                    }
                    if (display != null && display.equalsIgnoreCase(name)) {
                        return number;
                    }
                }
            }
        } catch (Throwable ignored) {
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        return fallback;
    }

    private static Result composeSms(Context context, String name, String body) {
        if (context.checkSelfPermission(Manifest.permission.READ_CONTACTS)
                != PackageManager.PERMISSION_GRANTED) {
            return Result.handled("I need Contacts permission first.");
        }

        String number = findPhoneNumber(context, name);
        if (number == null || number.trim().isEmpty()) {
            return Result.handled("I couldn't find " + name + " in your contacts.");
        }

        Intent intent = new Intent(Intent.ACTION_SENDTO)
                .setData(Uri.parse("smsto:" + Uri.encode(number)))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if (body != null && !body.trim().isEmpty()) {
            intent.putExtra("sms_body", body.trim());
        }

        return startIntent(
                context,
                intent,
                "Opening your message to " + name + ".",
                "I couldn't open Messages."
        );
    }

    private static Result setFlashlight(Context context, boolean enabled) {
        if (context.checkSelfPermission(Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            return Result.handled("Camera permission is required to control the flashlight.");
        }

        try {
            CameraManager manager = (CameraManager) context.getSystemService(
                    Context.CAMERA_SERVICE
            );

            if (manager == null) {
                return Result.handled("Flashlight control isn't available.");
            }

            String selected = null;
            for (String id : manager.getCameraIdList()) {
                CameraCharacteristics properties = manager.getCameraCharacteristics(id);
                Boolean flash = properties.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                Integer facing = properties.get(CameraCharacteristics.LENS_FACING);
                if (Boolean.TRUE.equals(flash)) {
                    selected = id;
                    if (facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                        break;
                    }
                }
            }

            if (selected == null) {
                return Result.handled("This device doesn't report an available flashlight.");
            }

            manager.setTorchMode(selected, enabled);
            return Result.handled(enabled ? "Flashlight on." : "Flashlight off.");
        } catch (Throwable error) {
            return Result.handled("I couldn't control the flashlight.");
        }
    }

    private static Result mediaKey(Context context, int keyCode, String response) {
        AudioManager audio = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audio == null) {
            return Result.handled("Media controls aren't available.");
        }

        long time = android.os.SystemClock.uptimeMillis();
        audio.dispatchMediaKeyEvent(new KeyEvent(time, time, KeyEvent.ACTION_DOWN, keyCode, 0));
        audio.dispatchMediaKeyEvent(new KeyEvent(time, time, KeyEvent.ACTION_UP, keyCode, 0));
        return Result.handled(response);
    }

    private static Result openInstalledApp(Context context, String requested) {
        String wanted = requested
                .toLowerCase(Locale.ROOT)
                .replaceFirst("^the\\s+", "")
                .replaceFirst("\\s+(?:app|application)$", "")
                .trim();

        PackageManager pm = context.getPackageManager();
        Map<String, String> packages = knownPackages();
        String knownPackage = packages.get(wanted);

        if (knownPackage != null) {
            try {
                Intent known = pm.getLaunchIntentForPackage(knownPackage);
                if (known != null) {
                    known.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(known);
                    return Result.handled("Opening " + displayName(wanted) + ".");
                }
            } catch (Throwable ignored) {}
        }

        try {
            Intent query = new Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> activities = pm.queryIntentActivities(
                    query,
                    PackageManager.MATCH_ALL
            );

            ResolveInfo best = null;
            int bestScore = 0;

            for (ResolveInfo info : activities) {
                CharSequence labelValue = info.loadLabel(pm);
                if (labelValue == null || info.activityInfo == null) {
                    continue;
                }

                String label = labelValue.toString().toLowerCase(Locale.ROOT).trim();
                int score = label.equals(wanted)
                        ? 4
                        : label.startsWith(wanted) || wanted.startsWith(label)
                        ? 3
                        : label.contains(wanted)
                        ? 2
                        : wanted.contains(label)
                        ? 1
                        : 0;

                if (score > bestScore) {
                    best = info;
                    bestScore = score;
                }
            }

            if (best != null && best.activityInfo != null) {
                Intent launch = new Intent(Intent.ACTION_MAIN)
                        .addCategory(Intent.CATEGORY_LAUNCHER)
                        .setClassName(
                                best.activityInfo.packageName,
                                best.activityInfo.name
                        )
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launch);
                CharSequence label = best.loadLabel(pm);
                return Result.handled("Opening " + label + ".");
            }
        } catch (Throwable ignored) {}

        String webFallback = knownWebFallbacks().get(wanted);

        if (webFallback != null) {
            return openUri(
                    context,
                    webFallback,
                    "Opening " + displayName(wanted) + ".",
                    "I couldn't open " + displayName(wanted) + "."
            );
        }

        return Result.handled(
                "I couldn't find an installed app named " + requested + "."
        );
    }

    private static Map<String, String> knownPackages() {
        Map<String, String> values = new HashMap<>();
        values.put("youtube", "com.google.android.youtube");
        values.put("you tube", "com.google.android.youtube");
        values.put("youtube music", "com.google.android.apps.youtube.music");
        values.put("maps", "com.google.android.apps.maps");
        values.put("google maps", "com.google.android.apps.maps");
        values.put("gmail", "com.google.android.gm");
        values.put("chrome", "com.android.chrome");
        values.put("google", "com.google.android.googlequicksearchbox");
        values.put("whatsapp", "com.whatsapp");
        values.put("spotify", "com.spotify.music");
        values.put("instagram", "com.instagram.android");
        values.put("facebook", "com.facebook.katana");
        values.put("telegram", "org.telegram.messenger");
        values.put("photos", "com.google.android.apps.photos");
        values.put("google photos", "com.google.android.apps.photos");
        values.put("play store", "com.android.vending");
        return values;
    }

    private static Map<String, String> knownWebFallbacks() {
        Map<String, String> values = new HashMap<>();
        values.put("youtube", "https://www.youtube.com/");
        values.put("you tube", "https://www.youtube.com/");
        values.put("youtube music", "https://music.youtube.com/");
        values.put("gmail", "https://mail.google.com/");
        values.put("whatsapp", "https://web.whatsapp.com/");
        values.put("spotify", "https://open.spotify.com/");
        values.put("instagram", "https://www.instagram.com/");
        values.put("facebook", "https://www.facebook.com/");
        values.put("telegram", "https://web.telegram.org/");
        values.put("photos", "https://photos.google.com/");
        values.put("google photos", "https://photos.google.com/");
        return values;
    }

    private static String displayName(String value) {
        if (value.isEmpty()) {
            return value;
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private static Result openUri(
            Context context,
            String uri,
            String success,
            String failure
    ) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return startIntent(context, intent, success, failure);
    }

    private static Result openSettings(Context context, String action, String response) {
        Intent intent = new Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return startIntent(context, intent, response, "I couldn't open that setting.");
    }

    private static Result startIntent(
            Context context,
            Intent intent,
            String success,
            String failure
    ) {
        try {
            if (intent.resolveActivity(context.getPackageManager()) == null) {
                return Result.handled(failure);
            }
            context.startActivity(intent);
            return Result.handled(success);
        } catch (Throwable error) {
            return Result.handled(failure);
        }
    }

    private static String encode(String value) {
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8.name());
        } catch (Throwable ignored) {
            return Uri.encode(value);
        }
    }
}

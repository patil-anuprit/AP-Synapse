package com.apsynapse.app.presence;

// AP_APRISHA_UNIVERSAL_CORE_V8

import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.BatteryManager;
import android.provider.MediaStore;
import android.provider.Settings;

import java.util.Locale;

public final class AprishaUniversalCore {

    private AprishaUniversalCore() {}

    public static final class Result {

        public final boolean handled;
        public final String response;

        private Result(
                boolean handled,
                String response
        ) {
            this.handled = handled;
            this.response =
                    response == null ? "" : response;
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
            String original
    ) {

        if (
                context == null ||
                original == null
        ) {
            return Result.ignored();
        }

        String command =
                original.trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (command.isEmpty()) {
            return Result.ignored();
        }


        // --------------------------------------------------
        // BATTERY
        // --------------------------------------------------

        if (
                command.equals("battery") ||
                command.equals("battery level") ||
                command.contains("battery percentage") ||
                command.contains("how much battery")
        ) {
            return battery(
                    context
            );
        }


        // --------------------------------------------------
        // SETTINGS
        // --------------------------------------------------

        if (
                command.contains("wifi settings") ||
                command.contains("wi-fi settings")
        ) {
            return setting(
                    context,
                    Settings.ACTION_WIFI_SETTINGS,
                    "Opening Wi-Fi settings."
            );
        }

        if (
                command.contains("bluetooth settings")
        ) {
            return setting(
                    context,
                    Settings.ACTION_BLUETOOTH_SETTINGS,
                    "Opening Bluetooth settings."
            );
        }

        if (
                command.contains("display settings") ||
                command.contains("screen settings")
        ) {
            return setting(
                    context,
                    Settings.ACTION_DISPLAY_SETTINGS,
                    "Opening display settings."
            );
        }

        if (
                command.contains("sound settings")
        ) {
            return setting(
                    context,
                    Settings.ACTION_SOUND_SETTINGS,
                    "Opening sound settings."
            );
        }

        if (
                command.contains("notification settings")
        ) {
            return setting(
                    context,
                    "android.settings.ALL_APPS_NOTIFICATION_SETTINGS",
                    "Opening notification settings."
            );
        }

        if (
                command.contains("location settings") ||
                command.contains("gps settings")
        ) {
            return setting(
                    context,
                    Settings.ACTION_LOCATION_SOURCE_SETTINGS,
                    "Opening location settings."
            );
        }

        if (
                command.equals("open settings") ||
                command.equals("phone settings") ||
                command.equals("device settings")
        ) {
            return setting(
                    context,
                    Settings.ACTION_SETTINGS,
                    "Opening Settings."
            );
        }


        // --------------------------------------------------
        // CAMERA
        // --------------------------------------------------

        if (
                command.equals("open camera") ||
                command.equals("launch camera")
        ) {

            try {

                Intent camera =
                        new Intent(
                                MediaStore
                                        .INTENT_ACTION_STILL_IMAGE_CAMERA
                        );

                camera.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                );

                context.startActivity(
                        camera
                );

                return Result.handled(
                        "Opening Camera."
                );

            }
            catch (Throwable error) {

                return Result.handled(
                        "I couldn't open Camera."
                );
            }
        }


        // --------------------------------------------------
        // WEB SEARCH
        // --------------------------------------------------

        String query =
                extractSearch(
                        original
                );

        if (
                query != null &&
                !query.isEmpty()
        ) {
            return search(
                    context,
                    query
            );
        }


        // Existing native router / V5 planner / AP intelligence
        // handles everything else.

        return Result.ignored();
    }


    private static Result battery(
            Context context
    ) {

        try {

            BatteryManager battery =
                    (BatteryManager)
                            context.getSystemService(
                                    Context.BATTERY_SERVICE
                            );

            if (battery == null) {
                return Result.handled(
                        "I couldn't read the battery level."
                );
            }

            int percent =
                    battery.getIntProperty(
                            BatteryManager
                                    .BATTERY_PROPERTY_CAPACITY
                    );

            if (
                    percent < 0 ||
                    percent > 100
            ) {
                return Result.handled(
                        "I couldn't read the battery level."
                );
            }

            return Result.handled(
                    "Your battery is at " +
                    percent +
                    " percent."
            );

        }
        catch (Throwable error) {

            return Result.handled(
                    "I couldn't read the battery level."
            );
        }
    }


    private static Result setting(
            Context context,
            String action,
            String response
    ) {

        try {

            Intent intent =
                    new Intent(
                            action
                    );

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );

            context.startActivity(
                    intent
            );

            return Result.handled(
                    response
            );

        }
        catch (Throwable error) {

            return Result.handled(
                    "I couldn't open that setting."
            );
        }
    }


    private static String extractSearch(
            String original
    ) {

        if (original == null) {
            return null;
        }

        String raw =
                original.trim();

        String lower =
                raw.toLowerCase(
                        Locale.ROOT
                );

        String[] prefixes = {
                "search the web for ",
                "search web for ",
                "search online for ",
                "web search for ",
                "look up "
        };

        for (
                String prefix :
                prefixes
        ) {

            if (
                    lower.startsWith(
                            prefix
                    )
            ) {

                return raw.substring(
                        prefix.length()
                ).trim();
            }
        }

        return null;
    }


    private static Result search(
            Context context,
            String query
    ) {

        try {

            Intent intent =
                    new Intent(
                            Intent.ACTION_WEB_SEARCH
                    );

            intent.putExtra(
                    SearchManager.QUERY,
                    query
            );

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );

            context.startActivity(
                    intent
            );

            return Result.handled(
                    "Searching for " +
                    query +
                    "."
            );

        }
        catch (Throwable first) {

            try {

                Intent browser =
                        new Intent(
                                Intent.ACTION_VIEW,
                                Uri.parse(
                                        "https://www.google.com/search?q=" +
                                        Uri.encode(query)
                                )
                        );

                browser.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                );

                context.startActivity(
                        browser
                );

                return Result.handled(
                        "Searching for " +
                        query +
                        "."
                );

            }
            catch (Throwable ignored) {

                return Result.handled(
                        "I couldn't start the search."
                );
            }
        }
    }
}
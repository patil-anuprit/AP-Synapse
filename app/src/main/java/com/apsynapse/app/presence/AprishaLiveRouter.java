package com.apsynapse.app.presence;

// AP_APRISHA_LIVE_ANDROID_ROUTER_V1

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

final class AprishaLiveRouter {

    private static final String ENDPOINT =
            "https://ap-synapse-backend.onrender.com/aprisha/route";

    private AprishaLiveRouter() {}

    static String resolve(String message) {
        if (message == null || message.trim().isEmpty()) {
            return null;
        }

        HttpURLConnection connection = null;

        try {
            connection = (HttpURLConnection)
                    new URL(ENDPOINT).openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(12_000);
            connection.setReadTimeout(12_000);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                    "Content-Type",
                    "application/json"
            );

            connection.setRequestProperty(
                    "Accept",
                    "application/json"
            );

            JSONObject request = new JSONObject();
            request.put("message", message);
            request.put("source", "aprisha-android");

            byte[] bytes = request
                    .toString()
                    .getBytes(StandardCharsets.UTF_8);

            try (OutputStream output = connection.getOutputStream()) {
                output.write(bytes);
            }

            int status = connection.getResponseCode();

            if (status < 200 || status >= 300) {
                return null;
            }

            StringBuilder raw = new StringBuilder();

            try (
                    InputStream input = connection.getInputStream();
                    BufferedReader reader = new BufferedReader(
                            new InputStreamReader(
                                    input,
                                    StandardCharsets.UTF_8
                            )
                    )
            ) {
                String line;

                while ((line = reader.readLine()) != null) {
                    raw.append(line);
                }
            }

            JSONObject response =
                    new JSONObject(raw.toString());

            if (
                    !response.optBoolean("handled", false) ||
                    !"device".equals(response.optString("mode"))
            ) {
                return null;
            }

            String command = response
                    .optString("command", "")
                    .trim();

            return command.isEmpty() ? null : command;

        } catch (Exception ignored) {
            return null;

        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
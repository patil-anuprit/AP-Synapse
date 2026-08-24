package com.apsynapse.app.presence;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.service.voice.VoiceInteractionSession;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class PresenceSession
    extends VoiceInteractionSession
    implements RecognitionListener,
               TextToSpeech.OnInitListener {

    private static final String API =
        "https://ap-synapse-backend.onrender.com/chat";

    private static final String UTTERANCE =
        "AP_PRESENCE_REPLY";

    private final Context context;

    private final Handler main =
        new Handler(Looper.getMainLooper());

    private final ExecutorService executor =
        Executors.newSingleThreadExecutor();

    private SpeechRecognizer recognizer;
    private TextToSpeech tts;

    // AP_TTS_READY_QUEUE_V4
    private boolean ttsReady = false;
    private String pendingSpeech;

    private TextView status;
    private TextView response;

    private boolean listening = false;

    // AP_CONFIRMATION_CONTINUATION_V341
    private boolean confirmationExpected = false;
    private LinearLayout confirmationActions;

    private long presenceUntil = 0L;

    public PresenceSession(Context context) {

        super(context);

        this.context =
            context.getApplicationContext();
    }

    @Override
    public void onCreate() {

        super.onCreate();

        tts =
            new TextToSpeech(
                context,
                this
            );
    }

    @Override
    public View onCreateContentView() {

        FrameLayout root =
            new FrameLayout(context);

        root.setBackgroundColor(
            Color.TRANSPARENT
        );

        LinearLayout card =
            new LinearLayout(context);

        card.setOrientation(
            LinearLayout.VERTICAL
        );

        card.setPadding(
            dp(20),
            dp(17),
            dp(20),
            dp(18)
        );

        GradientDrawable background =
            new GradientDrawable();

        background.setColor(
            Color.rgb(18, 19, 21)
        );

        background.setCornerRadius(
            dp(25)
        );

        background.setStroke(
            dp(1),
            Color.rgb(74, 65, 45)
        );

        card.setBackground(background);


        LinearLayout top =
            new LinearLayout(context);

        top.setOrientation(
            LinearLayout.HORIZONTAL
        );

        top.setGravity(
            Gravity.CENTER_VERTICAL
        );


        TextView mark =
            new TextView(context);

        mark.setText("AP");

        mark.setTextColor(
            Color.rgb(225, 187, 103)
        );

        mark.setTextSize(14);

        mark.setGravity(
            Gravity.CENTER
        );


        TextView title =
            new TextView(context);

        title.setText(
            "  Aprisha"
        );

        title.setTextColor(
            Color.rgb(248, 245, 237)
        );

        title.setTextSize(16);


        status =
            new TextView(context);

        status.setText(
            "Ready"
        );

        status.setTextColor(
            Color.rgb(218, 181, 99)
        );

        status.setTextSize(11);

        status.setPadding(
            0,
            dp(11),
            0,
            dp(7)
        );


        response =
            new TextView(context);

        response.setText(
            "Ask Aprisha anything."
        );

        response.setTextColor(
            Color.rgb(220, 218, 211)
        );

        response.setTextSize(14);

        response.setLineSpacing(
            0,
            1.16f
        );


        LinearLayout actions =
            new LinearLayout(context);

        actions.setOrientation(
            LinearLayout.HORIZONTAL
        );

        actions.setGravity(
            Gravity.END
        );

        actions.setPadding(
            0,
            dp(15),
            0,
            0
        );


        Button listen =
            smallButton(
                "Speak"
            );

        listen.setOnClickListener(
            v -> startListening()
        );


        Button open =
            smallButton(
                "Open AP"
            );

        open.setOnClickListener(
            v -> openAP()
        );


        Button close =
            smallButton(
                "Close"
            );

        close.setOnClickListener(
            v -> finish()
        );


        top.addView(mark);
        top.addView(title);

        confirmationActions = new LinearLayout(context);
        confirmationActions.setOrientation(LinearLayout.HORIZONTAL);
        confirmationActions.setGravity(Gravity.END);
        confirmationActions.setPadding(0, dp(12), 0, 0);
        confirmationActions.setVisibility(View.GONE);

        Button confirm = smallButton("Yes");
        confirm.setOnClickListener(v -> submitConfirmation(true));

        Button reject = smallButton("Cancel");
        reject.setOnClickListener(v -> submitConfirmation(false));

        confirmationActions.addView(confirm);
        confirmationActions.addView(reject);

        actions.addView(listen);
        actions.addView(open);
        actions.addView(close);

        card.addView(top);
        card.addView(status);
        card.addView(response);
        card.addView(confirmationActions);
        card.addView(actions);


        FrameLayout.LayoutParams params =
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );

        params.gravity =
            Gravity.BOTTOM;

        params.leftMargin =
            dp(12);

        params.rightMargin =
            dp(12);

        params.bottomMargin =
            dp(18);

        root.addView(
            card,
            params
        );

        return root;
    }

    @Override
    public void onShow(
        Bundle args,
        int showFlags
    ) {

        super.onShow(
            args,
            showFlags
        );

        /*
         * AP Presence Session:
         * user can continue naturally without repeating
         * an invocation phrase for 45 seconds.
         */

        presenceUntil =
            SystemClock.elapsedRealtime()
            + 180_000L; // AP_APRISHA_V8_CONVERSATION_WINDOW

        Intent wakeSuspend =
            new Intent(
                PresenceVoiceInteractionService.ACTION_WAKE_SUSPEND
            );

        wakeSuspend.setPackage(
            context.getPackageName()
        );

        context.sendBroadcast(
            wakeSuspend
        );

        AprishaHealthStore.recordWakeState(
            context,
            "session active",
            "listening for your command"
        );

        playReadyTone();

        main.postDelayed(
            this::startListening,
            220
        );
    }

    private void playReadyTone() {

        try {

            ToneGenerator tone =
                new ToneGenerator(
                    AudioManager.STREAM_NOTIFICATION,
                    72
                );

            tone.startTone(
                ToneGenerator.TONE_PROP_BEEP,
                120
            );

            main.postDelayed(
                tone::release,
                350L
            );

        } catch (Throwable ignored) {}
    }

    private void submitConfirmation(boolean confirmed) {
        if (confirmationActions != null) {
            confirmationActions.setVisibility(View.GONE);
        }

        if (tts != null) {
            try { tts.stop(); } catch (Throwable ignored) {}
        }

        if (recognizer != null) {
            try { recognizer.cancel(); } catch (Throwable ignored) {}
        }

        listening = false;
        responseText(confirmed ? "Yes" : "Cancel");
        handleRequest(confirmed ? "yes" : "cancel");
    }

    private void ensureConfirmationListening() {
        if (!confirmationExpected || listening) {
            return;
        }

        if (tts != null && tts.isSpeaking()) {
            main.postDelayed(this::ensureConfirmationListening, 350L);
            return;
        }

        playReadyTone();
        startListening();
    }

    private void startListening() {
        // AP_CONFIRMATION_LISTEN_GUARD_V341
        if (listening) {
            return;
        }

        if (tts != null && tts.isSpeaking()) {
            main.postDelayed(this::startListening,
            120L);
            return;
        }

        if (
            SystemClock.elapsedRealtime()
                > presenceUntil
        ) {

            statusText(
                "Tap Speak to continue"
            );

            return;
        }

        if (
            context.checkSelfPermission(
                Manifest.permission.RECORD_AUDIO
            )
            !=
            PackageManager.PERMISSION_GRANTED
        ) {

            statusText(
                "Microphone permission required"
            );

            return;
        }

        if (
            !SpeechRecognizer
                .isRecognitionAvailable(
                    context
                )
        ) {

            statusText(
                "Speech recognition unavailable"
            );

            return;
        }

        try {

            if (recognizer == null) {

                android.content.ComponentName
                    externalRecognizer =
                        AprishaRecognitionService
                            .findExternalRecognizer(
                                context
                            );

                recognizer =
                    externalRecognizer == null
                        ? SpeechRecognizer
                            .createSpeechRecognizer(
                                context
                            )
                        : SpeechRecognizer
                            .createSpeechRecognizer(
                                context,
                                externalRecognizer
                            );

                recognizer
                    .setRecognitionListener(
                        this
                    );
            }

            Intent intent =
                new Intent(
                    RecognizerIntent
                        .ACTION_RECOGNIZE_SPEECH
                );

            intent.putExtra(
                RecognizerIntent
                    .EXTRA_LANGUAGE_MODEL,
                RecognizerIntent
                    .LANGUAGE_MODEL_FREE_FORM
            );

            intent.putExtra(
                RecognizerIntent
                    .EXTRA_PARTIAL_RESULTS,
                true
            );

            intent.putExtra(
                RecognizerIntent
                    .EXTRA_MAX_RESULTS,
                3
            );

            listening =
                true;

            statusText(
                "Listening"
            );

            responseText(
                "I'm listeningÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦"
            );

            recognizer
                .startListening(
                    intent
                );

        } catch (Exception e) {

            listening =
                false;

            statusText(
                "Tap Speak to try again"
            );
        }
    }

    @Override
    public void onResults(
        Bundle results
    ) {

        listening =
            false;

        ArrayList<String> matches =
            results.getStringArrayList(
                SpeechRecognizer
                    .RESULTS_RECOGNITION
            );

        if (
            matches == null ||
            matches.isEmpty()
        ) {

            resumeListeningSoon();

            return;
        }

        String text =
            matches.get(0)
                .trim();

        if (text.isEmpty()) {

            resumeListeningSoon();

            return;
        }

        responseText(text);

        handleRequest(text);
    }

    @Override
    public void onPartialResults(
        Bundle partialResults
    ) {

        ArrayList<String> matches =
            partialResults
                .getStringArrayList(
                    SpeechRecognizer
                        .RESULTS_RECOGNITION
                );

        if (
            matches != null &&
            !matches.isEmpty()
        ) {

            responseText(
                matches.get(0)
            );
        }
    }

    private void handleRequest(
        String text
    ) {

        String normalized =
            text.toLowerCase(
                Locale.ROOT
            );

        // AP_CONFIRMATION_REPLY_V341
        boolean confirmationReply =
            confirmationExpected &&
            (normalized.equals("yes") ||
             normalized.equals("yeah") ||
             normalized.equals("yep") ||
             normalized.equals("confirm") ||
             normalized.equals("do it") ||
             normalized.equals("go ahead") ||
             normalized.equals("no") ||
             normalized.equals("cancel"));

        if (confirmationReply) {
            confirmationExpected = false;
            if (confirmationActions != null) {
                confirmationActions.setVisibility(View.GONE);
            }
        }


        if (
            normalized.equals("stop") ||
            normalized.equals("goodbye") ||
            normalized.equals("close") ||
            (normalized.equals("cancel") && !confirmationReply)
        ) {

            finish();

            return;
        }


        if (
            normalized.contains(
                "stay with me"
            )
        ) {

            presenceUntil =
                SystemClock
                    .elapsedRealtime()
                + 120_000L;

            answer(
                "I'm here. You can keep talking without saying Hey Aprisha again."
            );

            return;
        }


        if (
            normalized.equals(
                "open ap"
            )
            ||
            normalized.contains(
                "open ap synapse"
            )
        ) {

            openAP();

            return;
        }


        statusText(
            "Thinking"
        );

        executor.execute(
            () -> {

                String reply =
                    requestAP(text);

                main.post(
                    () ->
                        answer(reply)
                );
            }
        );
    }

    private String requestAP(
        String message
    ) {

        // AP_PRESENCE_DEVICE_FIRST_STRING_ROUTER

        /*
         * ====================================================
         * APRISHA DEVICE-FIRST EXECUTION
         *
         * requestAP() returns String, therefore native actions
         * simply return their spoken response.
         *
         * Examples:
         *
         * "Call Mom"
         *   -> confirmation response returned immediately
         *
         * "Yes"
         *   -> pending call executes
         *   -> "Calling Mom." returned
         *
         * "Open YouTube"
         *   -> Android action executes
         *   -> response returned
         *
         * "What is DNA?"
         *   -> nativeAction.handled == false
         *   -> normal AP Synapse request continues below
         * ====================================================
         */

                // AP_APRISHA_NOTIFICATION_PIPELINE_V6
        AprishaNotificationBridge.Result notificationAction =
                AprishaNotificationBridge.route(
                        getContext(),
                        message
                );

        if (
                notificationAction.handled
        ) {
            return notificationAction.response;
        }

        // AP_APRISHA_CONTEXT_PIPELINE_V9
        // Resolve safe conversational follow-ups before local/agent routing.
        message =
                AprishaContextCore.resolve(
                        getContext(),
                        message
                );

        // AP_APRISHA_SCREEN_CONTEXT_PIPELINE_V11
        if (
                AprishaAssistContextCore
                        .isScreenContextRequest(
                                message
                        )
        ) {

            String contextualMessage =
                    AprishaAssistContextCore
                            .augment(
                                    message
                            );

            if (
                    contextualMessage == null ||
                    contextualMessage.trim().isEmpty()
            ) {

                return "I couldn't access useful context from this screen. The app may not provide Android assist data.";
            }

            message =
                    contextualMessage;
        }

        // AP_APRISHA_TIME_PIPELINE_V10
        AprishaScheduleCore.Result scheduleAction =
                AprishaScheduleCore.route(
                        getContext(),
                        message
                );

        if (scheduleAction.handled) {
            return scheduleAction.response;
        }

        // AP_APRISHA_UNIVERSAL_PIPELINE_V8
        AprishaUniversalCore.Result universalAction =
                AprishaUniversalCore.route(
                        getContext(),
                        message
                );

        if (
                universalAction.handled
        ) {
            return universalAction.response;
        }

        // AP_APRISHA_AGENT_V5_PIPELINE
        AprishaAgentBridge.Result agentAction =
                null;

        boolean agentCandidate =
                AprishaAgentBridge
                        .looksActionLike(
                                message
                        );

        if (
                agentCandidate &&
                AprishaAgentBridge
                        .looksCompound(
                                message
                        )
        ) {

            agentAction =
                    AprishaAgentBridge.route(
                            getContext(),
                            message
                    );

            if (
                    agentAction.handled
            ) {
                return agentAction.response;
            }
        }

PresenceActionBridge.Result nativeAction =
                PresenceActionBridge.route(
                        getContext(),
                        message
                );

        if (
                nativeAction.handled
        ) {

            return nativeAction.response;
        }

        // AP_APRISHA_LIVE_DEVICE_FALLBACK_V1
        String liveCommand =
                AprishaLiveRouter.resolve(message);

        if (
                liveCommand != null &&
                !liveCommand.trim().isEmpty()
        ) {

            PresenceActionBridge.Result liveAction =
                    PresenceActionBridge.route(
                            getContext(),
                            liveCommand
                    );

            if (liveAction.handled) {
                return liveAction.response;
            }
        }



        if (
                agentCandidate &&
                agentAction == null
        ) {

            agentAction =
                    AprishaAgentBridge.route(
                            getContext(),
                            message
                    );

            if (
                    agentAction.handled
            ) {
                return agentAction.response;
            }
        }

        HttpURLConnection connection =
            null;

        try {

            URL url =
                new URL(API);

            connection =
                (HttpURLConnection)
                    url.openConnection();

            connection.setRequestMethod(
                "POST"
            );

            connection.setConnectTimeout(
                15_000
            );

            connection.setReadTimeout(
                60_000
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
                "*/*"
            );

            connection.setRequestProperty(
                "x-session-id",
                presenceSessionId()
            );

            JSONObject body =
                new JSONObject();

            body.put(
                "message",
                message
            );

            body.put(
                "source",
                "ap-presence-android"
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

                output.write(bytes);
            }

            int code =
                connection
                    .getResponseCode();

            InputStream stream =
                code >= 200 &&
                code < 300
                    ?
                    connection
                        .getInputStream()
                    :
                    connection
                        .getErrorStream();

            if (stream == null) {

                return
                    "AP could not reach the intelligence service.";
            }

            BufferedReader reader =
                new BufferedReader(
                    new InputStreamReader(
                        stream,
                        StandardCharsets.UTF_8
                    )
                );

            StringBuilder raw =
                new StringBuilder();

            String line;

            while (
                (line = reader.readLine())
                    != null
            ) {

                raw.append(line)
                    .append('\n');
            }

            String parsed =
                parseBackendReply(
                    raw.toString()
                );

            if (
                parsed == null ||
                parsed.trim().isEmpty()
            ) {

                return
                    "I received an empty response. Please try again.";
            }

            return parsed.trim();

        } catch (Exception e) {

            return
                "I couldn't reach AP Synapse right now. Please try again.";

        } finally {

            if (connection != null) {

                connection
                    .disconnect();
            }
        }
    }

    private String parseBackendReply(
        String raw
    ) {

        String value =
            raw == null
                ? ""
                : raw.trim();

        if (value.isEmpty()) {
            return "";
        }

        try {

            JSONObject json =
                new JSONObject(value);

            String extracted =
                extractJSON(json);

            if (
                extracted != null &&
                !extracted.isEmpty()
            ) {

                return extracted;
            }

        } catch (Exception ignored) {}


        /*
         * Support streaming/SSE-style responses too.
         */

        StringBuilder result =
            new StringBuilder();

        String[] lines =
            value.split("\\r?\\n");

        for (String line : lines) {

            String part =
                line.trim();

            if (
                part.startsWith(
                    "data:"
                )
            ) {

                part =
                    part.substring(5)
                        .trim();
            }

            if (
                part.isEmpty() ||
                part.equals("[DONE]")
            ) {

                continue;
            }

            try {

                JSONObject json =
                    new JSONObject(part);

                String extracted =
                    extractJSON(json);

                if (
                    extracted != null
                ) {

                    result.append(
                        extracted
                    );
                }

            } catch (Exception e) {

                result.append(part);
            }
        }

        if (
            result.length() > 0
        ) {

            return result.toString();
        }

        return value;
    }

    private String extractJSON(
        JSONObject json
    ) {

        String[] direct = {
            "reply",
            "response",
            "content",
            "text",
            "answer"
        };

        for (
            String key :
            direct
        ) {

            String value =
                json.optString(
                    key,
                    ""
                );

            if (!value.isEmpty()) {

                return value;
            }
        }

        JSONObject delta =
            json.optJSONObject(
                "delta"
            );

        if (delta != null) {

            String value =
                delta.optString(
                    "content",
                    ""
                );

            if (!value.isEmpty()) {

                return value;
            }
        }

        JSONObject message =
            json.optJSONObject(
                "message"
            );

        if (message != null) {

            String value =
                message.optString(
                    "content",
                    ""
                );

            if (!value.isEmpty()) {

                return value;
            }
        }

        return "";
    }

    private String presenceSessionId() {

        android.content.SharedPreferences prefs =
            context.getSharedPreferences(
                "ap_presence",
                Context.MODE_PRIVATE
            );

        String id =
            prefs.getString(
                "session_id",
                null
            );

        if (id == null) {

            id =
                UUID.randomUUID()
                    .toString();

            prefs.edit()
                .putString(
                    "session_id",
                    id
                )
                .apply();
        }

        return
            "android-presence-" +
            id;
    }

    private void answer(
        String text
    ) {

        statusText(
            "Aprisha"
        );

        responseText(text);

        // AP_CONFIRMATION_ANSWER_V341
        confirmationExpected =
            text != null &&
            text.toLowerCase(Locale.ROOT).contains("say yes or cancel");

        if (confirmationActions != null) {
            confirmationActions.setVisibility(
                confirmationExpected ? View.VISIBLE : View.GONE
            );
        }

        if (confirmationExpected) {
            presenceUntil = SystemClock.elapsedRealtime() + 90_000L;
            main.postDelayed(this::ensureConfirmationListening, 4_000L);
        }

        speak(text);
    }

    private void speak(
        String text
    ) {

        if (tts == null || !ttsReady) {

            pendingSpeech = text;

            return;
        }

        String spoken =
            text
                .replaceAll(
                    "```[\\s\\S]*?```",
                    " code example "
                )
                .replaceAll(
                    "\\[([^\\]]+)\\]\\([^\\)]+\\)",
                    "$1"
                )
                .replaceAll(
                    "[#*_`>]",
                    ""
                );

        int speakResult = tts.speak(
            spoken,
            TextToSpeech.QUEUE_FLUSH,
            null,
            UTTERANCE
        );

        if (speakResult == TextToSpeech.ERROR) {
            main.post(this::resumeListeningSoon);
        }
    }

    private void resumeListeningSoon() {

        if (
            SystemClock.elapsedRealtime()
            <
            presenceUntil
        ) {

            main.postDelayed(
                this::startListening,
                320L
            );

        } else {

            /*
             * Close the active voice session after its
             * spoken answer. onDestroy() then broadcasts
             * ACTION_WAKE_RESUME and Sherpa listens again.
             */
            main.postDelayed(
                this::finish,
                350L
            );
        }
    }

    private void openAP() {

        try {

            Intent intent =
                new Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse(
                        "https://ap-synapse.vercel.app/"
                    )
                );

            intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
            );

            context.startActivity(
                intent
            );

            finish();

        } catch (Exception e) {

            responseText(
                "AP Synapse could not be opened."
            );
        }
    }

    private Button smallButton(
        String text
    ) {

        Button button =
            new Button(context);

        button.setText(text);

        button.setTextColor(
            Color.rgb(
                232,
                228,
                218
            )
        );

        button.setTextSize(11);

        button.setAllCaps(false);

        button.setBackgroundColor(
            Color.TRANSPARENT
        );

        return button;
    }

    private void statusText(
        String value
    ) {

        if (status != null) {

            status.setText(value);
        }
    }

    private void responseText(
        String value
    ) {

        if (response != null) {

            response.setText(value);
        }
    }

    private int dp(
        int value
    ) {

        return Math.round(
            value *
            context
                .getResources()
                .getDisplayMetrics()
                .density
        );
    }

    @Override
    public void onInit(
        int statusCode
    ) {

        if (
            statusCode ==
            TextToSpeech.SUCCESS
        ) {

            int languageResult =
                tts.setLanguage(
                    Locale.getDefault()
                );

            if (
                languageResult == TextToSpeech.LANG_MISSING_DATA ||
                languageResult == TextToSpeech.LANG_NOT_SUPPORTED
            ) {
                languageResult = tts.setLanguage(Locale.US);
            }

            if (
                languageResult == TextToSpeech.LANG_MISSING_DATA ||
                languageResult == TextToSpeech.LANG_NOT_SUPPORTED
            ) {
                ttsReady = false;
                pendingSpeech = null;
                responseText(
                    "Android text-to-speech is not installed or enabled."
                );
                main.post(this::resumeListeningSoon);
                return;
            }

            tts.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(
                        AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY
                    )
                    .setContentType(
                        AudioAttributes.CONTENT_TYPE_SPEECH
                    )
                    .build()
            );

            tts.setSpeechRate(
                1.02f
            );

            tts.setPitch(
                1.0f
            );

            tts.setOnUtteranceProgressListener(
                new UtteranceProgressListener() {

                    @Override
                    public void onStart(
                        String utteranceId
                    ) {}

                    @Override
                    public void onDone(
                        String utteranceId
                    ) {

                        main.post(
                            () ->
                                resumeListeningSoon()
                        );
                    }

                    @Override
                    public void onError(
                        String utteranceId
                    ) {

                        main.post(
                            () ->
                                resumeListeningSoon()
                        );
                    }
                }
            );

            ttsReady = true;

            String queued = pendingSpeech;
            pendingSpeech = null;

            if (
                queued != null &&
                !queued.trim().isEmpty()
            ) {
                main.post(
                    () -> speak(queued)
                );
            }

        } else {

            ttsReady = false;
            pendingSpeech = null;

            main.post(
                this::resumeListeningSoon
            );
        }
    }

    @Override
    public void onError(
        int error
    ) {

        listening = false;

        // AP_CONFIRMATION_ERROR_RECOVERY_V341
        if (confirmationExpected) {
            if (recognizer != null) {
                try { recognizer.destroy(); } catch (Throwable ignored) {}
                recognizer = null;
            }
            main.postDelayed(this::ensureConfirmationListening, 700L);
            return;
        }

        if (
            error ==
                SpeechRecognizer.ERROR_NO_MATCH
            ||
            error ==
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT
        ) {

            resumeListeningSoon();

            return;
        }

        statusText(
            "Tap Speak to continue"
        );
    }

    @Override
    public void onReadyForSpeech(
        Bundle params
    ) {

        statusText(
            "Listening"
        );
    }

    @Override
    public void onBeginningOfSpeech() {

        statusText(
            "Listening"
        );
    }

    @Override
    public void onEndOfSpeech() {

        statusText(
            "Thinking"
        );
    }

    @Override
    public void onRmsChanged(
        float rmsdB
    ) {}

    @Override
    public void onBufferReceived(
        byte[] buffer
    ) {}

    @Override
    public void onEvent(
        int eventType,
        Bundle params
    ) {}

    @Override
    public void onDestroy() {

        if (recognizer != null) {

            try {

                recognizer.cancel();
                recognizer.destroy();

            } catch (Exception ignored) {}
        }

        if (tts != null) {

            try {

                tts.stop();
                tts.shutdown();

            } catch (Exception ignored) {}
        }

        executor.shutdownNow();

        try {

            Intent wakeResume =
                new Intent(
                    PresenceVoiceInteractionService
                        .ACTION_WAKE_RESUME
                );

            wakeResume.setPackage(
                context.getPackageName()
            );

            context.sendBroadcast(
                wakeResume
            );

        }
        catch (
            Throwable ignored
        ) {}


        super.onDestroy();
    }

    // AP_APRISHA_ASSIST_CAPTURE_V11

    @Override
    public void onHandleAssist(
            android.service.voice.VoiceInteractionSession.AssistState state
    ) {

        super.onHandleAssist(state);

        AprishaAssistContextCore.capture(
                state
        );
    }


    @Override
    @SuppressWarnings("deprecation")
    public void onHandleAssist(
            android.os.Bundle data,
            android.app.assist.AssistStructure structure,
            android.app.assist.AssistContent content
    ) {

        super.onHandleAssist(
                data,
                structure,
                content
        );

        AprishaAssistContextCore.captureLegacy(
                structure,
                content
        );
    }

}

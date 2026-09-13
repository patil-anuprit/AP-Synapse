package com.apsynapse.app.aprisha;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import java.util.ArrayList;
import java.util.Locale;

public final class AprishaRuntimeService extends Service {

    private static final String TAG =
            "AprishaRuntime";

    private static final String CHANNEL =
            "aprisha_presence";

    private static final int NOTIFICATION_ID =
            7301;

    private static final long SESSION_MS =
            60_000L;

    private static final String AP_URL =
            "https://ap-synapse.com/";

    private final Handler handler =
            new Handler(Looper.getMainLooper());

    private SpeechRecognizer recognizer;
    private Intent recognitionIntent;

    private boolean listening = false;
    private boolean executing = false;
    private boolean destroyed = false;

    private long sessionUntil = 0L;

    private Runnable restartTask;

    @Override
    public void onCreate() {
        super.onCreate();

        createChannel();

        startAsForeground(
                "Starting Aprisha…"
        );

        createRecognizer();

        restart(500);

        Log.i(
                TAG,
                "APRISHA NATIVE RUNTIME READY"
        );
    }

    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {
        restart(200);
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }


    // ========================================================
    // NOTIFICATION
    // ========================================================

    private void createChannel() {

        if (Build.VERSION.SDK_INT < 26) {
            return;
        }

        NotificationChannel channel =
                new NotificationChannel(
                        CHANNEL,
                        "Aprisha Presence",
                        NotificationManager.IMPORTANCE_LOW
                );

        channel.setDescription(
                "Keeps Aprisha available on this device."
        );

        NotificationManager manager =
                getSystemService(
                        NotificationManager.class
                );

        if (manager != null) {
            manager.createNotificationChannel(
                    channel
            );
        }
    }

    private Notification notification(
            String text
    ) {

        Intent stopIntent =
                new Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse(
                                "apsynapse://runtime/stop"
                        ),
                        this,
                        AprishaRuntimeActivity.class
                );

        PendingIntent stopPending =
                PendingIntent.getActivity(
                        this,
                        42,
                        stopIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );

        Notification.Builder builder;

        if (Build.VERSION.SDK_INT >= 26) {
            builder =
                    new Notification.Builder(
                            this,
                            CHANNEL
                    );
        } else {
            builder =
                    new Notification.Builder(
                            this
                    );
        }

        return builder
                .setSmallIcon(
                        android.R.drawable.ic_btn_speak_now
                )
                .setContentTitle(
                        "AP Synapse • Aprisha"
                )
                .setContentText(text)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .addAction(
                        android.R.drawable.ic_delete,
                        "Stop",
                        stopPending
                )
                .build();
    }

    private void startAsForeground(
            String text
    ) {

        Notification n =
                notification(text);

        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(
                    NOTIFICATION_ID,
                    n,
                    ServiceInfo
                            .FOREGROUND_SERVICE_TYPE_MICROPHONE
            );
        } else {
            startForeground(
                    NOTIFICATION_ID,
                    n
            );
        }
    }

    private void status(
            String text
    ) {

        NotificationManager manager =
                (NotificationManager)
                        getSystemService(
                                NOTIFICATION_SERVICE
                        );

        if (manager != null) {
            manager.notify(
                    NOTIFICATION_ID,
                    notification(text)
            );
        }
    }


    // ========================================================
    // SPEECH
    // ========================================================

    private void createRecognizer() {

        if (
                !SpeechRecognizer
                        .isRecognitionAvailable(
                                this
                        )
        ) {
            status(
                    "Speech recognition unavailable"
            );
            return;
        }

        try {

            if (
                    Build.VERSION.SDK_INT >= 31 &&
                    SpeechRecognizer
                            .isOnDeviceRecognitionAvailable(
                                    this
                            )
            ) {
                recognizer =
                        SpeechRecognizer
                                .createOnDeviceSpeechRecognizer(
                                        this
                                );
            } else {
                recognizer =
                        SpeechRecognizer
                                .createSpeechRecognizer(
                                        this
                                );
            }

        } catch (Throwable error) {

            recognizer =
                    SpeechRecognizer
                            .createSpeechRecognizer(
                                    this
                            );
        }

        recognitionIntent =
                new Intent(
                        RecognizerIntent
                                .ACTION_RECOGNIZE_SPEECH
                );

        recognitionIntent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        );

        recognitionIntent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE,
                "en-IN"
        );

        recognitionIntent.putExtra(
                RecognizerIntent.EXTRA_PARTIAL_RESULTS,
                true
        );

        recognitionIntent.putExtra(
                RecognizerIntent.EXTRA_MAX_RESULTS,
                5
        );

        recognizer.setRecognitionListener(
                listener
        );
    }

    private final RecognitionListener listener =
            new RecognitionListener() {

        @Override
        public void onReadyForSpeech(
                Bundle params
        ) {
            listening = true;

            status(
                    sessionActive()
                            ? "Aprisha is listening"
                            : "Listening for “Hey Aprisha”"
            );
        }

        @Override
        public void onBeginningOfSpeech() {}

        @Override
        public void onRmsChanged(float rmsdB) {}

        @Override
        public void onBufferReceived(
                byte[] buffer
        ) {}

        @Override
        public void onEndOfSpeech() {}

        @Override
        public void onError(int error) {

            listening = false;

            if (
                    error !=
                            SpeechRecognizer.ERROR_CLIENT
            ) {
                Log.d(
                        TAG,
                        "Speech error: " + error
                );
            }

            restart(600);
        }

        @Override
        public void onResults(
                Bundle results
        ) {
            listening = false;

            String text =
                    bestResult(results);

            if (!text.isEmpty()) {
                processSpeech(text);
            }

            restart(500);
        }

        @Override
        public void onPartialResults(
                Bundle partialResults
        ) {
            /*
             * Intentionally do not execute partial speech.
             *
             * This prevents:
             *
             * "Hey Aprisha"
             *
             * from executing before Chrome/Android reaches:
             *
             * "Hey Aprisha open Code Studio"
             */
        }

        @Override
        public void onEvent(
                int eventType,
                Bundle params
        ) {}
    };

    private String bestResult(
            Bundle bundle
    ) {

        if (bundle == null) {
            return "";
        }

        ArrayList<String> list =
                bundle.getStringArrayList(
                        SpeechRecognizer
                                .RESULTS_RECOGNITION
                );

        if (
                list == null ||
                list.isEmpty()
        ) {
            return "";
        }

        String best = "";

        for (String item : list) {

            if (
                    item != null &&
                    item.trim().length() >
                            best.length()
            ) {
                best =
                        item.trim();
            }
        }

        Log.i(
                TAG,
                "HEARD → " + best
        );

        return best;
    }

    private void restart(
            long delay
    ) {

        if (
                destroyed ||
                executing
        ) {
            return;
        }

        if (restartTask != null) {
            handler.removeCallbacks(
                    restartTask
            );
        }

        restartTask =
                this::startListening;

        handler.postDelayed(
                restartTask,
                delay
        );
    }

    private void startListening() {

        restartTask = null;

        if (
                destroyed ||
                executing ||
                listening ||
                recognizer == null
        ) {
            return;
        }

        if (
                Build.VERSION.SDK_INT >= 23 &&
                checkSelfPermission(
                        Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            status(
                    "Microphone permission required"
            );
            return;
        }

        try {

            recognizer.startListening(
                    recognitionIntent
            );

        } catch (Throwable error) {

            Log.w(
                    TAG,
                    "Recognition start failed",
                    error
            );

            restart(900);
        }
    }

    private void stopListening() {

        listening = false;

        try {

            if (recognizer != null) {
                recognizer.cancel();
            }

        } catch (Throwable ignored) {}
    }


    // ========================================================
    // WAKE + SESSION
    // ========================================================

    private static final class Wake {

        boolean found;
        String command;

        Wake(
                boolean found,
                String command
        ) {
            this.found = found;

            this.command =
                    command == null
                            ? ""
                            : command.trim();
        }
    }

    private String clean(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .toLowerCase(Locale.ROOT)
                .replaceAll(
                        "[^a-z0-9\\s]",
                        " "
                )
                .replaceAll(
                        "\\s+",
                        " "
                )
                .trim();
    }

    private Wake detectWake(
            String raw
    ) {

        String text =
                clean(raw);

        String[] aliases = {

                "hey aprisha",
                "hi aprisha",

                "hey apreesha",
                "hey aprisa",

                "hey presha",
                "hi presha",

                "hey prisha",
                "hey preesha",

                "hair pressure",
                "air pressure",

                "yah pressure",
                "yeah pressure",

                "yah presha",
                "yeah presha"
        };

        for (String wake : aliases) {

            int index =
                    text.indexOf(wake);

            if (
                    index >= 0 &&
                    index <= 8
            ) {

                return new Wake(
                        true,
                        text.substring(
                                index +
                                wake.length()
                        ).trim()
                );
            }
        }

        String[] words =
                text.split("\\s+");

        if (
                words.length >= 2 &&
                (
                        words[0].equals("hey") ||
                        words[0].equals("hi")
                )
        ) {

            String name =
                    words[1];

            if (
                    name.matches(
                            "^(apr|apre|appr|prish|presh|preesh)[a-z]{1,8}$"
                    )
            ) {

                StringBuilder command =
                        new StringBuilder();

                for (
                        int i = 2;
                        i < words.length;
                        i++
                ) {

                    if (
                            command.length() >
                            0
                    ) {
                        command.append(" ");
                    }

                    command.append(
                            words[i]
                    );
                }

                return new Wake(
                        true,
                        command.toString()
                );
            }
        }

        return new Wake(
                false,
                ""
        );
    }

    private boolean sessionActive() {

        return (
                SystemClock.elapsedRealtime()
                        <
                sessionUntil
        );
    }

    private void activateSession() {

        sessionUntil =
                SystemClock.elapsedRealtime()
                        +
                SESSION_MS;

        status(
                "Aprisha conversation active"
        );
    }

    private void processSpeech(
            String speech
    ) {

        if (executing) {
            return;
        }

        Wake wake =
                detectWake(speech);

        if (wake.found) {

            activateSession();

            if (wake.command.isEmpty()) {

                status(
                        "Aprisha is awake — speak"
                );

                return;
            }

            execute(
                    wake.command
            );

            return;
        }

        if (sessionActive()) {

            execute(speech);
        }
    }


    // ========================================================
    // EXECUTION
    // ========================================================

    private void execute(
            String command
    ) {

        String text =
                command == null
                        ? ""
                        : command.trim();

        if (text.isEmpty()) {
            return;
        }

        executing = true;

        stopListening();

        activateSession();

        String normalized =
                clean(text);

        Log.i(
                TAG,
                "EXECUTE → " +
                        normalized
        );

        try {

            if (
                    normalized.equals(
                            "open youtube"
                    ) ||
                    normalized.equals(
                            "launch youtube"
                    )
            ) {
                openUrl(
                        "https://www.youtube.com/"
                );
            }

            else if (
                    normalized.equals(
                            "open google"
                    )
            ) {
                openUrl(
                        "https://www.google.com/"
                );
            }

            else if (
                    normalized.equals(
                            "open gmail"
                    )
            ) {
                openUrl(
                        "https://mail.google.com/"
                );
            }

            else if (
                    normalized.equals(
                            "open github"
                    )
            ) {
                openUrl(
                        "https://github.com/"
                );
            }

            else if (
                    normalized.equals(
                            "open camera"
                    )
            ) {
                openCamera();
            }

            else if (
                    normalized.equals(
                            "open settings"
                    )
            ) {
                openSettings();
            }

            else if (
                    normalized.equals(
                            "open ap synapse"
                    ) ||
                    normalized.equals(
                            "go back to ap synapse"
                    )
            ) {
                openUrl(AP_URL);
            }

            else if (
                    normalized.equals(
                            "go to sleep"
                    ) ||
                    normalized.equals(
                            "stop listening"
                    )
            ) {
                stopSelf();
                return;
            }

            else {

                /*
                 * Everything sophisticated returns to
                 * AP Synapse's actual Aprisha engine.
                 *
                 * Example:
                 * open code studio
                 * create a project
                 * research something
                 * continue this task
                 */
                sendToSynapse(text);
            }

        } catch (Throwable error) {

            Log.e(
                    TAG,
                    "Native command failed",
                    error
            );

            sendToSynapse(text);
        }

        executing = false;

        restart(700);
    }


    // ========================================================
    // DEVICE ACTIONS
    // ========================================================

    private void openUrl(
            String url
    ) {

        Intent intent =
                new Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse(url)
                );

        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
        );

        startActivity(intent);
    }

    private void openCamera() {

        Intent intent =
                new Intent(
                        MediaStore
                                .ACTION_IMAGE_CAPTURE
                );

        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
        );

        startActivity(intent);
    }

    private void openSettings() {

        Intent intent =
                new Intent(
                        Settings.ACTION_SETTINGS
                );

        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
        );

        startActivity(intent);
    }

    private void sendToSynapse(
            String command
    ) {

        String target =
                AP_URL +
                "?aprishaCommand=" +
                Uri.encode(command);

        openUrl(target);
    }


    // ========================================================
    // CLEANUP
    // ========================================================

    @Override
    public void onDestroy() {

        destroyed = true;

        if (restartTask != null) {

            handler.removeCallbacks(
                    restartTask
            );

            restartTask = null;
        }

        stopListening();

        try {

            if (recognizer != null) {
                recognizer.destroy();
            }

        } catch (Throwable ignored) {}

        recognizer = null;

        super.onDestroy();
    }
}
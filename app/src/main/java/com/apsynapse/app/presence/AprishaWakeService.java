package com.apsynapse.app.presence;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import java.util.ArrayList;
import java.util.Locale;

public class AprishaWakeService extends Service {
    private static final String CHANNEL_ID = "aprisha_wake_mode";
    private static final int NOTIFICATION_ID = 4107;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private boolean running = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        startWakeNotification();
        startListeningLoop();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startWakeNotification();

        if (!running) {
            startListeningLoop();
        }

        return START_STICKY;
    }

    private void startWakeNotification() {
        Intent launchIntent =
                getPackageManager().getLaunchIntentForPackage(getPackageName());

        if (launchIntent == null) {
            launchIntent = new Intent();
        }

        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        PendingIntent pendingIntent =
                PendingIntent.getActivity(
                        this,
                        0,
                        launchIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
                );

        Notification.Builder builder =
                Build.VERSION.SDK_INT >= 26
                        ? new Notification.Builder(this, CHANNEL_ID)
                        : new Notification.Builder(this);

        Notification notification =
                builder
                        .setContentTitle("Aprisha Wake Mode")
                        .setContentText("Listening for Hey Aprisha")
                        .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                        .setOngoing(true)
                        .setContentIntent(pendingIntent)
                        .build();

        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void startListeningLoop() {
        if (Build.VERSION.SDK_INT >= 23 &&
                checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            stopSelf();
            return;
        }

        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            stopSelf();
            return;
        }

        running = true;

        destroyRecognizer();

        recognizer = SpeechRecognizer.createSpeechRecognizer(this);

        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {
                restartSoon(500);
            }

            @Override
            public void onError(int error) {
                restartSoon(900);
            }

            @Override
            public void onResults(Bundle results) {
                handleResults(results);
                restartSoon(450);
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                handleResults(partialResults);
            }

            @Override public void onEvent(int eventType, Bundle params) {}
        });

        listen();
    }

    private void listen() {
        if (recognizer == null) return;

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        );
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);

        try {
            recognizer.startListening(intent);
        } catch (Exception ignored) {
            restartSoon(1000);
        }
    }

    private void handleResults(Bundle bundle) {
        if (bundle == null) return;

        ArrayList<String> matches =
                bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

        if (matches == null) return;

        for (String raw : matches) {
            String text =
                    raw == null
                            ? ""
                            : raw.toLowerCase(Locale.ROOT).trim();

            if (
                    text.contains("hey aprisha") ||
                    text.contains("hi aprisha") ||
                    text.contains("ok aprisha") ||
                    text.contains("apreesha") ||
                    text.contains("aprisha")
            ) {
                openAprisha(text);
                return;
            }
        }
    }

    private void openAprisha(String phrase) {
        Intent launchIntent =
                getPackageManager().getLaunchIntentForPackage(getPackageName());

        if (launchIntent == null) return;

        launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
        );

        launchIntent.putExtra("ap_wake_mode", true);
        launchIntent.putExtra("ap_wake_phrase", phrase);

        try {
            startActivity(launchIntent);
        } catch (Exception ignored) {}
    }

    private void restartSoon(long delayMs) {
        handler.postDelayed(() -> {
            if (running) {
                listen();
            }
        }, delayMs);
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try {
                recognizer.destroy();
            } catch (Exception ignored) {}
            recognizer = null;
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < 26) return;

        NotificationChannel channel =
                new NotificationChannel(
                        CHANNEL_ID,
                        "Aprisha Wake Mode",
                        NotificationManager.IMPORTANCE_LOW
                );

        channel.setDescription("Keeps Aprisha ready for wake phrase detection.");

        NotificationManager manager =
                getSystemService(NotificationManager.class);

        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        running = false;
        destroyRecognizer();
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

package com.apsynapse.app.presence;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.service.voice.VoiceInteractionService;
import android.service.voice.VoiceInteractionSession;
import android.util.Log;

public class PresenceVoiceInteractionService
        extends VoiceInteractionService {

    public static final String ACTION_WAKE_RESUME =
            "com.apsynapse.app.presence.APRISHA_WAKE_RESUME";

    public static final String ACTION_WAKE_SUSPEND =
            "com.apsynapse.app.presence.APRISHA_WAKE_SUSPEND";

    private static final String TAG =
            "AP-APRISHA";

    private final Handler main =
            new Handler(
                    Looper.getMainLooper()
            );

    private AprishaWakeCore wakeCore;

    private boolean serviceReady = false;
    private boolean wakeSuspended = false;
    private boolean destroyed = false;

    private final Runnable wakeWatchdog =
            new Runnable() {

        @Override
        public void run() {
            if (destroyed) {
                return;
            }

            if (
                    serviceReady &&
                    !wakeSuspended &&
                    (wakeCore == null || !wakeCore.isRunning())
            ) {
                stopAprisha();
                startAprisha();
            }

            main.postDelayed(this, 5000L);
        }
    };


    private final BroadcastReceiver
            resumeReceiver =
            new BroadcastReceiver() {

        @Override
        public void onReceive(
                Context context,
                Intent intent
        ) {

            if (intent == null) {
                return;
            }

            if (ACTION_WAKE_SUSPEND.equals(intent.getAction())) {
                wakeSuspended = true;
                stopAprisha();
                return;
            }

            if (ACTION_WAKE_RESUME.equals(intent.getAction())) {

                wakeSuspended = false;

                main.postDelayed(
                        () -> startAprisha(),
                        500
                );
            }
        }
    };


    @Override
    public void onCreate() {

        super.onCreate();


        IntentFilter filter =
                new IntentFilter(
                        ACTION_WAKE_RESUME
                );

        filter.addAction(
                ACTION_WAKE_SUSPEND
        );


        if (
                Build.VERSION.SDK_INT >= 33
        ) {

            registerReceiver(
                    resumeReceiver,
                    filter,
                    Context.RECEIVER_NOT_EXPORTED
            );

        }
        else {

            registerReceiver(
                    resumeReceiver,
                    filter
            );
        }

        main.post(wakeWatchdog);
    }


    @Override
    public void onReady() {

        super.onReady();

        serviceReady = true;
        wakeSuspended = false;

        startAprisha();
    }


    private synchronized void startAprisha() {

        if (destroyed || !serviceReady || wakeSuspended) {
            return;
        }

        if (wakeCore != null && wakeCore.isRunning()) {

            return;
        }

        if (wakeCore != null) {
            wakeCore.stop();
            wakeCore = null;
        }


        wakeCore =
                new AprishaWakeCore(
                        this,
                        () ->
                                main.post(
                                        this::onAprishaDetected
                                )
                );


        wakeCore.start();

        // AP_NATIVE_WAKE_OWNER_V3
        if (!wakeCore.isRunning()) {
            wakeCore = null;

            Log.w(
                    TAG,
                    "Aprisha wake core did not start; retrying."
            );

            main.postDelayed(
                    this::startAprisha,
                    5000L
            );

            return;
        }

        Log.i(
                TAG,
                "Aprisha local wake core requested."
        );
    }


    private synchronized void stopAprisha() {

        if (
                wakeCore == null
        ) {

            return;
        }


        wakeCore.stop();

        wakeCore =
                null;
    }


    private void onAprishaDetected() {

        wakeSuspended = true;

        stopAprisha();


        Bundle args =
                new Bundle();


        args.putString(
                "ap_invocation",
                "hey_aprisha"
        );


        args.putLong(
                "ap_invocation_time",
                System.currentTimeMillis()
        );


        try {

            showSession(
                    args,
                    VoiceInteractionSession
                            .SHOW_WITH_ASSIST
            );

        }
        catch (Throwable error) {

            Log.e(
                    TAG,
                    "Could not display AP Presence.",
                    error
            );

            wakeSuspended = false;


            main.postDelayed(
                    this::startAprisha,
                    1000
            );
        }
    }


    @Override
    public void onLaunchVoiceAssistFromKeyguard() {

        wakeSuspended = true;
        stopAprisha();

        Bundle args =
                new Bundle();


        args.putString(
                "ap_invocation",
                "assistant_gesture"
        );


        try {
            showSession(
                    args,
                    VoiceInteractionSession
                            .SHOW_WITH_ASSIST
            );
        } catch (Throwable error) {
            Log.e(TAG, "Could not display Aprisha from keyguard.", error);
            wakeSuspended = false;
            main.postDelayed(this::startAprisha, 1000L);
        }
    }


    @Override
    public void onShutdown() {

        serviceReady = false;
        wakeSuspended = true;

        stopAprisha();

        super.onShutdown();
    }


    @Override
    public void onDestroy() {

        destroyed = true;
        serviceReady = false;
        wakeSuspended = true;
        main.removeCallbacks(wakeWatchdog);

        stopAprisha();


        try {

            unregisterReceiver(
                    resumeReceiver
            );

        }
        catch (
                Throwable ignored
        ) {}


        super.onDestroy();
    }
}

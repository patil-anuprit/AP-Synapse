package com.apsynapse.app.aprisha;

import android.os.Bundle;
import android.service.voice.VoiceInteractionService;
import android.service.voice.VoiceInteractionSession;
import android.util.Log;

public final class AprishaVoiceInteractionService
        extends VoiceInteractionService {

    private static final String TAG =
            "AprishaAssistant";


    @Override
    public void onReady() {

        super.onReady();

        Log.i(
                TAG,
                "APRISHA VOICE INTERACTION SERVICE READY"
        );
    }


    @Override
    public void onShutdown() {

        Log.i(
                TAG,
                "APRISHA VOICE INTERACTION SERVICE SHUTDOWN"
        );

        super.onShutdown();
    }


    /*
     * Allows Aprisha to explicitly request its session
     * later from Presence, notifications, device actions,
     * or supported hotword infrastructure.
     */
    public void openAprisha() {

        Bundle args =
                new Bundle();


        args.putString(
                "source",
                "aprisha"
        );


        showSession(
                args,
                VoiceInteractionSession.SHOW_WITH_ASSIST
        );
    }
}
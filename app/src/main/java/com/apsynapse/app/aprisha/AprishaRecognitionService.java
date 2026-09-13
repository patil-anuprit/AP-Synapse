package com.apsynapse.app.aprisha;

import android.content.Intent;
import android.os.RemoteException;
import android.speech.RecognitionService;
import android.speech.SpeechRecognizer;

public final class AprishaRecognitionService
        extends RecognitionService {

    @Override
    protected void onStartListening(
            Intent recognizerIntent,
            Callback listener
    ) {

        /*
         * Android 12+ does not use the legacy
         * recognitionService field for selecting
         * the system speech recognizer.
         *
         * This service exists so AP Synapse correctly
         * declares a complete VoiceInteractionService.
         */

        try {

            listener.error(
                    SpeechRecognizer
                            .ERROR_LANGUAGE_UNAVAILABLE
            );

        } catch (RemoteException ignored) {}
    }


    @Override
    protected void onStopListening(
            Callback listener
    ) {}


    @Override
    protected void onCancel(
            Callback listener
    ) {}
}
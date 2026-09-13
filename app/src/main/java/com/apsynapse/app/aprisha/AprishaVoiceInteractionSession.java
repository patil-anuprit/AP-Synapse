package com.apsynapse.app.aprisha;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.Settings;
import android.service.voice.VoiceInteractionSession;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.Locale;

public final class AprishaVoiceInteractionSession
        extends VoiceInteractionSession {

    private static final String AP_URL =
            "https://ap-synapse.com/";

    private SpeechRecognizer recognizer;

    private TextView title;
    private TextView transcript;


    public AprishaVoiceInteractionSession(
            Context context
    ) {

        super(context);
    }


    @Override
    public View onCreateContentView() {

        Context context =
                getContext();


        LinearLayout root =
                new LinearLayout(
                        context
                );


        root.setOrientation(
                LinearLayout.VERTICAL
        );


        root.setGravity(
                Gravity.CENTER
        );


        int padding =
                dp(28);


        root.setPadding(
                padding,
                padding,
                padding,
                padding
        );


        GradientDrawable background =
                new GradientDrawable();


        background.setColor(
                Color.rgb(
                        12,
                        12,
                        13
                )
        );


        background.setCornerRadius(
                dp(28)
        );


        background.setStroke(
                dp(1),
                Color.rgb(
                        174,
                        139,
                        75
                )
        );


        root.setBackground(
                background
        );


        title =
                new TextView(
                        context
                );


        title.setText(
                "Aprisha"
        );


        title.setTextColor(
                Color.rgb(
                        226,
                        187,
                        102
                )
        );


        title.setTextSize(
                26
        );


        title.setGravity(
                Gravity.CENTER
        );


        transcript =
                new TextView(
                        context
                );


        transcript.setText(
                "Listening…"
        );


        transcript.setTextColor(
                Color.rgb(
                        225,
                        225,
                        225
                )
        );


        transcript.setTextSize(
                17
        );


        transcript.setGravity(
                Gravity.CENTER
        );


        LinearLayout.LayoutParams textParams =
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );


        textParams.topMargin =
                dp(14);


        root.addView(
                title
        );


        root.addView(
                transcript,
                textParams
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


        closeSystemDialogs();


        setTranscript(
                "Listening…"
        );


        beginListening();
    }


    @Override
    public void onHide() {

        destroyRecognizer();

        super.onHide();
    }


    @Override
    public void onDestroy() {

        destroyRecognizer();

        super.onDestroy();
    }


    private void beginListening() {

        destroyRecognizer();


        if (
                !SpeechRecognizer
                        .isRecognitionAvailable(
                                getContext()
                        )
        ) {

            setTranscript(
                    "Speech recognition is unavailable on this device."
            );

            return;
        }


        recognizer =
                SpeechRecognizer
                        .createSpeechRecognizer(
                                getContext()
                        );


        recognizer.setRecognitionListener(
                listener
        );


        Intent intent =
                new Intent(
                        RecognizerIntent
                                .ACTION_RECOGNIZE_SPEECH
                );


        intent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        );


        intent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE,
                "en-IN"
        );


        intent.putExtra(
                RecognizerIntent.EXTRA_PARTIAL_RESULTS,
                true
        );


        intent.putExtra(
                RecognizerIntent.EXTRA_MAX_RESULTS,
                5
        );


        try {

            recognizer.startListening(
                    intent
            );

        } catch (Throwable error) {

            setTranscript(
                    "Unable to start voice recognition."
            );
        }
    }


    private final RecognitionListener listener =
            new RecognitionListener() {

        @Override
        public void onReadyForSpeech(
                Bundle params
        ) {

            setTranscript(
                    "I'm listening…"
            );
        }


        @Override
        public void onBeginningOfSpeech() {}


        @Override
        public void onRmsChanged(
                float rmsdB
        ) {}


        @Override
        public void onBufferReceived(
                byte[] buffer
        ) {}


        @Override
        public void onEndOfSpeech() {

            setTranscript(
                    "Understanding…"
            );
        }


        @Override
        public void onError(
                int error
        ) {

            setTranscript(
                    "I didn't catch that. Try again."
            );


            new android.os.Handler(
                    android.os.Looper
                            .getMainLooper()
            )
                    .postDelayed(
                            () ->
                                    beginListening(),
                            650
                    );
        }


        @Override
        public void onResults(
                Bundle results
        ) {

            String command =
                    bestResult(
                            results
                    );


            if (
                    command.isEmpty()
            ) {

                beginListening();
                return;
            }


            setTranscript(
                    command
            );


            execute(
                    command
            );
        }


        @Override
        public void onPartialResults(
                Bundle partialResults
        ) {

            String partial =
                    bestResult(
                            partialResults
                    );


            if (
                    !partial.isEmpty()
            ) {

                setTranscript(
                        partial
                );
            }
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


        ArrayList<String> values =
                bundle.getStringArrayList(
                        SpeechRecognizer
                                .RESULTS_RECOGNITION
                );


        if (
                values == null ||
                values.isEmpty()
        ) {
            return "";
        }


        String best =
                "";


        for (
                String value :
                values
        ) {

            if (
                    value != null &&
                    value.trim().length() >
                    best.length()
            ) {

                best =
                        value.trim();
            }
        }


        return best;
    }


    private void execute(
            String command
    ) {

        String normalized =
                normalize(
                        command
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


                finish();
                return;
            }


            if (
                    normalized.equals(
                            "open google"
                    )
            ) {

                openUrl(
                        "https://www.google.com/"
                );


                finish();
                return;
            }


            if (
                    normalized.equals(
                            "open gmail"
                    )
            ) {

                openUrl(
                        "https://mail.google.com/"
                );


                finish();
                return;
            }


            if (
                    normalized.equals(
                            "open github"
                    )
            ) {

                openUrl(
                        "https://github.com/"
                );


                finish();
                return;
            }


            if (
                    normalized.equals(
                            "open camera"
                    )
            ) {

                Intent camera =
                        new Intent(
                                MediaStore
                                        .ACTION_IMAGE_CAPTURE
                        );


                camera.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                );


                getContext()
                        .startActivity(
                                camera
                        );


                finish();
                return;
            }


            if (
                    normalized.equals(
                            "open settings"
                    )
            ) {

                Intent settings =
                        new Intent(
                                Settings.ACTION_SETTINGS
                        );


                settings.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                );


                getContext()
                        .startActivity(
                                settings
                        );


                finish();
                return;
            }


            /*
             * Everything more intelligent goes back
             * into the actual AP Synapse Aprisha engine.
             *
             * Examples:
             *
             * open code studio
             * create a project
             * research quantum computing
             * continue my task
             * move this to my laptop
             */
            sendToSynapse(
                    command
            );


            finish();

        } catch (Throwable error) {

            setTranscript(
                    "I couldn't complete that action."
            );
        }
    }


    private void sendToSynapse(
            String command
    ) {

        String url =
                AP_URL
                +
                "?aprishaCommand="
                +
                Uri.encode(
                        command
                );


        openUrl(
                url
        );
    }


    private void openUrl(
            String url
    ) {

        Intent intent =
                new Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse(
                                url
                        )
                );


        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
        );


        getContext()
                .startActivity(
                        intent
                );
    }


    private void setTranscript(
            String value
    ) {

        if (
                transcript != null
        ) {

            transcript.setText(
                    value
            );
        }
    }


    private String normalize(
            String value
    ) {

        if (value == null) {
            return "";
        }


        return value
                .toLowerCase(
                        Locale.ROOT
                )
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


    private void destroyRecognizer() {

        if (
                recognizer == null
        ) {
            return;
        }


        try {

            recognizer.cancel();

        } catch (Throwable ignored) {}


        try {

            recognizer.destroy();

        } catch (Throwable ignored) {}


        recognizer =
                null;
    }


    private int dp(
            int value
    ) {

        return Math.round(
                value *
                getContext()
                        .getResources()
                        .getDisplayMetrics()
                        .density
        );
    }
}
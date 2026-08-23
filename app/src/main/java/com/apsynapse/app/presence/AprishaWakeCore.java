package com.apsynapse.app.presence;

// AP_SHERPA_KOTLIN_API_COMPAT


import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.util.Log;

import com.k2fsa.sherpa.onnx.FeatureConfig;
import com.k2fsa.sherpa.onnx.KeywordSpotter;
import com.k2fsa.sherpa.onnx.KeywordSpotterConfig;
import com.k2fsa.sherpa.onnx.KeywordSpotterResult;
import com.k2fsa.sherpa.onnx.OnlineModelConfig;
import com.k2fsa.sherpa.onnx.OnlineStream;
import com.k2fsa.sherpa.onnx.OnlineTransducerModelConfig;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

public final class AprishaWakeCore {

    private static final String TAG =
            "AP-APRISHA";

    private static final int SAMPLE_RATE =
            16000;

    private final Context context;

    private final Runnable detectedCallback;

    private volatile boolean running =
            false;

    private Thread worker;

    private AudioRecord recorder;

    private KeywordSpotter kws;

    private OnlineStream stream;


    public AprishaWakeCore(
            Context context,
            Runnable detectedCallback
    ) {

        this.context =
                context.getApplicationContext();

        this.detectedCallback =
                detectedCallback;
    }


    public synchronized void start() {

        if (running) {
            return;
        }


        if (
                context.checkSelfPermission(
                        Manifest.permission.RECORD_AUDIO
                )
                !=
                PackageManager.PERMISSION_GRANTED
        ) {

            Log.w(
                    TAG,
                    "Microphone permission missing."
            );

            return;
        }


        try {

            File model =
                    materializeModel();


            FeatureConfig feature = new FeatureConfig();
            feature.setSampleRate(SAMPLE_RATE);
            feature.setFeatureDim(80);
            feature.setDither(0.0f);


            OnlineTransducerModelConfig transducer = new OnlineTransducerModelConfig();
            transducer.setEncoder(new File(
                                            model,
                                            "encoder.onnx"
                                    ).getAbsolutePath());
            transducer.setDecoder(new File(
                                            model,
                                            "decoder.onnx"
                                    ).getAbsolutePath());
            transducer.setJoiner(new File(
                                            model,
                                            "joiner.onnx"
                                    ).getAbsolutePath());


            OnlineModelConfig onlineModel = new OnlineModelConfig();
            onlineModel.setTransducer(transducer);
            onlineModel.setTokens(new File(
                                            model,
                                            "tokens.txt"
                                    ).getAbsolutePath());
            onlineModel.setNumThreads(1);
            onlineModel.setDebug(false);
            onlineModel.setProvider("cpu");
            onlineModel.setModelType("zipformer2");


            KeywordSpotterConfig config = new KeywordSpotterConfig();
            config.setFeatConfig(feature);
            config.setModelConfig(onlineModel);
            config.setKeywordsFile(new File(
                                            model,
                                            "keywords.txt"
                                    ).getAbsolutePath());
            config.setKeywordsScore(1.8f);
            config.setKeywordsThreshold(0.25f);
            config.setNumTrailingBlanks(2);


            kws =
                    new KeywordSpotter(null, config);

            stream =
                    kws.createStream("");


            int minimum =
                    AudioRecord.getMinBufferSize(
                            SAMPLE_RATE,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT
                    );


            int bufferBytes =
                    Math.max(
                            minimum * 2,
                            SAMPLE_RATE / 2
                    );


            recorder =
                    new AudioRecord(
                            MediaRecorder.AudioSource.VOICE_RECOGNITION,
                            SAMPLE_RATE,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT,
                            bufferBytes
                    );


            if (
                    recorder.getState()
                    !=
                    AudioRecord.STATE_INITIALIZED
            ) {

                throw new IllegalStateException(
                        "AudioRecord initialization failed."
                );
            }


            recorder.startRecording();

            running =
                    true;


            worker =
                    new Thread(
                            this::listenLoop,
                            "AprishaWakeCore"
                    );

            worker.start();


            Log.i(
                    TAG,
                    "✓ HEY APRISHA LOCAL LISTENER ACTIVE"
            );

        }
        catch (Throwable error) {

            Log.e(
                    TAG,
                    "Could not start Aprisha Wake Core.",
                    error
            );

            release();
        }
    }


    private void listenLoop() {

        short[] pcm =
                new short[1600];


        try {

            while (running) {

                int count =
                        recorder.read(
                                pcm,
                                0,
                                pcm.length
                        );


                if (
                        count <= 0
                ) {

                    continue;
                }


                float[] samples =
                        new float[count];


                for (
                        int i = 0;
                        i < count;
                        i++
                ) {

                    samples[i] =
                            pcm[i] /
                            32768.0f;
                }


                stream.acceptWaveform(
                        samples,
                        SAMPLE_RATE
                );


                while (
                        running &&
                        kws.isReady(
                                stream
                        )
                ) {

                    kws.decode(
                            stream
                    );


                    KeywordSpotterResult result =
                            kws.getResult(
                                    stream
                            );


                    String keyword =
                            result == null
                                    ?
                                    ""
                                    :
                                    result.getKeyword();


                    if (
                            keyword != null &&
                            !keyword.trim().isEmpty()
                    ) {

                        Log.i(
                                TAG,
                                "★ HEY APRISHA DETECTED: "
                                + keyword
                        );


                        /*
                         * Reset immediately as required by
                         * sherpa keyword spotting.
                         */
                        kws.reset(
                                stream
                        );


                        running =
                                false;


                        if (
                                detectedCallback != null
                        ) {

                            detectedCallback.run();
                        }


                        break;
                    }
                }
            }

        }
        catch (Throwable error) {

            if (running) {

                Log.e(
                        TAG,
                        "Wake listening loop error.",
                        error
                );
            }

        }
        finally {

            releaseFromWorker();
        }
    }


    public boolean isRunning() {
        return running;
    }

    public synchronized void stop() {

        running =
                false;


        if (
                recorder != null
        ) {

            try {
                recorder.stop();
            }
            catch (Throwable ignored) {}
        }


        Thread t =
                worker;


        if (
                t != null &&
                t != Thread.currentThread()
        ) {

            try {

                t.join(
                        1200
                );

            }
            catch (
                    InterruptedException ignored
            ) {

                Thread.currentThread()
                        .interrupt();
            }
        }


        release();
    }


    private synchronized void releaseFromWorker() {

        running =
                false;

        release();
    }


    private synchronized void release() {

        if (
                recorder != null
        ) {

            try {
                recorder.release();
            }
            catch (Throwable ignored) {}

            recorder =
                    null;
        }


        if (
                stream != null
        ) {

            try {
                stream.release();
            }
            catch (Throwable ignored) {}

            stream =
                    null;
        }


        if (
                kws != null
        ) {

            try {
                kws.release();
            }
            catch (Throwable ignored) {}

            kws =
                    null;
        }


        worker =
                null;
    }


    private File materializeModel()
            throws Exception {

        File destination =
                new File(
                        context.getFilesDir(),
                        "aprisha_kws"
                );


        if (
                !destination.exists() &&
                !destination.mkdirs()
        ) {

            throw new IllegalStateException(
                    "Could not create Aprisha model folder."
            );
        }


        String[] files = {
                "encoder.onnx",
                "decoder.onnx",
                "joiner.onnx",
                "tokens.txt",
                "keywords.txt"
        };


        for (
                String name :
                files
        ) {

            File output =
                    new File(
                            destination,
                            name
                    );


            /*
             * Copy again only when missing.
             */
            if (
                    output.exists() &&
                    output.length() > 0
            ) {

                continue;
            }


            try (
                    InputStream input =
                            context
                                    .getAssets()
                                    .open(
                                            "aprisha_kws/"
                                            + name
                                    );

                    FileOutputStream out =
                            new FileOutputStream(
                                    output
                            )
            ) {

                byte[] buffer =
                        new byte[
                                64 * 1024
                        ];


                int read;


                while (
                        (read =
                                input.read(
                                        buffer
                                ))
                        !=
                        -1
                ) {

                    out.write(
                            buffer,
                            0,
                            read
                    );
                }
            }
        }


        return destination;
    }
}

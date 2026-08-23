package com.apsynapse.app.presence;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.ServiceInfo;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.RecognitionService;
import android.speech.SpeechRecognizer;

import java.util.List;

/**
 * Declares the recognition component required for Android assistant-role
 * eligibility. Aprisha's command session deliberately delegates speech-to-text
 * to an installed external recognizer such as Google or Samsung Speech.
 */
public final class AprishaRecognitionService extends RecognitionService {

    public static ComponentName findExternalRecognizer(Context context) {
        if (context == null) {
            return null;
        }

        try {
            String configured = Settings.Secure.getString(
                    context.getContentResolver(),
                    "voice_recognition_service"
            );

            ComponentName component = ComponentName.unflattenFromString(configured);

            if (isExternal(context, component)) {
                return component;
            }
        } catch (Throwable ignored) {
        }

        try {
            Intent query = new Intent("android.speech.RecognitionService");
            PackageManager manager = context.getPackageManager();
            List<ResolveInfo> services = manager.queryIntentServices(query, 0);

            if (services == null) {
                return null;
            }

            for (ResolveInfo info : services) {
                ServiceInfo service = info == null ? null : info.serviceInfo;

                if (service == null) {
                    continue;
                }

                ComponentName component = new ComponentName(
                        service.packageName,
                        service.name
                );

                if (isExternal(context, component)) {
                    return component;
                }
            }
        } catch (Throwable ignored) {
        }

        return null;
    }

    private static boolean isExternal(Context context, ComponentName component) {
        return component != null &&
                !context.getPackageName().equals(component.getPackageName());
    }

    @Override
    protected void onStartListening(Intent recognizerIntent, Callback listener) {
        try {
            listener.readyForSpeech(new Bundle());
            listener.error(SpeechRecognizer.ERROR_CLIENT);
        } catch (Throwable ignored) {
        }
    }

    @Override
    protected void onStopListening(Callback listener) {
        try {
            listener.endOfSpeech();
        } catch (Throwable ignored) {
        }
    }

    @Override
    protected void onCancel(Callback listener) {
        // Nothing to cancel. Command recognition uses an external recognizer.
    }
}

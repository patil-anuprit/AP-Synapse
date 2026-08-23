package com.apsynapse.app.presence;

import android.content.Context;
import android.content.SharedPreferences;

import java.io.InputStream;

/** Lightweight local diagnostics shown by the Aprisha setup screen. */
public final class AprishaHealthStore {

    private static final String PREFS = "aprisha_health_v3";
    private static final String KEY_STATE = "wake_state";
    private static final String KEY_DETAIL = "wake_detail";
    private static final String KEY_TIME = "wake_time";

    private static final String[] MODEL_ASSETS = {
            "encoder.onnx",
            "decoder.onnx",
            "joiner.onnx",
            "tokens.txt",
            "keywords.txt"
    };

    private AprishaHealthStore() {}

    public static void recordWakeState(
            Context context,
            String state,
            String detail
    ) {
        if (context == null) {
            return;
        }

        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_STATE, state == null ? "unknown" : state)
                .putString(KEY_DETAIL, detail == null ? "" : detail)
                .putLong(KEY_TIME, System.currentTimeMillis())
                .apply();
    }

    public static String wakeState(Context context) {
        return prefs(context).getString(KEY_STATE, "not started");
    }

    public static String wakeDetail(Context context) {
        return prefs(context).getString(KEY_DETAIL, "");
    }

    public static long wakeStateTime(Context context) {
        return prefs(context).getLong(KEY_TIME, 0L);
    }

    public static boolean packagedModelAvailable(Context context) {
        if (context == null) {
            return false;
        }

        for (String name : MODEL_ASSETS) {
            try (InputStream input = context.getAssets().open("aprisha_kws/" + name)) {
                if (input.read() < 0) {
                    return false;
                }
            } catch (Throwable error) {
                return false;
            }
        }

        return true;
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}

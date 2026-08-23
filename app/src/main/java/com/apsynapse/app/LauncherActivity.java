package com.apsynapse.app;

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(
                    ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            );
        } else {
            setRequestedOrientation(
                    ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            );
        }
    }

    @Override
    protected Uri getLaunchingUrl() {
        return super.getLaunchingUrl();
    }
}
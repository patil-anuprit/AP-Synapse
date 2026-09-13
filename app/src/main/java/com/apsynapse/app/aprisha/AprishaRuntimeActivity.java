package com.apsynapse.app.aprisha;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public final class AprishaRuntimeActivity extends Activity {

    private static final int REQUEST_CODE = 8041;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri data = getIntent() != null
                ? getIntent().getData()
                : null;

        String path =
                data != null && data.getPath() != null
                        ? data.getPath().toLowerCase()
                        : "/start";

        if (path.contains("stop")) {
            stopService(
                    new Intent(
                            this,
                            AprishaRuntimeService.class
                    )
            );

            Toast.makeText(
                    this,
                    "Aprisha Presence stopped",
                    Toast.LENGTH_SHORT
            ).show();

            finish();
            return;
        }

        requestPermissionsIfNeeded();
    }

    private void requestPermissionsIfNeeded() {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            startRuntime();
            return;
        }

        List<String> missing = new ArrayList<>();

        if (
                checkSelfPermission(
                        Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            missing.add(
                    Manifest.permission.RECORD_AUDIO
            );
        }

        if (
                Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(
                        Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            missing.add(
                    Manifest.permission.POST_NOTIFICATIONS
            );
        }

        if (missing.isEmpty()) {
            startRuntime();
            return;
        }

        requestPermissions(
                missing.toArray(new String[0]),
                REQUEST_CODE
        );
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(
                requestCode,
                permissions,
                grantResults
        );

        if (requestCode != REQUEST_CODE) {
            return;
        }

        if (
                checkSelfPermission(
                        Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            Toast.makeText(
                    this,
                    "Microphone permission is required for Aprisha.",
                    Toast.LENGTH_LONG
            ).show();

            finish();
            return;
        }

        startRuntime();
    }

    private void startRuntime() {

        Intent intent =
                new Intent(
                        this,
                        AprishaRuntimeService.class
                );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }

        Toast.makeText(
                this,
                "Aprisha Presence active",
                Toast.LENGTH_SHORT
        ).show();

        finish();
    }
}
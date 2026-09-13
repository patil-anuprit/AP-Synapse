package com.apsynapse.app.aprisha;

import android.Manifest;
import android.app.Activity;
import android.app.role.RoleManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.service.voice.VoiceInteractionService;
import android.widget.Toast;

public final class AprishaAssistantSetupActivity extends Activity {

    private static final int ROLE_REQUEST = 9101;
    private static final int MIC_REQUEST = 9102;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        /*
         * This implementation intentionally begins with
         * Android 12+, where the legacy recognitionService
         * selection behavior is no longer used.
         */
        if (
                Build.VERSION.SDK_INT <
                Build.VERSION_CODES.S
        ) {

            Toast.makeText(
                    this,
                    "Aprisha Assistant Runtime currently requires Android 12 or newer.",
                    Toast.LENGTH_LONG
            ).show();

            finish();
            return;
        }


        ensureMicrophonePermission();
    }


    private void ensureMicrophonePermission() {

        if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.M
                &&
                checkSelfPermission(
                        Manifest.permission.RECORD_AUDIO
                )
                !=
                PackageManager.PERMISSION_GRANTED
        ) {

            requestPermissions(
                    new String[] {
                            Manifest.permission.RECORD_AUDIO
                    },
                    MIC_REQUEST
            );

            return;
        }


        requestAssistantRole();
    }


    private void requestAssistantRole() {

        RoleManager roleManager =
                (RoleManager)
                getSystemService(
                        ROLE_SERVICE
                );


        if (
                roleManager == null
                ||
                !roleManager.isRoleAvailable(
                        RoleManager.ROLE_ASSISTANT
                )
        ) {

            Toast.makeText(
                    this,
                    "The Assistant role is unavailable on this device.",
                    Toast.LENGTH_LONG
            ).show();

            finish();
            return;
        }


        if (
                roleManager.isRoleHeld(
                        RoleManager.ROLE_ASSISTANT
                )
        ) {

            Toast.makeText(
                    this,
                    "Aprisha is already your Android assistant.",
                    Toast.LENGTH_SHORT
            ).show();

            finish();
            return;
        }


        Intent request =
                roleManager.createRequestRoleIntent(
                        RoleManager.ROLE_ASSISTANT
                );


        startActivityForResult(
                request,
                ROLE_REQUEST
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


        if (
                requestCode ==
                MIC_REQUEST
        ) {

            boolean allowed =
                    grantResults.length > 0
                    &&
                    grantResults[0] ==
                    PackageManager.PERMISSION_GRANTED;


            if (!allowed) {

                Toast.makeText(
                        this,
                        "Microphone permission is needed for Aprisha voice interaction.",
                        Toast.LENGTH_LONG
                ).show();

                finish();
                return;
            }


            requestAssistantRole();
        }
    }


    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data
    ) {

        super.onActivityResult(
                requestCode,
                resultCode,
                data
        );


        if (
                requestCode !=
                ROLE_REQUEST
        ) {
            return;
        }


        if (
                resultCode ==
                RESULT_OK
        ) {

            ComponentName component =
                    new ComponentName(
                            this,
                            AprishaVoiceInteractionService.class
                    );


            boolean active =
                    VoiceInteractionService
                            .isActiveService(
                                    this,
                                    component
                            );


            Toast.makeText(
                    this,
                    active
                            ? "Aprisha is now your Android assistant."
                            : "Assistant role granted. Android is activating Aprisha.",
                    Toast.LENGTH_LONG
            ).show();

        } else {

            Toast.makeText(
                    this,
                    "Aprisha Assistant activation was cancelled.",
                    Toast.LENGTH_SHORT
            ).show();
        }


        finish();
    }
}
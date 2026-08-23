package com.apsynapse.app.presence;

import android.Manifest;
import android.app.Activity;
import android.app.role.RoleManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class PresenceSetupActivity extends Activity {

    private static final int REQ_MIC = 7101;
    private static final int REQ_ASSISTANT = 7102;

    private TextView status;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        apStartWakeModeAfterPermissionDelay();

        requestAprishaDevicePermissions();

        getWindow().setStatusBarColor(Color.rgb(11, 12, 14));
        getWindow().setNavigationBarColor(Color.rgb(11, 12, 14));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(28), dp(36), dp(28), dp(36));
        root.setBackgroundColor(Color.rgb(11, 12, 14));

        TextView mark = new TextView(this);
        mark.setText("AP");
        mark.setTextColor(Color.rgb(222, 183, 98));
        mark.setTextSize(30);
        mark.setGravity(Gravity.CENTER);

        TextView title = new TextView(this);
        title.setText("AP Presence");
        title.setTextColor(Color.rgb(247, 244, 237));
        title.setTextSize(28);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(18), 0, 0);

        TextView subtitle = new TextView(this);
        subtitle.setText(
            "The Android intelligence layer for AP Synapse.\n" +
            "Voice · Context · Continuity"
        );
        subtitle.setTextColor(Color.rgb(150, 150, 145));
        subtitle.setTextSize(14);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, dp(10), 0, dp(26));

        status = new TextView(this);
        status.setText("Ready to enable AP Presence");
        status.setTextColor(Color.rgb(190, 190, 184));
        status.setTextSize(13);
        status.setGravity(Gravity.CENTER);
        status.setPadding(0, 0, 0, dp(22));

        Button enable = button("Enable AP Presence");
        enable.setOnClickListener(v -> enablePresence());

        Button test = button("Test AP Presence");
        test.setOnClickListener(v -> {
            try {
                startActivity(new Intent(Intent.ACTION_ASSIST));
            } catch (Exception e) {
                Toast.makeText(
                    this,
                    "Enable AP Synapse as your assistant first.",
                    Toast.LENGTH_LONG
                ).show();
            }
        });

        root.addView(mark);
        root.addView(title);
        root.addView(subtitle);
        root.addView(status);

        root.addView(
            enable,
            new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(52)
            )
        );

        LinearLayout.LayoutParams testParams =
            new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(48)
            );

        testParams.topMargin = dp(12);
        root.addView(test, testParams);

        setContentView(root);

        refreshStatus();
    }

    private Button button(String text) {

        Button b = new Button(this);

        b.setText(text);
        b.setTextColor(Color.rgb(246, 242, 233));
        b.setTextSize(14);
        b.setAllCaps(false);

        b.setBackgroundTintList(
            ColorStateList.valueOf(
                Color.rgb(39, 38, 34)
            )
        );

        return b;
    }

    private void enablePresence() {

        if (
            Build.VERSION.SDK_INT >= 23 &&
            checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED
        ) {

            requestPermissions(
                new String[]{
                    Manifest.permission.RECORD_AUDIO
                },
                REQ_MIC
            );

            return;
        }

        requestAssistantRole();
    }

    private void requestAssistantRole() {

        if (Build.VERSION.SDK_INT >= 29) {

            RoleManager manager =
                getSystemService(RoleManager.class);

            if (
                manager != null &&
                manager.isRoleAvailable(
                    RoleManager.ROLE_ASSISTANT
                )
            ) {

                if (
                    manager.isRoleHeld(
                        RoleManager.ROLE_ASSISTANT
                    )
                ) {

                    status.setText(
                        "AP Presence is enabled"
                    );

                    return;
                }

                startActivityForResult(
                    manager.createRequestRoleIntent(
                        RoleManager.ROLE_ASSISTANT
                    ),
                    REQ_ASSISTANT
                );

                return;
            }
        }

        try {

            startActivity(
                new Intent(
                    Settings.ACTION_VOICE_INPUT_SETTINGS
                )
            );

        } catch (Exception e) {

            Toast.makeText(
                this,
                "Open Android Settings and choose AP Synapse as your assistant.",
                Toast.LENGTH_LONG
            ).show();
        }
    }

    private void refreshStatus() {

        if (Build.VERSION.SDK_INT >= 29) {

            RoleManager manager =
                getSystemService(RoleManager.class);

            if (
                manager != null &&
                manager.isRoleHeld(
                    RoleManager.ROLE_ASSISTANT
                )
            ) {

                status.setText(
                    "● AP Presence active"
                );

                status.setTextColor(
                    Color.rgb(222, 183, 98)
                );

                return;
            }
        }

        status.setText(
            "AP Presence is not yet the Android assistant"
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
            requestCode == REQ_MIC &&
            grantResults.length > 0 &&
            grantResults[0]
                == PackageManager.PERMISSION_GRANTED
        ) {

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

        refreshStatus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshStatus();
    }

    private int dp(int value) {

        return Math.round(
            value *
            getResources()
                .getDisplayMetrics()
                .density
        );
    }

    // AP_PRESENCE_DEVICE_PERMISSION_MASTER
    private void requestAprishaDevicePermissions() {

        /*
         * Runtime permissions only exist from Android 6.0.
         */

        if (
            android.os.Build.VERSION.SDK_INT <
            android.os.Build.VERSION_CODES.M
        ) {
            return;
        }


        java.util.ArrayList<String> permissions =
                new java.util.ArrayList<>();


        if (
            checkSelfPermission(
                android.Manifest.permission.RECORD_AUDIO
            )
            !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {

            permissions.add(
                android.Manifest.permission.RECORD_AUDIO
            );
        }


        if (
            checkSelfPermission(
                android.Manifest.permission.READ_CONTACTS
            )
            !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {

            permissions.add(
                android.Manifest.permission.READ_CONTACTS
            );
        }


        if (
            checkSelfPermission(
                android.Manifest.permission.CALL_PHONE
            )
            !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {

            permissions.add(
                android.Manifest.permission.CALL_PHONE
            );
        }




        // AP_DEVICE_INTELLIGENCE_V2_CAMERA_PERMISSION
        if (
            checkSelfPermission(
                android.Manifest.permission.CAMERA
            )
            !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            permissions.add(
                android.Manifest.permission.CAMERA
            );
        }
        if (
            !permissions.isEmpty()
        ) {

            requestPermissions(
                permissions.toArray(
                    new String[0]
                ),
                8102
            );
        }
    }
    // AP_NATIVE_ASSISTANT_SERVICE_OWNS_WAKE
    private void apStartWakeModeAfterPermissionDelay() {
        /*
         * Retained for existing permission callbacks.
         * Android's selected VoiceInteractionService owns
         * Sherpa wake-word listening.
         */
    }

}

package com.apsynapse.app;

import android.Manifest;
import android.app.Activity;
import android.app.role.RoleManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import com.apsynapse.app.presence.PresenceSetupActivity;
import com.apsynapse.app.presence.AprishaHealthStore;

/**
 * Small launcher gate that makes Aprisha setup discoverable.
 *
 * The TWA launcher cannot reliably interrupt its own launch after the custom
 * tab has started, so the Android launcher points here first. Once microphone
 * access and the Android assistant role are ready, this activity immediately
 * forwards to the normal AP Synapse TWA.
 */
public final class AprishaBootstrapActivity extends Activity {

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        getWindow().setStatusBarColor(Color.rgb(11, 12, 14));
        getWindow().setNavigationBarColor(Color.rgb(11, 12, 14));

        if (!hasMicrophonePermission() ||
                !isAssistantActive() ||
                !AprishaHealthStore.packagedModelAvailable(this)) {
            Intent setup = new Intent(this, PresenceSetupActivity.class)
                    .putExtra(PresenceSetupActivity.EXTRA_OPEN_WEB_AFTER_SETUP, true);
            startActivity(setup);
        } else {
            openWebApp();
        }

        finish();
    }

    private boolean hasMicrophonePermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
                checkSelfPermission(Manifest.permission.RECORD_AUDIO) ==
                        PackageManager.PERMISSION_GRANTED;
    }

    private boolean isAssistantActive() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            RoleManager manager = getSystemService(RoleManager.class);
            if (manager != null && manager.isRoleAvailable(RoleManager.ROLE_ASSISTANT)) {
                return manager.isRoleHeld(RoleManager.ROLE_ASSISTANT);
            }
        }

        String service = Settings.Secure.getString(
                getContentResolver(),
                "voice_interaction_service"
        );

        return service != null && service.contains(getPackageName());
    }

    private void openWebApp() {
        Intent web = new Intent(this, LauncherActivity.class);

        if (getIntent() != null && getIntent().getData() != null) {
            web.setData(getIntent().getData());
        }

        web.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(web);
    }
}

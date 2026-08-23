package com.apsynapse.app.presence;

import android.Manifest;
import android.app.Activity;
import android.app.role.RoleManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.apsynapse.app.LauncherActivity;

import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;

/** One-time setup and repair screen for the native Android assistant. */
public final class PresenceSetupActivity extends Activity {

    public static final String EXTRA_OPEN_WEB_AFTER_SETUP =
            "com.apsynapse.app.extra.OPEN_WEB_AFTER_SETUP";

    private static final int REQ_MIC = 7101;
    private static final int REQ_ASSISTANT = 7102;
    private static final int REQ_OPTIONAL = 7103;

    private TextView status;
    private boolean enableFlow;
    private boolean openWebAfterSetup;
    private boolean deepLinkStart;
    private boolean deepLinkHandled;
    private boolean optionalPermissionRequestActive;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        getWindow().setStatusBarColor(Color.rgb(11, 12, 14));
        getWindow().setNavigationBarColor(Color.rgb(11, 12, 14));

        readLaunchRequest(getIntent());
        setContentView(buildContent());
        refreshStatus();

        if (deepLinkStart && assistantBasicsReady()) {
            status.post(this::startAprishaNow);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        readLaunchRequest(intent);

        if (deepLinkStart && assistantBasicsReady()) {
            status.post(this::startAprishaNow);
        } else {
            refreshStatus();
        }
    }

    private void readLaunchRequest(Intent intent) {
        openWebAfterSetup =
                intent != null &&
                intent.getBooleanExtra(EXTRA_OPEN_WEB_AFTER_SETUP, false);

        Uri data = intent == null ? null : intent.getData();
        deepLinkStart =
                data != null &&
                "1".equals(data.getQueryParameter("start"));
        deepLinkHandled = false;
    }

    private ScrollView buildContent() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(Color.rgb(11, 12, 14));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(dp(28), dp(34), dp(28), dp(34));

        TextView mark = text("AP", 32, Color.rgb(222, 183, 98));
        mark.setGravity(Gravity.CENTER);

        TextView title = text("Aprisha for Android", 28, Color.rgb(247, 244, 237));
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(15), 0, 0);

        TextView subtitle = text(
                "Local Hey Aprisha wake word, native device actions, and spoken answers.",
                14,
                Color.rgb(158, 158, 152)
        );
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, dp(9), 0, dp(25));

        status = text("Checking Aprisha…", 14, Color.rgb(205, 202, 193));
        status.setGravity(Gravity.START);
        status.setLineSpacing(0, 1.2f);
        status.setPadding(dp(16), dp(15), dp(16), dp(15));
        status.setBackgroundColor(Color.rgb(25, 26, 29));

        Button enable = button("Enable / Repair Aprisha");
        enable.setOnClickListener(view -> beginEnableFlow());

        Button start = button("Start Aprisha now");
        start.setOnClickListener(view -> startAprishaNow());

        Button web = button("Open AP Synapse");
        web.setOnClickListener(view -> openWebApp());

        Button settings = button("Android assistant settings");
        settings.setOnClickListener(view -> openAssistantSettings());

        root.addView(mark);
        root.addView(title);
        root.addView(subtitle);
        root.addView(status, fullWidth(ViewGroup.LayoutParams.WRAP_CONTENT, 0));
        root.addView(enable, fullWidth(dp(52), 18));
        root.addView(start, fullWidth(dp(50), 10));
        root.addView(web, fullWidth(dp(50), 10));
        root.addView(settings, fullWidth(dp(48), 10));

        TextView note = text(
                "Calls require contact and phone permission plus spoken confirmation. " +
                "Messages open Android's composer. Wi-Fi and Bluetooth changes require Android confirmation.",
                12,
                Color.rgb(132, 132, 127)
        );
        note.setPadding(0, dp(20), 0, 0);
        root.addView(note);

        scroll.addView(root, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        return scroll;
    }

    private void beginEnableFlow() {
        enableFlow = true;

        if (!hasPermission(Manifest.permission.RECORD_AUDIO)) {
            requestPermissions(
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    REQ_MIC
            );
            return;
        }

        requestAssistantRole(true);
    }

    private void requestAssistantRole(boolean continueFlow) {
        enableFlow = enableFlow || continueFlow;

        if (isAssistantActive()) {
            if (enableFlow) {
                requestOptionalPermissions();
            } else {
                refreshStatus();
            }
            return;
        }

        openAssistantSettings();
    }

    private void openAssistantSettings() {
        Intent samsungAssist = new Intent();
        samsungAssist.setComponent(
                new android.content.ComponentName(
                        "com.android.settings",
                        "com.android.settings.Settings$ManageAssistActivity"
                )
        );

        Intent[] candidates = new Intent[]{
                samsungAssist,
                new Intent(Settings.ACTION_VOICE_INPUT_SETTINGS),
                new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
        };

        for (Intent candidate : candidates) {
            try {
                if (candidate.resolveActivity(getPackageManager()) == null) {
                    continue;
                }

                startActivity(candidate);
                Toast.makeText(
                        this,
                        "Open Device assistance app and choose AP Synapse.",
                        Toast.LENGTH_LONG
                ).show();
                return;
            } catch (Throwable ignored) {
            }
        }

        status.setText("Android assistant settings could not be opened on this firmware.");
    }

    private void requestOptionalPermissions() {
        if (optionalPermissionRequestActive) {
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            finishEnableFlow();
            return;
        }

        ArrayList<String> missing = new ArrayList<>();
        addIfMissing(missing, Manifest.permission.READ_CONTACTS);
        addIfMissing(missing, Manifest.permission.CALL_PHONE);
        addIfMissing(missing, Manifest.permission.CAMERA);

        if (missing.isEmpty()) {
            finishEnableFlow();
        } else {
            optionalPermissionRequestActive = true;
            requestPermissions(missing.toArray(new String[0]), REQ_OPTIONAL);
        }
    }

    private void addIfMissing(ArrayList<String> permissions, String permission) {
        if (!hasPermission(permission)) {
            permissions.add(permission);
        }
    }

    private void finishEnableFlow() {
        enableFlow = false;
        refreshStatus();

        if (openWebAfterSetup && assistantBasicsReady()) {
            openWebApp();
        }
    }

    private void startAprishaNow() {
        if (deepLinkHandled) {
            return;
        }

        if (!assistantBasicsReady()) {
            deepLinkHandled = false;
            status.setText(
                    "Aprisha needs microphone access, the default assistant role, and its local wake model. " +
                    "Tap Enable / Repair Aprisha."
            );
            return;
        }

        deepLinkHandled = true;

        try {
            startActivity(new Intent(Intent.ACTION_ASSIST));
            finish();
        } catch (Throwable error) {
            deepLinkHandled = false;
            status.setText("Android could not start the assistant. Reopen assistant settings and select AP Synapse.");
        }
    }

    private void openWebApp() {
        Intent web = new Intent(this, LauncherActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(web);
        finish();
    }

    private void refreshStatus() {
        if (status == null) {
            return;
        }

        boolean mic = hasPermission(Manifest.permission.RECORD_AUDIO);
        boolean role = isAssistantActive();
        boolean model = AprishaHealthStore.packagedModelAvailable(this);
        boolean contacts = hasPermission(Manifest.permission.READ_CONTACTS);
        boolean phone = hasPermission(Manifest.permission.CALL_PHONE);
        boolean camera = hasPermission(Manifest.permission.CAMERA);

        String wakeState = AprishaHealthStore.wakeState(this);
        String wakeDetail = AprishaHealthStore.wakeDetail(this);
        long wakeTime = AprishaHealthStore.wakeStateTime(this);

        StringBuilder value = new StringBuilder();
        value.append(line(mic, "Microphone"));
        value.append(line(role, "Default Android assistant"));
        value.append(line(model, "Local Hey Aprisha model"));
        value.append(line(contacts, "Contacts"));
        value.append(line(phone, "Phone calls"));
        value.append(line(camera, "Camera / flashlight"));
        value.append("\nWake service: ").append(wakeState);

        if (wakeDetail != null && !wakeDetail.trim().isEmpty()) {
            value.append(" — ").append(wakeDetail.trim());
        }

        if (wakeTime > 0) {
            value.append("\nLast update: ")
                    .append(DateFormat.getDateTimeInstance(
                            DateFormat.SHORT,
                            DateFormat.SHORT
                    ).format(new Date(wakeTime)));
        }

        status.setText(value.toString());
        status.setTextColor(
                assistantBasicsReady()
                        ? Color.rgb(222, 183, 98)
                        : Color.rgb(205, 202, 193)
        );
    }

    private String line(boolean ready, String label) {
        return (ready ? "✓ " : "• ") + label + "\n";
    }

    private boolean assistantBasicsReady() {
        return hasPermission(Manifest.permission.RECORD_AUDIO) &&
                isAssistantActive() &&
                AprishaHealthStore.packagedModelAvailable(this);
    }

    private boolean hasPermission(String permission) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
                checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
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

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQ_MIC) {
            if (hasPermission(Manifest.permission.RECORD_AUDIO)) {
                requestAssistantRole(true);
            } else {
                enableFlow = false;
                refreshStatus();
            }
        } else if (requestCode == REQ_OPTIONAL) {
            optionalPermissionRequestActive = false;
            finishEnableFlow();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQ_ASSISTANT && enableFlow && isAssistantActive()) {
            requestOptionalPermissions();
        } else {
            refreshStatus();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshStatus();

        if (enableFlow && assistantBasicsReady()) {
            requestOptionalPermissions();
            return;
        }

        if (deepLinkStart && !deepLinkHandled && assistantBasicsReady()) {
            status.post(this::startAprishaNow);
        }
    }

    private TextView text(String value, int size, int color) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        return view;
    }

    private Button button(String value) {
        Button button = new Button(this);
        button.setText(value);
        button.setTextColor(Color.rgb(246, 242, 233));
        button.setTextSize(14);
        button.setAllCaps(false);
        button.setBackgroundTintList(ColorStateList.valueOf(Color.rgb(39, 38, 34)));
        return button;
    }

    private LinearLayout.LayoutParams fullWidth(int height, int topMargin) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                height
        );
        params.topMargin = dp(topMargin);
        return params;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}

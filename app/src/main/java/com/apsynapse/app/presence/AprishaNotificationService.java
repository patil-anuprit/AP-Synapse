package com.apsynapse.app.presence;

// AP_APRISHA_NOTIFICATION_SERVICE_V6

import android.app.Notification;
import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public final class AprishaNotificationService
        extends NotificationListenerService {

    private static volatile AprishaNotificationService instance;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        instance = this;
    }

    @Override
    public void onListenerDisconnected() {
        if (instance == this) {
            instance = null;
        }
        super.onListenerDisconnected();
    }

    @Override
    public void onDestroy() {
        if (instance == this) {
            instance = null;
        }
        super.onDestroy();
    }

    public static boolean isConnected() {
        return instance != null;
    }

    public static void openAccessSettings(
            Context context
    ) {
        if (context == null) {
            return;
        }

        try {
            Intent intent =
                    new Intent(
                            Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS
                    );

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );

            context.startActivity(intent);
        }
        catch (Throwable ignored) {
        }
    }

    public static String readRecent(
            Context context,
            int requestedCount
    ) {

        AprishaNotificationService service =
                instance;

        if (service == null) {
            return "Notification access is not active. Say enable notification access.";
        }

        int count =
                Math.max(
                        1,
                        Math.min(
                                requestedCount,
                                8
                        )
                );

        List<StatusBarNotification> notifications =
                activeNotifications(service);

        if (notifications.isEmpty()) {
            return "You have no readable active notifications right now.";
        }

        StringBuilder answer =
                new StringBuilder();

        int added =
                0;

        for (StatusBarNotification sbn : notifications) {

            if (sbn == null) {
                continue;
            }

            if (
                    context != null &&
                    context.getPackageName()
                            .equals(
                                    sbn.getPackageName()
                            )
            ) {
                continue;
            }

            String description =
                    describe(
                            context,
                            sbn
                    );

            if (description.isEmpty()) {
                continue;
            }

            if (added == 0) {
                answer.append("Here are your latest notifications. ");
            }
            else {
                answer.append(" ");
            }

            answer.append(added + 1)
                    .append(". ")
                    .append(description);

            added++;

            if (added >= count) {
                break;
            }
        }

        if (added == 0) {
            return "You have no readable active notifications right now.";
        }

        return answer.toString();
    }

    public static String reply(
            Context context,
            String targetHint,
            String replyText
    ) {

        AprishaNotificationService service =
                instance;

        if (service == null) {
            return "Notification access is not active. Say enable notification access.";
        }

        if (
                replyText == null ||
                replyText.trim().isEmpty()
        ) {
            return "What should I reply?";
        }

        String hint =
                targetHint == null
                        ? ""
                        : targetHint
                                .trim()
                                .toLowerCase(
                                        Locale.ROOT
                                );

        List<StatusBarNotification> notifications =
                activeNotifications(service);

        for (StatusBarNotification sbn : notifications) {

            if (sbn == null) {
                continue;
            }

            Notification notification =
                    sbn.getNotification();

            if (notification == null) {
                continue;
            }

            if (
                    !hint.isEmpty() &&
                    !matchesHint(
                            context,
                            sbn,
                            hint
                    )
            ) {
                continue;
            }

            Notification.Action[] actions =
                    notification.actions;

            if (actions == null) {
                continue;
            }

            for (Notification.Action action : actions) {

                if (
                        action == null ||
                        action.actionIntent == null
                ) {
                    continue;
                }

                RemoteInput[] remoteInputs =
                        action.getRemoteInputs();

                if (
                        remoteInputs == null ||
                        remoteInputs.length == 0
                ) {
                    continue;
                }

                try {

                    Bundle results =
                            new Bundle();

                    for (RemoteInput input : remoteInputs) {

                        if (input == null) {
                            continue;
                        }

                        results.putCharSequence(
                                input.getResultKey(),
                                replyText.trim()
                        );
                    }

                    Intent fillInIntent =
                            new Intent();

                    RemoteInput.addResultsToIntent(
                            remoteInputs,
                            fillInIntent,
                            results
                    );

                    action.actionIntent.send(
                            context,
                            0,
                            fillInIntent
                    );

                    String destination =
                            titleOf(
                                    notification
                            );

                    if (destination.isEmpty()) {
                        destination =
                                appLabel(
                                        context,
                                        sbn.getPackageName()
                                );
                    }

                    if (destination.isEmpty()) {
                        destination = "that conversation";
                    }

                    return "Reply sent to " + destination + ".";
                }
                catch (Throwable ignored) {
                    // Try another reply-capable action/notification.
                }
            }
        }

        if (!hint.isEmpty()) {
            return "I couldn't find a reply-capable notification matching " +
                    targetHint.trim() + ".";
        }

        return "I couldn't find a recent notification that supports direct reply.";
    }

    private static List<StatusBarNotification> activeNotifications(
            AprishaNotificationService service
    ) {

        try {

            StatusBarNotification[] active =
                    service.getActiveNotifications();

            if (
                    active == null ||
                    active.length == 0
            ) {
                return Collections.emptyList();
            }

            List<StatusBarNotification> list =
                    new ArrayList<>();

            Collections.addAll(
                    list,
                    active
            );

            list.sort(
                    new Comparator<StatusBarNotification>() {
                        @Override
                        public int compare(
                                StatusBarNotification left,
                                StatusBarNotification right
                        ) {
                            return Long.compare(
                                    right == null
                                            ? 0L
                                            : right.getPostTime(),
                                    left == null
                                            ? 0L
                                            : left.getPostTime()
                            );
                        }
                    }
            );

            return list;
        }
        catch (Throwable ignored) {

            return Collections.emptyList();
        }
    }

    private static String describe(
            Context context,
            StatusBarNotification sbn
    ) {

        Notification notification =
                sbn.getNotification();

        if (notification == null) {
            return "";
        }

        String app =
                appLabel(
                        context,
                        sbn.getPackageName()
                );

        String title =
                titleOf(
                        notification
                );

        String text =
                textOf(
                        notification
                );

        StringBuilder result =
                new StringBuilder();

        if (!app.isEmpty()) {
            result.append(app);
        }

        if (!title.isEmpty()) {

            if (result.length() > 0) {
                result.append(" from ");
            }

            result.append(title);
        }

        if (!text.isEmpty()) {

            if (result.length() > 0) {
                result.append(": ");
            }

            result.append(text);
        }

        return cleanForSpeech(
                result.toString()
        );
    }

    private static boolean matchesHint(
            Context context,
            StatusBarNotification sbn,
            String hint
    ) {

        Notification notification =
                sbn.getNotification();

        String searchable =
                (
                        safe(
                                appLabel(
                                        context,
                                        sbn.getPackageName()
                                )
                        )
                        + " "
                        + safe(
                                sbn.getPackageName()
                        )
                        + " "
                        + safe(
                                titleOf(
                                        notification
                                )
                        )
                        + " "
                        + safe(
                                textOf(
                                        notification
                                )
                        )
                )
                .toLowerCase(
                        Locale.ROOT
                );

        return searchable.contains(
                hint
        );
    }

    private static String titleOf(
            Notification notification
    ) {

        if (notification == null) {
            return "";
        }

        Bundle extras =
                notification.extras;

        if (extras == null) {
            return "";
        }

        CharSequence title =
                extras.getCharSequence(
                        Notification.EXTRA_TITLE
                );

        return title == null
                ? ""
                : title.toString().trim();
    }

    private static String textOf(
            Notification notification
    ) {

        if (notification == null) {
            return "";
        }

        Bundle extras =
                notification.extras;

        if (extras == null) {
            return "";
        }

        CharSequence text =
                extras.getCharSequence(
                        Notification.EXTRA_TEXT
                );

        if (
                text == null ||
                text.toString().trim().isEmpty()
        ) {

            CharSequence bigText =
                    extras.getCharSequence(
                            Notification.EXTRA_BIG_TEXT
                    );

            text =
                    bigText;
        }

        return text == null
                ? ""
                : text.toString().trim();
    }

    private static String appLabel(
            Context context,
            String packageName
    ) {

        if (
                context == null ||
                packageName == null ||
                packageName.trim().isEmpty()
        ) {
            return "";
        }

        try {

            PackageManager manager =
                    context.getPackageManager();

            ApplicationInfo info =
                    manager.getApplicationInfo(
                            packageName,
                            0
                    );

            CharSequence label =
                    manager.getApplicationLabel(
                            info
                    );

            return label == null
                    ? packageName
                    : label.toString().trim();
        }
        catch (Throwable ignored) {

            return packageName;
        }
    }

    private static String cleanForSpeech(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .replaceAll(
                        "\\s+",
                        " "
                )
                .trim();
    }

    private static String safe(
            String value
    ) {
        return value == null
                ? ""
                : value;
    }
}
package com.apsynapse.app.presence;

// AP_APRISHA_ASSIST_CONTEXT_CORE_V11

import android.app.assist.AssistContent;
import android.app.assist.AssistStructure;
import android.content.ComponentName;
import android.net.Uri;
import android.os.Build;
import android.service.voice.VoiceInteractionSession;
import android.text.InputType;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public final class AprishaAssistContextCore {

    /*
     * Context is intentionally:
     * - memory only
     * - short lived
     * - captured only through Android Assist
     * - never captured through Accessibility
     */

    private static final long MAX_AGE_MS =
            3L * 60L * 1000L;

    private static final int MAX_TEXT_CHARS =
            4500;

    private static final int MAX_NODES =
            220;

    private static volatile Snapshot latest;

    private AprishaAssistContextCore() {}


    // =====================================================
    // MODERN ANDROID ASSIST CAPTURE
    // =====================================================

    public static void capture(
            VoiceInteractionSession.AssistState state
    ) {

        if (state == null) {
            return;
        }

        /*
         * Android can return multiple activity states in
         * split-screen / multi-window. Prefer only the
         * activity that actually has focus.
         */
        if (!state.isFocused()) {
            return;
        }

        captureInternal(
                state.getAssistStructure(),
                state.getAssistContent()
        );
    }


    // =====================================================
    // ANDROID 6 - 9 LEGACY ASSIST CALLBACK
    // =====================================================

    public static void captureLegacy(
            AssistStructure structure,
            AssistContent content
    ) {

        captureInternal(
                structure,
                content
        );
    }


    // =====================================================
    // CAPTURE
    // =====================================================

    private static void captureInternal(
            AssistStructure structure,
            AssistContent content
    ) {

        String packageName = "";
        String activityName = "";
        String webUri = "";

        try {

            if (structure != null) {

                ComponentName component =
                        structure.getActivityComponent();

                if (component != null) {

                    packageName =
                            safe(
                                    component.getPackageName()
                            );

                    activityName =
                            safe(
                                    component.getClassName()
                            );
                }
            }

        }
        catch (Throwable ignored) {}


        try {

            if (content != null) {

                Uri uri =
                        content.getWebUri();

                if (uri != null) {
                    webUri = uri.toString();
                }
            }

        }
        catch (Throwable ignored) {}


        StringBuilder visibleText =
                new StringBuilder();

        LinkedHashSet<String> unique =
                new LinkedHashSet<>();

        int[] nodeBudget =
                new int[]{
                        MAX_NODES
                };


        if (structure != null) {

            try {

                int windows =
                        structure.getWindowNodeCount();

                for (
                        int i = 0;
                        i < windows;
                        i++
                ) {

                    if (
                            visibleText.length() >=
                            MAX_TEXT_CHARS
                    ) {
                        break;
                    }

                    AssistStructure.WindowNode window =
                            structure.getWindowNodeAt(i);

                    if (window == null) {
                        continue;
                    }

                    collect(
                            window.getRootViewNode(),
                            visibleText,
                            unique,
                            nodeBudget
                    );
                }

            }
            catch (Throwable ignored) {}
        }


        latest =
                new Snapshot(
                        packageName,
                        activityName,
                        webUri,
                        visibleText.toString().trim(),
                        System.currentTimeMillis()
                );
    }


    // =====================================================
    // SAFE VIEW-TREE EXTRACTION
    // =====================================================

    private static void collect(
            AssistStructure.ViewNode node,
            StringBuilder output,
            Set<String> unique,
            int[] budget
    ) {

        if (
                node == null ||
                budget[0] <= 0 ||
                output.length() >= MAX_TEXT_CHARS
        ) {
            return;
        }

        budget[0]--;


        try {

            /*
             * Respect the source app's explicit assist block.
             */
            if (node.isAssistBlocked()) {
                return;
            }

        }
        catch (Throwable ignored) {}


        boolean sensitive =
                isSensitiveInput(node);


        if (!sensitive) {

            try {

                CharSequence value =
                        node.getText();

                addText(
                        value,
                        output,
                        unique
                );

            }
            catch (Throwable ignored) {}
        }


        int count = 0;

        try {
            count = node.getChildCount();
        }
        catch (Throwable ignored) {}


        for (
                int i = 0;
                i < count;
                i++
        ) {

            if (
                    budget[0] <= 0 ||
                    output.length() >= MAX_TEXT_CHARS
            ) {
                return;
            }

            try {

                collect(
                        node.getChildAt(i),
                        output,
                        unique,
                        budget
                );

            }
            catch (Throwable ignored) {}
        }
    }


    // =====================================================
    // SENSITIVE INPUT FILTER
    // =====================================================

    private static boolean isSensitiveInput(
            AssistStructure.ViewNode node
    ) {

        if (node == null) {
            return true;
        }


        try {

            String id =
                    safe(
                            node.getIdEntry()
                    ).toLowerCase(
                            Locale.ROOT
                    );

            if (
                    id.contains("password") ||
                    id.contains("passwd") ||
                    id.contains("passcode") ||
                    id.contains("pin_input") ||
                    id.contains("otp") ||
                    id.contains("cvv") ||
                    id.contains("cvc") ||
                    id.contains("security_code")
            ) {
                return true;
            }

        }
        catch (Throwable ignored) {}


        /*
         * getInputType() was added in API 26.
         */
        if (Build.VERSION.SDK_INT >= 26) {

            try {

                int inputType =
                        node.getInputType();

                int typeClass =
                        inputType &
                        InputType.TYPE_MASK_CLASS;

                int variation =
                        inputType &
                        InputType.TYPE_MASK_VARIATION;


                if (
                        typeClass ==
                        InputType.TYPE_CLASS_TEXT
                ) {

                    if (
                            variation ==
                            InputType.TYPE_TEXT_VARIATION_PASSWORD
                            ||
                            variation ==
                            InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                            ||
                            variation ==
                            InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD
                    ) {
                        return true;
                    }
                }


                if (
                        typeClass ==
                        InputType.TYPE_CLASS_NUMBER &&
                        variation ==
                        InputType.TYPE_NUMBER_VARIATION_PASSWORD
                ) {
                    return true;
                }

            }
            catch (Throwable ignored) {}
        }

        return false;
    }


    private static void addText(
            CharSequence source,
            StringBuilder output,
            Set<String> unique
    ) {

        if (source == null) {
            return;
        }

        String text =
                source.toString()
                        .replaceAll(
                                "\\s+",
                                " "
                        )
                        .trim();

        if (
                text.length() < 2 ||
                unique.contains(text)
        ) {
            return;
        }

        unique.add(text);


        int remaining =
                MAX_TEXT_CHARS -
                output.length();

        if (remaining <= 0) {
            return;
        }


        if (
                output.length() > 0 &&
                remaining > 1
        ) {

            output.append('\n');
            remaining--;
        }


        if (text.length() > remaining) {

            output.append(
                    text,
                    0,
                    remaining
            );

        }
        else {

            output.append(text);
        }
    }


    // =====================================================
    // USER INTENT
    // =====================================================

    public static boolean isScreenContextRequest(
            String original
    ) {

        if (original == null) {
            return false;
        }

        String command =
                original.trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        return
                command.equals("summarize this")
                ||
                command.equals("summarise this")
                ||
                command.equals("summarize this screen")
                ||
                command.equals("summarize this page")
                ||
                command.equals("explain this")
                ||
                command.equals("explain this screen")
                ||
                command.equals("explain this page")
                ||
                command.equals("what is this")
                ||
                command.equals("what is this page about")
                ||
                command.equals("what am i looking at")
                ||
                command.equals("what's on this screen")
                ||
                command.equals("whats on this screen")
                ||
                command.equals("what is on this screen")
                ||
                command.equals("read this screen")
                ||
                command.equals("read this page")
                ||
                command.equals("what does this say")
                ||
                command.contains("on this screen")
                ||
                command.contains("on this page");
    }


    // =====================================================
    // AP SYNAPSE CONTEXT PROMPT
    // =====================================================

    public static String augment(
            String userRequest
    ) {

        Snapshot snapshot =
                current();

        if (snapshot == null) {
            return null;
        }

        boolean hasUsefulData =
                !snapshot.visibleText.isEmpty()
                ||
                !snapshot.webUri.isEmpty()
                ||
                !snapshot.packageName.isEmpty();

        if (!hasUsefulData) {
            return null;
        }


        StringBuilder prompt =
                new StringBuilder();

        prompt.append(
                "The user deliberately invoked Aprisha while viewing a screen. "
        );

        prompt.append(
                "Answer the user's request using only the Android assist context below when referring to the current screen. "
        );

        prompt.append(
                "Do not invent text or details that are not present. "
        );

        prompt.append(
                "If the available context is incomplete, clearly say that.\n\n"
        );

        prompt.append(
                "USER REQUEST:\n"
        );

        prompt.append(
                userRequest
        );

        prompt.append(
                "\n\nCURRENT ANDROID ASSIST CONTEXT:\n"
        );


        if (!snapshot.packageName.isEmpty()) {

            prompt.append(
                    "Foreground app package: "
            );

            prompt.append(
                    snapshot.packageName
            );

            prompt.append('\n');
        }


        if (!snapshot.webUri.isEmpty()) {

            prompt.append(
                    "Current page: "
            );

            prompt.append(
                    snapshot.webUri
            );

            prompt.append('\n');
        }


        if (!snapshot.visibleText.isEmpty()) {

            prompt.append(
                    "Visible screen text:\n"
            );

            prompt.append(
                    snapshot.visibleText
            );
        }

        return prompt.toString();
    }


    // =====================================================
    // FRESHNESS / PRIVACY
    // =====================================================

    private static Snapshot current() {

        Snapshot snapshot =
                latest;

        if (snapshot == null) {
            return null;
        }

        if (
                System.currentTimeMillis() -
                snapshot.time >
                MAX_AGE_MS
        ) {

            latest = null;
            return null;
        }

        return snapshot;
    }


    public static void clear() {
        latest = null;
    }


    private static String safe(
            String value
    ) {
        return value == null
                ? ""
                : value.trim();
    }


    private static final class Snapshot {

        final String packageName;
        final String activityName;
        final String webUri;
        final String visibleText;
        final long time;

        Snapshot(
                String packageName,
                String activityName,
                String webUri,
                String visibleText,
                long time
        ) {

            this.packageName = packageName;
            this.activityName = activityName;
            this.webUri = webUri;
            this.visibleText = visibleText;
            this.time = time;
        }
    }
}
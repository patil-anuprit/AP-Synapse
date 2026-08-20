const palette=document.getElementById("commandPalette");
const search=document.getElementById("commandSearch");

document.addEventListener("keydown",(e)=>{

if(e.ctrlKey&&e.key==="k"){

e.preventDefault();

palette.style.display="flex";

search.focus();

}

if(e.key==="Escape"){

palette.style.display="none";

}

});

document.querySelectorAll(".command-item").forEach(item=>{

item.onclick=()=>{

const cmd=item.dataset.command;

palette.style.display="none";

switch(cmd){

case "new":

location.reload();

break;

case "project":

document.getElementById("createProject").click();

break;

case "search":

document.getElementById("webBtn").click();

break;

case "voice":

document.getElementById("voiceBtn").click();

break;

case "theme":

document.body.classList.toggle("light");

break;

case "about":

window.location.href = "about.html";

break;

}

};

});

const profileSidebarBtn = document.getElementById("profileSidebarBtn");

if (profileSidebarBtn) {
    profileSidebarBtn.addEventListener("click", () => {
        const profileBtn = document.getElementById("profileBtn");

        if (profileBtn) {
            profileBtn.click();
        }
    });
}

// AP Synapse — Google Sign-In
// =========================================================
// AP SYNAPSE — GOOGLE IDENTITY SERVICES
// Reliable production initialization
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const googleButton =
        document.getElementById("googleSignInButton");

    if (!googleButton) {
        console.warn(
            "⚠️ Google Sign-In container not found."
        );
        return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 40;

    function initializeGoogleSignIn() {

        attempts++;

        /*
         * Google Identity Services may load slightly
         * after AP Synapse itself.
         *
         * Wait instead of declaring Google unavailable.
         */

        if (
            !window.google ||
            !window.google.accounts ||
            !window.google.accounts.id
        ) {

            if (attempts >= MAX_ATTEMPTS) {

                console.error(
                    "❌ Google Identity Services could not be loaded."
                );

                showAPSynapseNotification(
                    "Google Sign-In is temporarily unavailable.",
                    "error"
                );

                return;
            }

            setTimeout(
                initializeGoogleSignIn,
                250
            );

            return;
        }

        try {

            google.accounts.id.initialize({

                client_id:
                    "934887208123-picat1v07egg4ndnme3ctlvp46pjl8j1.apps.googleusercontent.com",

                callback:
                    handleGoogleSignIn,

                auto_select:
                    false,

                cancel_on_tap_outside:
                    true

            });

            googleButton.innerHTML = "";

            google.accounts.id.renderButton(
                googleButton,
                {
                    theme: "outline",
                    size: "large",
                    text: "signin_with",
                    shape: "rectangular",
                    width: 280
                }
            );

            console.log(
                "✅ AP Synapse Google Sign-In ready."
            );

        } catch (error) {

            console.error(
                "❌ Google Sign-In initialization failed:",
                error
            );

        }

    }

    initializeGoogleSignIn();

});

async function handleGoogleSignIn(response) {

    console.log("🔐 Google credential received.");

    if (!response || !response.credential) {

        console.error(
            "❌ Google Sign-In failed: no credential received."
        );

        showAPSynapseNotification(
            "Google Sign-In failed.",
            "error"
        );

        return;
    }

    try {

        console.log(
            "🔄 Verifying Google account with AP Synapse..."
        );

        const authResponse = await fetch(
            "https://api.ap-synapse.com/auth/google",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    credential: response.credential
                })
            }
        );

        const result =
            await authResponse.json();

        if (!authResponse.ok || !result.success) {

            throw new Error(
                result.error ||
                "Google authentication failed."
            );
        }

        console.log(
            "✅ Google account verified by AP Synapse."
        );

        const backendUser =
            result.user;

        const user = {

            id:
                backendUser.googleId,

            name:
                backendUser.name ||
                "AP Synapse User",

            email:
                backendUser.email ||
                "",

            picture:
                backendUser.picture ||
                "",

            emailVerified:
                backendUser.emailVerified === true,

            signedIn:
                true,

            provider:
                "google",

            signedInAt:
                new Date().toISOString()

        };

        // ------------------------------------------
        // SAVE AUTHENTICATED AP SYNAPSE USER
        // ------------------------------------------

        localStorage.setItem(
            "apSynapseUser",
            JSON.stringify(user)
        );

        localStorage.setItem(
            "apSynapseAuthenticated",
            "true"
        );

        console.log(
            "👤 AP Synapse profile:",
            user
        );

        // ------------------------------------------
        // UPDATE TOP PROFILE BUTTON
        // ------------------------------------------

        updateAPSynapseProfile(user);

        // ------------------------------------------
        // UPDATE FULL PROFILE PANEL
        // ------------------------------------------

        updateAPSynapseIdentityPanel(user);

        updateAPSynapseHomeGreeting(user);

        updateGoogleConnectionCenter();

        // ------------------------------------------
        // CLOSE GOOGLE SIGN-IN STATE
        // ------------------------------------------

        const googleButton =
            document.getElementById(
                "googleSignInButton"
            );

        if (googleButton) {

            googleButton.style.display =
                "none";

        }

        /* =========================================================
   AP SYNAPSE — GOOGLE SIGN-IN NOTIFICATION
========================================================= */

if (
    window.AP_Synapse_Notifications &&
    typeof window.AP_Synapse_Notifications.add === "function"
) {

    window.AP_Synapse_Notifications.add({

        title:
            "Google Sign-In successful",

        message:
            `Welcome to AP Synapse, ${user.name}. Your Google account is securely connected to this workspace.`,

        icon:
            "✓",

        type:
            "authentication"

    });

}

        // ------------------------------------------
        // SUCCESS NOTIFICATION
        // ------------------------------------------

        showAPSynapseNotification(
            `Welcome to AP Synapse, ${user.name}.`,
            "success"
        );

        console.log(
            "🎉 AP Synapse authentication completed."
        );

    }

    catch (error) {

        console.error(
            "❌ Google Sign-In connection error:",
            error
        );

        showAPSynapseNotification(
            "Unable to complete Google Sign-In.",
            "error"
        );

    }

}

function updateAPSynapseIdentityPanel(user) {

    if (!user) return;

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );

    const profileName =
        document.getElementById(
            "profileName"
        );

    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    const googleSignInButton =
        document.getElementById(
            "googleSignInButton"
        );

    if (profileName) {

        profileName.textContent =
            user.name ||
            "AP Synapse User";

    }

    if (profileEmail) {

        profileEmail.textContent =
            user.email ||
            "";

    }

    if (
        profileAvatar &&
        user.picture
    ) {

        profileAvatar.src =
            user.picture;

        profileAvatar.style.display =
            "block";

    }

    if (googleSignInButton) {

        googleSignInButton.style.display =
            "none";

    }

    // Authenticated status

    const authenticatedStatus =
        document.getElementById(
            "authenticatedStatus"
        );

    if (authenticatedStatus) {

        authenticatedStatus.textContent =
            user.emailVerified
                ? "Google Verified"
                : "Authenticated";

        authenticatedStatus.classList.add(
            "authenticated"
        );

    }

}

function showAPSynapseNotification(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "apSynapseNotifications"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "apSynapseNotifications";

        container.style.position =
            "fixed";

        container.style.top =
            "24px";

        container.style.right =
            "24px";

        container.style.zIndex =
            "999999";

        container.style.display =
            "flex";

        container.style.flexDirection =
            "column";

        container.style.gap =
            "10px";

        document.body.appendChild(
            container
        );

    }

    const notification =
        document.createElement("div");

    notification.textContent =
        message;

    notification.style.padding =
        "14px 18px";

    notification.style.borderRadius =
        "12px";

    notification.style.background =
        "#171717";

    notification.style.border =
        "1px solid rgba(255,255,255,.12)";

    notification.style.color =
        "#fff";

    notification.style.fontSize =
        "14px";

    notification.style.boxShadow =
        "0 10px 40px rgba(0,0,0,.35)";

    notification.style.opacity =
        "0";

    notification.style.transform =
        "translateY(-8px)";

    notification.style.transition =
        "all .25s ease";

    container.appendChild(
        notification
    );

    requestAnimationFrame(() => {

        notification.style.opacity =
            "1";

        notification.style.transform =
            "translateY(0)";

    });

    setTimeout(() => {

        notification.style.opacity =
            "0";

        notification.style.transform =
            "translateY(-8px)";

        setTimeout(() => {

            notification.remove();

        }, 300);

    }, 4000);

}

function updateAPSynapseProfile(user) {
    const profileBtn = document.getElementById("profileBtn");

    if (!profileBtn || !user) return;

    profileBtn.innerHTML = "";

    if (user.picture) {
        const avatar = document.createElement("img");

        avatar.src = user.picture;
        avatar.alt = user.name;
        avatar.referrerPolicy = "no-referrer";

        avatar.style.width = "32px";
        avatar.style.height = "32px";
        avatar.style.borderRadius = "50%";
        avatar.style.objectFit = "cover";

        profileBtn.appendChild(avatar);
    } else {
        profileBtn.textContent =
            user.name.charAt(0).toUpperCase();
    }

    profileBtn.title = `${user.name} — ${user.email}`;

    profileBtn.classList.add("authenticated");
}

// =========================================================
// AP SYNAPSE — SWITCH GOOGLE ACCOUNT
// =========================================================

function switchAPSynapseAccount() {

    signOutAPSynapse();

    // Tell Google not to automatically reuse
    // the previous account.
    if (
        window.google &&
        google.accounts &&
        google.accounts.id
    ) {
        google.accounts.id.disableAutoSelect();
    }

    setTimeout(() => {

        const googleButton =
            document.getElementById(
                "googleSignInButton"
            );

        if (googleButton) {
            googleButton.style.display = "";
            googleButton.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }

        showAPSynapseNotification(
            "Choose a Google account to continue.",
            "info"
        );

    }, 250);

}


// =========================================================
// AP SYNAPSE — ACCOUNT STATUS
// =========================================================

function getAPSynapseUser() {

    try {

        const savedUser =
            localStorage.getItem(
                "apSynapseUser"
            );

        if (!savedUser) return null;

        const user =
            JSON.parse(savedUser);

        return user?.signedIn
            ? user
            : null;

    } catch (error) {

        console.error(
            "Could not read AP Synapse account:",
            error
        );

        return null;
    }
}


// =========================================================
// AP SYNAPSE — GLOBAL ACCOUNT ACTION HANDLER
// =========================================================

document.addEventListener(
    "click",
    (event) => {

        const actionButton =
            event.target.closest(
                "[data-account-action]"
            );

        if (!actionButton) return;

        const action =
            actionButton.dataset.accountAction;

        if (action === "signout") {
            signOutAPSynapse();
        }

        if (action === "switch") {
            switchAPSynapseAccount();
        }

    }
);

function restoreAPSynapseSession() {

    try {

        const savedUser =
            localStorage.getItem(
                "apSynapseUser"
            );

        if (!savedUser) {

            console.log(
                "ℹ️ No AP Synapse session found."
            );

            return;

        }

        const user =
            JSON.parse(savedUser);

        if (
            user &&
            user.signedIn
        ) {

            console.log(
                "🔄 Restoring AP Synapse authenticated session..."
            );

            updateAPSynapseProfile(
                user
            );

            updateAPSynapseIdentityPanel(
                user
            );

            updateAPSynapseHomeGreeting(
                user
            );

            const googleButton =
                document.getElementById(
                    "googleSignInButton"
                );

            if (googleButton) {

                googleButton.style.display =
                    "none";

            }

            console.log(
                "✅ AP Synapse authenticated session restored."
            );

        }

    }

    catch (error) {

        console.error(
            "❌ Could not restore AP Synapse session:",
            error
        );

        localStorage.removeItem(
            "apSynapseUser"
        );

        localStorage.removeItem(
            "apSynapseAuthenticated"
        );

    }

}

function signOutAPSynapse() {

    console.log("🔐 AP Synapse sign-out requested.");

    const confirmed = window.confirm(
        "Sign out of AP Synapse on this device?"
    );

    if (!confirmed) {
        return;
    }

    if (
    window.google &&
    google.accounts &&
    google.accounts.id
) {
    google.accounts.id.disableAutoSelect();
}

    // Clear AP Synapse authentication state
    localStorage.removeItem("apSynapseUser");
    localStorage.removeItem("apSynapseAuthenticated");

    updateGoogleConnectionCenter();

    // Optional session/history keys if you use them
    sessionStorage.removeItem("apSynapseSession");

    // Reset profile button
    const profileBtn =
        document.getElementById("profileBtn");

    if (profileBtn) {

        profileBtn.innerHTML = "AP";

        profileBtn.classList.remove(
            "authenticated"
        );

        profileBtn.removeAttribute("title");
    }

    // Restore Google Sign-In button
    const googleButton =
        document.getElementById(
            "googleSignInButton"
        );

    if (googleButton) {
        googleButton.style.display = "";
    }

    // Reset profile information
    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    const profileAvatar =
        document.getElementById("profileAvatar");

    const authenticatedStatus =
        document.getElementById(
            "authenticatedStatus"
        );

    if (profileName) {
        profileName.textContent =
            "AP Synapse User";
    }

    if (profileEmail) {
        profileEmail.textContent =
            "Not signed in";
    }

    if (profileAvatar) {
        profileAvatar.removeAttribute("src");
        profileAvatar.style.display = "none";
    }

    if (authenticatedStatus) {

        authenticatedStatus.textContent =
            "Not authenticated";

        authenticatedStatus.classList.remove(
            "authenticated"
        );
    }

    // Close identity panel
    const identityPanel =
        document.getElementById(
            "synapseIdentityPanel"
        );

    const identityBtn =
        document.getElementById(
            "synapseIdentityBtn"
        );

    if (identityPanel) {
        identityPanel.classList.remove(
            "is-open"
        );

        identityPanel.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    if (identityBtn) {
        identityBtn.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    showAPSynapseNotification(
        "You have been signed out of AP Synapse.",
        "success"
    );

    console.log(
        "✅ AP Synapse signed out successfully."
    );
}

document.addEventListener("DOMContentLoaded", () => {
    restoreAPSynapseSession();
});

/* =========================================================
   AP SYNAPSE — PROFILE PANEL CONTROLLER
   Opens ONLY from an explicit user action.
   Never opens automatically on refresh.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const profileBtn =
        document.getElementById("profileBtn");

    const profileCard =
        document.getElementById("profileCard");

    const closeProfile =
        document.getElementById("closeProfile");

    if (!profileBtn || !profileCard) {

        console.warn(
            "⚠️ AP Synapse Profile controls not found."
        );

        return;
    }


    /* -----------------------------------------
       ALWAYS START CLOSED
    ----------------------------------------- */

    profileCard.classList.remove("active");

    profileCard.setAttribute(
        "aria-hidden",
        "true"
    );

    profileBtn.setAttribute(
        "aria-expanded",
        "false"
    );


    /* -----------------------------------------
       OPEN
    ----------------------------------------- */

    function openProfile() {

        profileCard.classList.add("active");

        profileCard.setAttribute(
            "aria-hidden",
            "false"
        );

        profileBtn.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    /* -----------------------------------------
       CLOSE
    ----------------------------------------- */

    function closeProfilePanel() {

        profileCard.classList.remove("active");

        profileCard.setAttribute(
            "aria-hidden",
            "true"
        );

        profileBtn.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    /* -----------------------------------------
       PROFILE BUTTON
    ----------------------------------------- */

    profileBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            const isOpen =
                profileCard.classList.contains(
                    "active"
                );

            if (isOpen) {

                closeProfilePanel();

            } else {

                openProfile();

            }

        }
    );


    /* -----------------------------------------
       CLOSE BUTTON
    ----------------------------------------- */

    if (closeProfile) {

        closeProfile.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                closeProfilePanel();

            }
        );

    }


    /* -----------------------------------------
       ESCAPE
    ----------------------------------------- */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeProfilePanel();

            }

        }
    );


    /* -----------------------------------------
       CLICK OUTSIDE
    ----------------------------------------- */

    document.addEventListener(
        "click",
        (event) => {

            if (
                profileCard.classList.contains(
                    "active"
                ) &&
                !profileCard.contains(
                    event.target
                ) &&
                !profileBtn.contains(
                    event.target
                )
            ) {

                closeProfilePanel();

            }

        }
    );


    console.log(
        "👤 AP Synapse Profile Controller ready."
    );

});

/* =========================================================
   AP SYNAPSE — WORKSPACE IDENTITY CONTROL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const signOutBtn =
    document.getElementById(
        "synapseSignOutBtn"
    );

if (signOutBtn) {

    signOutBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            signOutAPSynapse();

        }
    );

}
    const identityBtn =
        document.getElementById("synapseIdentityBtn");

    const identityPanel =
        document.getElementById("synapseIdentityPanel");

    const closeIdentity =
        document.getElementById("closeSynapseIdentity");

    if (!identityBtn || !identityPanel) {
        console.warn(
            "AP Synapse workspace identity controls not found."
        );

        return;
    }


    function openIdentityPanel() {

        identityPanel.classList.add("is-open");

        identityPanel.setAttribute(
            "aria-hidden",
            "false"
        );

        identityBtn.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    function closeIdentityPanel() {

        identityPanel.classList.remove("is-open");

        identityPanel.setAttribute(
            "aria-hidden",
            "true"
        );

        identityBtn.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    identityBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            const isOpen =
                identityPanel.classList.contains("is-open");

            if (isOpen) {
                closeIdentityPanel();
            } else {
                openIdentityPanel();
            }

        }
    );


    if (closeIdentity) {

        closeIdentity.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                closeIdentityPanel();

            }
        );

    }


    /* Close when clicking outside */

    document.addEventListener(
        "click",
        (event) => {

            if (
                !identityPanel.contains(event.target) &&
                !identityBtn.contains(event.target)
            ) {

                closeIdentityPanel();

            }

        }
    );


    /* Escape */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {
                closeIdentityPanel();
            }

        }
    );


    /* =====================================================
       QUICK WORKSPACE ACTIONS
    ===================================================== */

    identityPanel
        .querySelectorAll("[data-synapse-action]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.synapseAction;

                    closeIdentityPanel();


                    if (
                        action === "assistant"
                    ) {

                        const assistantBtn =
                            document.getElementById(
                                "assistantBtn"
                            );

                        if (assistantBtn) {
                            assistantBtn.click();
                        }

                    }


                    if (
                        action === "projects"
                    ) {

                        const projectsBtn =
                            document.getElementById(
                                "projectsBtn"
                            );

                        if (projectsBtn) {
                            projectsBtn.click();
                        }

                    }


                    if (
                        action === "knowledge"
                    ) {

                        const knowledgeBtn =
                            document.getElementById(
                                "knowledgeBtn"
                            );

                        if (knowledgeBtn) {
                            knowledgeBtn.click();
                        }

                    }

                }
            );

        });


    console.log(
        "✦ AP Synapse Workspace Identity ready."
    );

});

/* =========================================================
   AP SYNAPSE — NOTIFICATION CENTER ENGINE
========================================================= */

(() => {

    const STORAGE_KEY = "apSynapseNotifications";

    const notificationBtn =
        document.getElementById("notificationBtn");

    const center =
        document.getElementById(
            "apSynapseNotificationCenter"
        );

    const closeBtn =
        document.getElementById(
            "closeAPNotificationCenter"
        );

    const list =
        document.getElementById(
            "apNotificationList"
        );

    const summary =
        document.getElementById(
            "apNotificationSummary"
        );

    const markAllBtn =
        document.getElementById(
            "markAllAPNotificationsRead"
        );

    const clearBtn =
        document.getElementById(
            "clearAPNotifications"
        );

    if (!notificationBtn || !center || !list) {

        console.warn(
            "⚠️ AP Synapse Notification Center elements not found."
        );

        return;
    }


    /* ---------------------------------------------------------
       STORAGE
    --------------------------------------------------------- */

    function loadNotifications() {

        try {

            const saved =
                localStorage.getItem(STORAGE_KEY);

            if (!saved) return [];

            const parsed =
                JSON.parse(saved);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "❌ Could not load AP Synapse notifications:",
                error
            );

            return [];
        }
    }


    function saveNotifications(notifications) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(notifications)
            );

        } catch (error) {

            console.error(
                "❌ Could not save AP Synapse notifications:",
                error
            );
        }
    }


    /* ---------------------------------------------------------
       ID
    --------------------------------------------------------- */

    function createNotificationId() {

        return (
            "n_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
    }


    /* ---------------------------------------------------------
       FORMAT TIME
    --------------------------------------------------------- */

    function formatNotificationTime(timestamp) {

        const date =
            new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    }


    /* ---------------------------------------------------------
       BADGE
    --------------------------------------------------------- */

    function updateNotificationBadge() {

        const notifications =
            loadNotifications();

        const unread =
            notifications.filter(
                notification =>
                    notification.read !== true
            ).length;


        let badge =
            notificationBtn.querySelector(
                ".ap-notification-badge"
            );


        if (!badge) {

            badge =
                document.createElement("span");

            badge.className =
                "ap-notification-badge";

            notificationBtn.appendChild(
                badge
            );
        }


        if (unread > 0) {

            badge.textContent =
                unread > 99
                    ? "99+"
                    : String(unread);

            badge.style.display =
                "flex";

            notificationBtn.classList.add(
                "has-notifications"
            );

        } else {

            badge.textContent = "";

            badge.style.display =
                "none";

            notificationBtn.classList.remove(
                "has-notifications"
            );
        }
    }


    /* ---------------------------------------------------------
       RENDER
    --------------------------------------------------------- */

    function renderNotifications() {

        const notifications =
            loadNotifications();


        list.innerHTML = "";


        if (!notifications.length) {

            const empty =
                document.createElement("div");

            empty.className =
                "ap-notification-empty";

            empty.innerHTML = `
                <div class="ap-notification-empty-icon">
                    ✓
                </div>

                <strong>You're all caught up.</strong>

                <span>
                    Important AP Synapse activity
                    will appear here.
                </span>
            `;

            list.appendChild(empty);

            if (summary) {

                summary.textContent =
                    "You're all caught up.";
            }

            updateNotificationBadge();

            return;
        }


        const unread =
            notifications.filter(
                notification =>
                    notification.read !== true
            ).length;


        if (summary) {

            summary.textContent =
                unread === 0
                    ? "You're all caught up."
                    : `${unread} unread notification${
                        unread === 1
                            ? ""
                            : "s"
                    }.`;
        }


        notifications.forEach(
            notification => {

                const item =
                    document.createElement("article");

                item.className =
                    "ap-notification-item";


                if (
                    notification.read !== true
                ) {

                    item.classList.add(
                        "unread"
                    );
                }


                const icon =
                    document.createElement("div");

                icon.className =
                    "ap-notification-item-icon";

                icon.textContent =
                    notification.icon ||
                    "✦";


                const content =
                    document.createElement("div");

                content.className =
                    "ap-notification-item-content";


                const title =
                    document.createElement("strong");

                title.textContent =
                    notification.title ||
                    "AP Synapse Notification";


                const message =
                    document.createElement("p");

                message.textContent =
                    notification.message ||
                    "";


                const time =
                    document.createElement("time");

                time.textContent =
                    formatNotificationTime(
                        notification.createdAt
                    );


                content.appendChild(title);
                content.appendChild(message);
                content.appendChild(time);


                const actions =
                    document.createElement("div");

                actions.className =
                    "ap-notification-item-actions";


                if (
                    notification.read !== true
                ) {

                    const readBtn =
                        document.createElement("button");

                    readBtn.type =
                        "button";

                    readBtn.textContent =
                        "Mark read";

                    readBtn.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            markNotificationRead(
                                notification.id
                            );

                        }
                    );

                    actions.appendChild(
                        readBtn
                    );
                }


                item.appendChild(icon);
                item.appendChild(content);
                item.appendChild(actions);

                item.addEventListener(
                    "click",
                    () => {

                        markNotificationRead(
                            notification.id
                        );

                        if (
                            notification.action
                        ) {

                            try {

                                notification.action();

                            } catch (error) {

                                console.error(
                                    "Notification action failed:",
                                    error
                                );
                            }
                        }
                    }
                );


                list.appendChild(item);
            }
        );


        updateNotificationBadge();
    }


    /* ---------------------------------------------------------
       ADD
    --------------------------------------------------------- */

    function addNotification({

        title =
            "AP Synapse Notification",

        message = "",

        icon = "✦",

        type = "system",

        read = false

    } = {}) {


        const notifications =
            loadNotifications();


        notifications.unshift({

            id:
                createNotificationId(),

            title,

            message,

            icon,

            type,

            read,

            createdAt:
                new Date().toISOString()

        });


        /*
         * Keep the local notification history
         * intentionally bounded.
         */

        const trimmed =
            notifications.slice(0, 100);


        saveNotifications(
            trimmed
        );


        renderNotifications();
    }


    /* ---------------------------------------------------------
       MARK READ
    --------------------------------------------------------- */

    function markNotificationRead(id) {

        const notifications =
            loadNotifications();


        const target =
            notifications.find(
                notification =>
                    notification.id === id
            );


        if (!target) return;


        target.read = true;


        saveNotifications(
            notifications
        );


        renderNotifications();
    }


    /* ---------------------------------------------------------
       MARK ALL READ
    --------------------------------------------------------- */

    function markAllRead() {

        const notifications =
            loadNotifications();


        notifications.forEach(
            notification => {

                notification.read = true;

            }
        );


        saveNotifications(
            notifications
        );


        renderNotifications();
    }


    /* ---------------------------------------------------------
       CLEAR
    --------------------------------------------------------- */

    function clearNotifications() {

        saveNotifications([]);

        renderNotifications();
    }


    /* ---------------------------------------------------------
       OPEN
    --------------------------------------------------------- */

    function openCenter() {

        renderNotifications();


        center.classList.add(
            "is-open"
        );


        center.setAttribute(
            "aria-hidden",
            "false"
        );


        notificationBtn.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    /* ---------------------------------------------------------
       CLOSE
    --------------------------------------------------------- */

    function closeCenter() {

        center.classList.remove(
            "is-open"
        );


        center.setAttribute(
            "aria-hidden",
            "true"
        );


        notificationBtn.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    /* ---------------------------------------------------------
       BUTTONS
    --------------------------------------------------------- */

    notificationBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            const isOpen =
                center.classList.contains(
                    "is-open"
                );


            if (isOpen) {

                closeCenter();

            } else {

                openCenter();
            }
        }
    );


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                closeCenter();
            }
        );
    }


    if (markAllBtn) {

        markAllBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                markAllRead();
            }
        );
    }


    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                clearNotifications();
            }
        );
    }


    document.addEventListener(
        "click",
        event => {

            if (
                !center.contains(event.target) &&
                !notificationBtn.contains(
                    event.target
                )
            ) {

                closeCenter();
            }
        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeCenter();
            }
        }
    );


    /* ---------------------------------------------------------
       PUBLIC AP SYNAPSE API
    --------------------------------------------------------- */

    window.AP_Synapse_Notifications = {

        add:
            addNotification,

        markRead:
            markNotificationRead,

        markAllRead:
            markAllRead,

        clear:
            clearNotifications,

        refresh:
            renderNotifications

    };


    /* ---------------------------------------------------------
       INITIALIZE
    --------------------------------------------------------- */

    renderNotifications();


    console.log(
        "🔔 AP Synapse Notification Center ready."
    );

})();

// =========================================================
// AP SYNAPSE — GOOGLE CONNECTION CENTER
// =========================================================

function updateGoogleConnectionCenter() {

    const status =
        document.getElementById("googleConnectionStatus");

    const indicator =
        document.getElementById("googleConnectionIndicator");

    const services =
        document.querySelectorAll(
            ".google-service-item"
        );

    if (!status || !indicator) return;

    const user =
        typeof getAPSynapseUser === "function"
            ? getAPSynapseUser()
            : null;

    const connected =
        user &&
        user.signedIn &&
        user.provider === "google";

    if (connected) {

        status.textContent =
            user.email
                ? `Connected · ${user.email}`
                : "Connected";

        indicator.textContent = "●";

        indicator.classList.add("connected");

        services.forEach(service => {
            service.classList.add("available");
        });

    } else {

        status.textContent =
            "Not connected";

        indicator.textContent = "●";

        indicator.classList.remove("connected");

        services.forEach(service => {
            service.classList.remove("available");
        });

    }

}

// Update after page initialization
document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateGoogleConnectionCenter();

        setTimeout(
            updateGoogleConnectionCenter,
            500
        );

    }
);

// Update whenever profile/auth state changes
window.addEventListener(
    "storage",
    updateGoogleConnectionCenter
);

console.log(
    "🔗 AP Synapse Google Connection Center ready."
);

// =========================================================
// AP SYNAPSE — PERSONALIZED HERO GREETING
// =========================================================

function updatePersonalGreeting(user) {

    const greeting =
        document.getElementById("personalGreeting");

    const description =
        document.getElementById("heroDescription");

    if (!greeting || !description) return;

    const name =
        String(user?.name || "")
            .trim()
            .split(/\s+/)[0];

    if (!name) {

        greeting.hidden = true;
        greeting.textContent = "";

        description.textContent =
            "One intelligent workspace for everything you build.";

        return;
    }

    const firstVisitKey =
        "ap_synapse_google_welcome_seen";

    const hasVisited =
        localStorage.getItem(firstVisitKey) === "true";

    greeting.textContent =
        hasVisited
            ? `Welcome back, ${name}.`
            : `Welcome, ${name}.`;

    greeting.hidden = false;

    requestAnimationFrame(() => {
        greeting.classList.add("is-visible");
    });

    description.textContent =
        "Your intelligent workspace is ready.";

    localStorage.setItem(
        firstVisitKey,
        "true"
    );
}

// =========================================================
// AP SYNAPSE — PERSONAL HOME GREETING
// =========================================================

function updateAPSynapseHomeGreeting(user) {

    const greeting = document.getElementById("personalGreeting");

    if (!greeting) {
        console.warn("⚠️ personalGreeting element not found.");
        return;
    }

    if (!user || !user.signedIn) {
        greeting.hidden = true;
        greeting.textContent = "";
        return;
    }

    const name = String(user.name || "").trim();

    if (!name) {
        console.warn("⚠️ Signed-in user has no name.");
        return;
    }

    greeting.textContent = `Welcome back, ${name}.`;
    greeting.hidden = false;

    // Force visibility
    greeting.style.display = "block";
    greeting.style.visibility = "visible";
    greeting.style.opacity = "1";

    console.log("✅ AP Synapse home greeting:", greeting.textContent);
}

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
window.onload = function () {

    google.accounts.id.initialize({
        client_id: "94855354634-27opp9jpmco5lt5010b35rgdt9ll1dto.apps.googleusercontent.com",
        callback: handleGoogleSignIn
    });

    google.accounts.id.renderButton(
    document.getElementById("googleSignInButton"),
    {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 280
    }
);

};

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
            "https://ap-synapse-backend.onrender.com/auth/google",
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
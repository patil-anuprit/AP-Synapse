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

function handleGoogleSignIn(response) {
    console.log("Google sign-in successful.");

    if (!response || !response.credential) {
        console.error("Google sign-in failed: no credential received.");
        return;
    }

    try {
        const payload = JSON.parse(
            atob(
                response.credential.split(".")[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );

        const user = {
            id: payload.sub,
            name: payload.name || "AP Synapse User",
            email: payload.email || "",
            picture: payload.picture || "",
            signedIn: true
        };

        localStorage.setItem(
            "apSynapseUser",
            JSON.stringify(user)
        );

        console.log("AP Synapse profile:", user);

        updateAPSynapseProfile(user);

    } catch (error) {
        console.error("Could not process Google profile:", error);
    }
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

function restoreAPSynapseSession() {
    try {
        const savedUser = localStorage.getItem("apSynapseUser");

        if (!savedUser) return;

        const user = JSON.parse(savedUser);

        if (user && user.signedIn) {
            updateAPSynapseProfile(user);

            console.log(
                "AP Synapse session restored:",
                user.name
            );
        }

    } catch (error) {
        console.error(
            "Could not restore AP Synapse session:",
            error
        );

        localStorage.removeItem("apSynapseUser");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    restoreAPSynapseSession();
});

/* =========================================================
   AP SYNAPSE — WORKSPACE IDENTITY CONTROL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

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
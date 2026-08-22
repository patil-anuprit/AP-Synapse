(() => {
    "use strict";


    const isLocal =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";


    const API =
        isLocal
            ? "http://localhost:5000"
            : "https://api.ap-synapse.com";


    let roomId = null;
    let editKey = null;
    let revision = 0;

    let pollingTimer = null;
    let mutationObserver = null;
    let syncTimer = null;

    let suppressSync = false;

    let lastFingerprint = "";


    window.apLiveRoomId = null;
    window.apLiveEditKey = null;


    function uid() {

        if (
            crypto?.randomUUID
        ) {

            return crypto.randomUUID();
        }


        return (
            "aplive-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2)
        );
    }


    function chat() {

        return document.getElementById(
            "chatWindow"
        );
    }


    function shareButton() {

        return document.getElementById(
            "shareConversationBtn"
        );
    }


    function toast(text) {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "toast";


        item.textContent =
            text;


        document.body.appendChild(
            item
        );


        setTimeout(
            () => item.remove(),
            2400
        );
    }


    function buildShareURL() {

        if (
            !roomId ||
            !editKey
        ) {
            return "";
        }


        const base =
            isLocal
                ? new URL(
                    location.pathname,
                    location.origin
                )
                : new URL(
                    "https://ap-synapse.com/"
                );


        base.searchParams.set(
            "live",
            roomId
        );


        base.searchParams.set(
            "key",
            editKey
        );


        return base.href;
    }


    function messageElements() {

        const root =
            chat();


        if (!root) {
            return [];
        }


        return [...root.children]
            .filter(element =>
                element.matches?.(
                    ".message.user,.message.ai,.user-message,.assistant-message,.ai-message,.bot-message"
                )
            );
    }


    function extractMessageContent(
        element
    ) {

        const body =
            element.querySelector(
                ".message-body,.message-content,.response-content,.ap-response-body,.markdown-body"
            )
            ||
            element;


        const clone =
            body.cloneNode(
                true
            );


        clone
            .querySelectorAll(`
                .message-actions,
                .ap-response-actions,
                .ap-final-response-actions,
                .ap-final-response-action,
                button,
                script,
                style,
                textarea,
                input
            `)
            .forEach(
                node => node.remove()
            );


        clone
            .querySelectorAll(
                "a[href]"
            )
            .forEach(anchor => {

                const label =
                    (
                        anchor.textContent ||
                        anchor.href
                    )
                    .trim();


                const replacement =
                    document.createTextNode(
                        `[${label}](${anchor.href})`
                    );


                anchor.replaceWith(
                    replacement
                );

            });


        clone
            .querySelectorAll(
                "img[src]"
            )
            .forEach(image => {

                image.replaceWith(
                    document.createTextNode(
                        `[Image](${image.src})`
                    )
                );

            });


        return (
            clone.innerText ||
            clone.textContent ||
            ""
        )
        .replace(
            /\n{4,}/g,
            "\n\n\n"
        )
        .trim();
    }


    function serializeConversation() {

        return messageElements()
            .map(element => {

                if (
                    !element.dataset.apLiveId
                ) {

                    element.dataset.apLiveId =
                        uid();
                }


                if (
                    !element.dataset.apLiveCreatedAt
                ) {

                    element.dataset.apLiveCreatedAt =
                        new Date().toISOString();
                }


                const user =
                    element.classList.contains(
                        "user"
                    )
                    ||
                    element.classList.contains(
                        "user-message"
                    );


                const content =
                    extractMessageContent(
                        element
                    );


                if (!content) {
                    return null;
                }


                return {
                    id:
                        element.dataset.apLiveId,

                    role:
                        user
                            ? "user"
                            : "assistant",

                    content,

                    author:
                        user
                            ? "Participant"
                            : "AP Synapse",

                    createdAt:
                        element.dataset.apLiveCreatedAt
                };

            })
            .filter(Boolean);
    }


    function fingerprint(
        messages
    ) {

        return JSON.stringify(
            (messages || [])
                .map(item => [
                    item.id,
                    item.role,
                    item.content
                ])
        );
    }


    function safeMarkdown(
        value
    ) {

        const escaped =
            String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");


        const holder =
            document.createElement(
                "div"
            );


        if (
            window.marked?.parse
        ) {

            holder.innerHTML =
                window.marked.parse(
                    escaped,
                    {
                        gfm:true,
                        breaks:true
                    }
                );

        } else {

            holder.textContent =
                String(value || "");
        }


        holder
            .querySelectorAll(
                "a[href]"
            )
            .forEach(anchor => {

                try {

                    const url =
                        new URL(
                            anchor.href,
                            location.href
                        );


                    if (
                        url.protocol !== "http:" &&
                        url.protocol !== "https:"
                    ) {

                        anchor.replaceWith(
                            document.createTextNode(
                                anchor.textContent
                            )
                        );

                        return;
                    }


                    anchor.target =
                        "_blank";

                    anchor.rel =
                        "noopener noreferrer";

                } catch {

                    anchor.replaceWith(
                        document.createTextNode(
                            anchor.textContent
                        )
                    );
                }

            });


        holder
            .querySelectorAll(
                "img"
            )
            .forEach(image => {

                const src =
                    image.getAttribute("src");


                if (!src) {

                    image.remove();

                    return;
                }


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    src;

                link.target =
                    "_blank";

                link.rel =
                    "noopener noreferrer";

                link.textContent =
                    "Open shared image";


                image.replaceWith(
                    link
                );

            });


        return holder;
    }


    function createMessageElement(
        item
    ) {

        const wrapper =
            document.createElement(
                "div"
            );


        const user =
            item.role === "user";


        wrapper.className =
            `message ${
                user
                    ? "user"
                    : "ai"
            }`;


        wrapper.dataset.apLiveId =
            item.id;


        wrapper.dataset.apLiveCreatedAt =
            item.createdAt;


        const avatar =
            document.createElement(
                "div"
            );


        avatar.className =
            "avatar";


        avatar.textContent =
            user
                ? "U"
                : "AP";


        const body =
            document.createElement(
                "div"
            );


        body.className =
            "message-body";


        const rendered =
            safeMarkdown(
                item.content
            );


        while (
            rendered.firstChild
        ) {

            body.appendChild(
                rendered.firstChild
            );
        }


        wrapper.append(
            avatar,
            body
        );


        return wrapper;
    }


    function enterConversationMode() {

        document.body.classList.add(
            "chat-active"
        );


        const hero =
            document.getElementById(
                "heroScreen"
            );


        if (hero) {

            hero.style.setProperty(
                "display",
                "none",
                "important"
            );

            hero.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );
        }


        const assistant =
            document.getElementById(
                "assistantPage"
            );


        if (assistant) {

            assistant.style.setProperty(
                "display",
                "block",
                "important"
            );
        }


        const root =
            chat();


        if (root) {

            root.style.setProperty(
                "display",
                "flex",
                "important"
            );

            root.style.setProperty(
                "visibility",
                "visible",
                "important"
            );
        }
    }


    function renderRoom(
        live
    ) {

        const root =
            chat();


        if (!root) {
            return;
        }


        const messages =
            Array.isArray(
                live.messages
            )
                ? live.messages
                : [];


        const nextFingerprint =
            fingerprint(
                messages
            );


        if (
            nextFingerprint ===
            lastFingerprint
        ) {

            revision =
                Number(
                    live.revision ||
                    revision
                );

            return;
        }


        const oldScroll =
            root.scrollTop;


        suppressSync =
            true;


        root.innerHTML =
            "";


        messages.forEach(
            item => {

                root.appendChild(
                    createMessageElement(
                        item
                    )
                );

            }
        );


        root.scrollTop =
            oldScroll;


        revision =
            Number(
                live.revision ||
                revision
            );


        lastFingerprint =
            nextFingerprint;


        enterConversationMode();


        requestAnimationFrame(
            () => {

                suppressSync =
                    false;

            }
        );
    }


    async function apiRequest(
        path,
        options = {}
    ) {

        const headers =
            new Headers(
                options.headers ||
                {}
            );


        if (editKey) {

            headers.set(
                "x-live-key",
                editKey
            );
        }


        const response =
            await fetch(
                API + path,
                {
                    ...options,
                    headers
                }
            );


        let payload = {};


        try {

            payload =
                await response.json();

        } catch {}


        if (!response.ok) {

            const error =
                new Error(
                    payload.error ||
                    `Request failed (${response.status})`
                );


            error.status =
                response.status;


            throw error;
        }


        return payload;
    }


    function setLiveButton(
        active
    ) {

        const button =
            shareButton();


        if (!button) {
            return;
        }


        button.classList.toggle(
            "ap-live-active",
            active
        );


        const spans =
            button.querySelectorAll(
                "span"
            );


        const label =
            spans[
                spans.length - 1
            ];


        if (label) {

            label.textContent =
                active
                    ? "Live"
                    : "Share";
        }


        button.title =
            active
                ? "Live conversation sharing active"
                : "Share conversation";
    }


    function setRoom(
        id,
        key,
        nextRevision = 0
    ) {

        roomId =
            id;

        editKey =
            key;

        revision =
            Number(
                nextRevision || 0
            );


        window.apLiveRoomId =
            roomId;

        window.apLiveEditKey =
            editKey;


        if (
            roomId &&
            editKey
        ) {

            sessionStorage.setItem(
                `ap-live-key:${roomId}`,
                editKey
            );
        }


        setLiveButton(
            !!roomId
        );


        updateModal();
    }


    async function pushSnapshot() {

        if (
            !roomId ||
            !editKey ||
            suppressSync
        ) {
            return;
        }


        const messages =
            serializeConversation();


        if (!messages.length) {
            return;
        }


        try {

            const result =
                await apiRequest(
                    `/live-conversations/${encodeURIComponent(roomId)}/sync`,
                    {
                        method:"POST",

                        headers:{
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                messages
                            })
                    }
                );


            revision =
                Number(
                    result.revision ||
                    revision
                );


            lastFingerprint =
                fingerprint(
                    result.messages ||
                    messages
                );

        } catch (error) {

            if (
                error.status === 410 ||
                error.status === 404
            ) {

                stopLocalLiveState();

            } else {

                console.warn(
                    "Live sync:",
                    error
                );
            }
        }
    }


    function schedulePush() {

        if (
            suppressSync ||
            !roomId
        ) {
            return;
        }


        clearTimeout(
            syncTimer
        );


        syncTimer =
            setTimeout(
                pushSnapshot,
                450
            );
    }


    async function pullRoom() {

        if (
            !roomId ||
            !editKey
        ) {
            return;
        }


        /*
         * Don't redraw while AP Synapse is actively
         * producing a local response.
         */

        if (
            document.getElementById(
                "thinking"
            )
        ) {
            return;
        }


        try {

            const live =
                await apiRequest(
                    `/live-conversations/${encodeURIComponent(roomId)}`
                );


            if (
                Number(
                    live.revision || 0
                ) > revision
                ||
                fingerprint(
                    live.messages
                ) !==
                lastFingerprint
            ) {

                renderRoom(
                    live
                );
            }

        } catch (error) {

            if (
                error.status === 410
            ) {

                toast(
                    "Live conversation sharing has ended."
                );

                stopLocalLiveState();

            } else {

                console.warn(
                    "Live pull:",
                    error
                );
            }
        }
    }


    function startRealtime() {

        const root =
            chat();


        if (
            root &&
            !mutationObserver
        ) {

            mutationObserver =
                new MutationObserver(
                    schedulePush
                );


            mutationObserver.observe(
                root,
                {
                    childList:true,
                    subtree:true,
                    characterData:true
                }
            );
        }


        clearInterval(
            pollingTimer
        );


        pollingTimer =
            setInterval(
                pullRoom,
                1100
            );
    }


    function stopRealtime() {

        clearInterval(
            pollingTimer
        );

        pollingTimer =
            null;


        clearTimeout(
            syncTimer
        );

        syncTimer =
            null;


        mutationObserver?.disconnect();

        mutationObserver =
            null;
    }


    function stopLocalLiveState() {

        stopRealtime();


        roomId =
            null;

        editKey =
            null;

        revision =
            0;

        lastFingerprint =
            "";


        window.apLiveRoomId =
            null;

        window.apLiveEditKey =
            null;


        setLiveButton(
            false
        );


        updateModal();
    }


    async function createLiveRoom() {

        const messages =
            serializeConversation();


        if (!messages.length) {

            toast(
                "Start a conversation before sharing it live."
            );

            return;
        }


        const firstUser =
            messages.find(
                item =>
                    item.role === "user"
            );


        const title =
            firstUser
                ? firstUser.content
                    .replace(/\s+/g, " ")
                    .slice(0, 80)
                : "Live AP Synapse Conversation";


        const createButton =
            document.getElementById(
                "apCreateLiveConversation"
            );


        if (createButton) {

            createButton.disabled =
                true;

            createButton.textContent =
                "Creating secure live room…";
        }


        try {

            const result =
                await fetch(
                    API +
                    "/live-conversations",
                    {
                        method:"POST",

                        headers:{
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                title,
                                messages
                            })
                    }
                );


            const payload =
                await result.json();


            if (!result.ok) {

                throw new Error(
                    payload.error ||
                    "Unable to create live room."
                );
            }


            setRoom(
                payload.roomId,
                payload.editKey,
                payload.revision
            );


            lastFingerprint =
                fingerprint(
                    messages
                );


            startRealtime();


            toast(
                "Live conversation ready."
            );


            updateModal();

        } catch (error) {

            console.error(
                "Create live room:",
                error
            );


            toast(
                "Could not create live conversation."
            );

        } finally {

            if (createButton) {

                createButton.disabled =
                    false;

                createButton.textContent =
                    "Start Live Conversation";
            }
        }
    }


    async function joinRoom(
        id,
        key
    ) {

        setRoom(
            id,
            key
        );


        try {

            const live =
                await apiRequest(
                    `/live-conversations/${encodeURIComponent(id)}`
                );


            renderRoom(
                live
            );


            startRealtime();


            showJoinedBanner();


            toast(
                "Joined live AP Synapse conversation."
            );

        } catch (error) {

            console.error(
                "Join live room:",
                error
            );


            stopLocalLiveState();


            toast(
                "This live conversation is unavailable."
            );
        }
    }


    function showJoinedBanner() {

        document
            .querySelector(
                ".ap-live-joined-banner"
            )
            ?.remove();


        const banner =
            document.createElement(
                "div"
            );


        banner.className =
            "ap-live-joined-banner";


        banner.textContent =
            "● LIVE · Shared AP Synapse conversation";


        document.body.appendChild(
            banner
        );


        setTimeout(
            () => banner.remove(),
            4500
        );
    }


    async function copyLink() {

        const url =
            buildShareURL();


        if (!url) {
            return;
        }


        try {

            await navigator
                .clipboard
                .writeText(
                    url
                );


            toast(
                "Live conversation link copied."
            );

        } catch {

            const input =
                document.getElementById(
                    "apLiveShareURL"
                );


            input?.select();


            document.execCommand(
                "copy"
            );


            toast(
                "Live conversation link copied."
            );
        }
    }


    async function nativeShare() {

        const url =
            buildShareURL();


        if (!url) {
            return;
        }


        if (
            navigator.share
        ) {

            try {

                await navigator.share({
                    title:
                        "Live AP Synapse Conversation",

                    text:
                        "Join this live AP Synapse conversation.",

                    url
                });

                return;

            } catch {}
        }


        await copyLink();
    }


    async function stopSharing() {

        if (
            !roomId ||
            !editKey
        ) {
            return;
        }


        if (
            !confirm(
                "Stop this live conversation? The shared link will stop working."
            )
        ) {
            return;
        }


        try {

            await apiRequest(
                `/live-conversations/${encodeURIComponent(roomId)}`,
                {
                    method:"DELETE"
                }
            );


            stopLocalLiveState();


            toast(
                "Live sharing stopped."
            );

        } catch (error) {

            console.error(
                "Stop live sharing:",
                error
            );


            toast(
                "Could not stop sharing."
            );
        }
    }


    function buildModal() {

        if (
            document.getElementById(
                "apLiveShareBackdrop"
            )
        ) {
            return;
        }


        const backdrop =
            document.createElement(
                "div"
            );


        backdrop.id =
            "apLiveShareBackdrop";


        backdrop.className =
            "ap-live-share-backdrop";


        backdrop.innerHTML = `
            <section
                class="ap-live-share-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="apLiveShareTitle"
            >
                <header class="ap-live-share-head">

                    <div>
                        <div class="ap-live-share-kicker">
                            AP SYNAPSE COLLABORATION
                        </div>

                        <h2
                            id="apLiveShareTitle"
                            class="ap-live-share-title"
                        >
                            Share conversation
                        </h2>

                        <p class="ap-live-share-sub">
                            Open one conversation across multiple devices
                            and continue it together.
                        </p>
                    </div>

                    <button
                        id="apCloseLiveShare"
                        class="ap-live-share-close"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </header>

                <div class="ap-live-share-body">

                    <div
                        id="apLiveCreateBox"
                        class="ap-live-create-box"
                    >
                        <div class="ap-live-option">

                            <div class="ap-live-option-top">
                                <span class="ap-live-dot"></span>

                                <strong>
                                    Live AP Synapse Conversation
                                </strong>
                            </div>

                            <p>
                                Anyone with the secure live link can
                                see this conversation, continue talking
                                to AP Synapse, and see new messages from
                                the other participant.
                            </p>

                            <button
                                id="apCreateLiveConversation"
                                class="ap-live-primary"
                                type="button"
                            >
                                Start Live Conversation
                            </button>

                        </div>
                    </div>


                    <div
                        id="apLiveActiveBox"
                        class="ap-live-active-box"
                    >

                        <div class="ap-live-option">

                            <div class="ap-live-status">
                                <span class="ap-live-dot"></span>
                                LIVE COLLABORATION ACTIVE
                            </div>

                            <p>
                                This link is interactive. Anyone who has
                                it can view and continue the conversation.
                            </p>

                            <div class="ap-live-url-row">

                                <input
                                    id="apLiveShareURL"
                                    class="ap-live-url"
                                    type="text"
                                    readonly
                                    aria-label="Live conversation link"
                                >

                                <button
                                    id="apCopyLiveLink"
                                    class="ap-live-secondary"
                                    type="button"
                                >
                                    Copy Link
                                </button>

                            </div>

                            <div class="ap-live-actions">

                                <button
                                    id="apNativeLiveShare"
                                    class="ap-live-secondary"
                                    type="button"
                                >
                                    Share Link
                                </button>

                                <button
                                    id="apStopLiveShare"
                                    class="ap-live-danger"
                                    type="button"
                                >
                                    Stop Sharing
                                </button>

                            </div>

                            <div class="ap-live-security">
                                The live link contains a private collaboration
                                key. Only send it to people you want to allow
                                into this conversation.
                            </div>

                        </div>
                    </div>

                </div>
            </section>
        `;


        document.body.appendChild(
            backdrop
        );


        backdrop.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    backdrop
                ) {

                    closeModal();
                }
            }
        );


        document
            .getElementById(
                "apCloseLiveShare"
            )
            ?.addEventListener(
                "click",
                closeModal
            );


        document
            .getElementById(
                "apCreateLiveConversation"
            )
            ?.addEventListener(
                "click",
                createLiveRoom
            );


        document
            .getElementById(
                "apCopyLiveLink"
            )
            ?.addEventListener(
                "click",
                copyLink
            );


        document
            .getElementById(
                "apNativeLiveShare"
            )
            ?.addEventListener(
                "click",
                nativeShare
            );


        document
            .getElementById(
                "apStopLiveShare"
            )
            ?.addEventListener(
                "click",
                stopSharing
            );
    }


    function updateModal() {

        const createBox =
            document.getElementById(
                "apLiveCreateBox"
            );


        const activeBox =
            document.getElementById(
                "apLiveActiveBox"
            );


        if (
            !createBox ||
            !activeBox
        ) {
            return;
        }


        const active =
            !!(
                roomId &&
                editKey
            );


        createBox.classList.toggle(
            "ap-hide",
            active
        );


        activeBox.classList.toggle(
            "ap-show",
            active
        );


        const input =
            document.getElementById(
                "apLiveShareURL"
            );


        if (input) {

            input.value =
                active
                    ? buildShareURL()
                    : "";
        }
    }


    function openModal() {

        buildModal();

        updateModal();


        document
            .getElementById(
                "apLiveShareBackdrop"
            )
            ?.classList.add(
                "ap-open"
            );
    }


    function closeModal() {

        document
            .getElementById(
                "apLiveShareBackdrop"
            )
            ?.classList.remove(
                "ap-open"
            );
    }


    /*
     * Capture the existing topbar Share button before any
     * older share handler can run.
     */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest?.(
                    "#shareConversationBtn"
                );


            if (!button) {
                return;
            }


            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            openModal();

        },
        true
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();
            }
        }
    );


    /*
     * JOIN FROM SHARED URL
     */

    async function boot() {

        buildModal();


        const params =
            new URLSearchParams(
                location.search
            );


        const id =
            params.get(
                "live"
            );


        let key =
            params.get(
                "key"
            );


        if (
            id &&
            !key
        ) {

            key =
                sessionStorage.getItem(
                    `ap-live-key:${id}`
                );
        }


        if (
            id &&
            key
        ) {

            sessionStorage.setItem(
                `ap-live-key:${id}`,
                key
            );


            /*
             * Remove the secret capability key from the visible
             * address bar after it has been captured.
             */

            if (
                params.has(
                    "key"
                )
            ) {

                params.delete(
                    "key"
                );


                const cleaned =
                    location.pathname +
                    (
                        params.toString()
                            ? `?${params}`
                            : ""
                    ) +
                    location.hash;


                history.replaceState(
                    null,
                    "",
                    cleaned
                );
            }


            await joinRoom(
                id,
                key
            );
        }


        console.log(
            "✅ AP SYNAPSE — LIVE CONVERSATION SYSTEM READY"
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once:true
            }
        );

    } else {

        boot();
    }

})();

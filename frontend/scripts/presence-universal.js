(() => {

    "use strict";


    const DEVICE_ID_KEY =
        "ap_presence_device_id";

    const DEVICE_NAME_KEY =
        "ap_presence_device_name";

    const HISTORY_KEY =
        "ap_synapse_history";


    const isLocal =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";


    const isPrivateLan =
        /^(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/
            .test(
                location.hostname
            );


    const isDevelopmentHost =
        isLocal ||
        isPrivateLan;


    const API_BASE =
        isDevelopmentHost
            ? `http://${location.hostname}:5000`
            : (
                window.AP_BACKEND_URL ||
                window.API_BASE ||
                "https://api.ap-synapse.com"
            );


    let socket = null;
    let devices = [];
    let reconnectTimer = null;
    let reconnectDelay = 2000;


    function deviceId() {

        let id =
            localStorage.getItem(
                DEVICE_ID_KEY
            );

        if (!id) {

            const uniqueDeviceId =
                typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : (
                        Date.now()
                            .toString(36) +
                        "-" +
                        Math.random()
                            .toString(36)
                            .slice(2) +
                        "-" +
                        Math.random()
                            .toString(36)
                            .slice(2)
                    );

            id =
                "ap-" +
                uniqueDeviceId;

            localStorage.setItem(
                DEVICE_ID_KEY,
                id
            );
        }

        return id;
    }


    function deviceType() {

        const ua =
            navigator.userAgent || "";

        if (
            /iPhone|Android|Mobile/i.test(
                ua
            )
        ) {
            return "phone";
        }

        if (/iPad|Tablet/i.test(ua)) {
            return "tablet";
        }

        return "computer";
    }


    function defaultDeviceName() {

        const ua =
            navigator.userAgent || "";

        if (/iPhone/i.test(ua)) {
            return "iPhone";
        }

        if (/Android/i.test(ua)) {
            return "Android Phone";
        }

        if (/Windows/i.test(ua)) {
            return "Windows Computer";
        }

        if (/Macintosh|Mac OS/i.test(ua)) {
            return "Mac";
        }

        return "AP Synapse Device";
    }


    function deviceName() {

        let value =
            localStorage.getItem(
                DEVICE_NAME_KEY
            );

        if (!value) {

            value =
                defaultDeviceName();

            localStorage.setItem(
                DEVICE_NAME_KEY,
                value
            );
        }

        return value;
    }


    function capabilities() {

        const result = [];

        if (
            navigator.mediaDevices
                ?.getUserMedia
        ) {

            result.push(
                "microphone",
                "camera"
            );
        }

        if (
            "Notification" in window
        ) {

            result.push(
                "notifications"
            );
        }

        if (
            "speechSynthesis" in window
        ) {

            result.push(
                "speaker"
            );
        }

        if (
            deviceType() === "phone"
        ) {

            result.push(
                "mobility"
            );
        }
        else {

            result.push(
                "keyboard",
                "large-screen",
                "code-studio"
            );
        }

        return result;
    }


    function escapeHTML(value) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(value || "");

        return div.innerHTML;
    }


    function setState(state) {

        document.documentElement
            .setAttribute(
                "data-ap-presence-state",
                state
            );

        window.dispatchEvent(
            new CustomEvent(
                "ap-presence-state",
                {
                    detail: {
                        state
                    }
                }
            )
        );
    }


    function toast(message) {

        let element =
            document.getElementById(
                "apPresenceToast"
            );

        if (!element) {

            element =
                document.createElement(
                    "div"
                );

            element.id =
                "apPresenceToast";

            element.className =
                "ap-presence-toast";

            document.body.appendChild(
                element
            );
        }

        element.textContent =
            message;

        element.classList.add(
            "show"
        );

        clearTimeout(
            element.__timer
        );

        element.__timer =
            setTimeout(
                () => {
                    element.classList.remove(
                        "show"
                    );
                },
                3200
            );
    }


    function send(payload) {

        if (
            socket?.readyState ===
            WebSocket.OPEN
        ) {

            socket.send(
                JSON.stringify(
                    payload
                )
            );

            return true;
        }

        return false;
    }


    async function getTicket() {

        const response =
            await fetch(
                `${API_BASE}/presence/ticket`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(
                            isDevelopmentHost
                                ? {
                                    "x-ap-presence-local-user":
                                        "ap-presence-v1-test"
                                }
                                : {}
                        )
                    }
                }
            );


        if (
            response.status === 401
        ) {

            return null;
        }


        if (!response.ok) {

            throw new Error(
                `Presence ticket failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        return data?.ticket || null;
    }


    function currentConversation() {

        const currentId =
            window.currentConversationId;

        if (!currentId) {
            return null;
        }


        try {

            const history =
                JSON.parse(
                    localStorage.getItem(
                        HISTORY_KEY
                    ) ||
                    "[]"
                );


            const conversation =
                history.find(
                    item =>
                        String(item?.id) ===
                        String(currentId)
                );


            if (!conversation) {
                return null;
            }


            const copy =
                JSON.parse(
                    JSON.stringify(
                        conversation
                    )
                );


            if (
                Array.isArray(
                    copy.messages
                )
            ) {

                copy.messages =
                    copy.messages
                        .slice(-60)
                        .map(message => ({
                            ...message,

                            content:
                                typeof message?.content ===
                                "string"
                                    ?
                                    message.content.slice(
                                        0,
                                        30000
                                    )
                                    :
                                    message?.content
                        }));
            }


            return copy;
        }
        catch {

            return null;
        }
    }


    function captureState() {

        return {

            version: 1,

            conversationId:
                window.currentConversationId ||
                null,

            conversation:
                currentConversation(),

            workspace:
                document.body
                    ?.dataset
                    ?.workspace ||
                "assistant",

            path:
                location.pathname +
                location.search +
                location.hash,

            scrollY:
                window.scrollY,

            transferredAt:
                Date.now()
        };
    }


    function mergeConversation(
        conversation
    ) {

        if (
            !conversation?.id
        ) {

            return;
        }


        try {

            const history =
                JSON.parse(
                    localStorage.getItem(
                        HISTORY_KEY
                    ) ||
                    "[]"
                );


            const index =
                history.findIndex(
                    item =>
                        String(item?.id) ===
                        String(
                            conversation.id
                        )
                );


            if (index >= 0) {

                history[index] =
                    conversation;
            }
            else {

                history.unshift(
                    conversation
                );
            }


            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(
                    history
                )
            );
        }
        catch (error) {

            console.error(
                "Presence history merge failed:",
                error
            );
        }
    }


    async function applyState(
        state
    ) {

        if (!state) return;


        if (
            state.conversation
        ) {

            mergeConversation(
                state.conversation
            );
        }


        if (
            state.conversationId
        ) {

            window.currentConversationId =
                state.conversationId;


            if (
                typeof
                window.setActiveConversation ===
                "function"
            ) {

                window.setActiveConversation(
                    state.conversationId
                );
            }


            if (
                typeof
                window.renderHistory ===
                "function"
            ) {

                window.renderHistory();
            }


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        150
                    )
            );


            if (
                typeof
                window.AP_OPEN_SAVED_CONVERSATION ===
                "function"
            ) {

                window.AP_OPEN_SAVED_CONVERSATION(
                    state.conversationId
                );
            }
            else {

                const item =
                    document.querySelector(
                        `.history-item[data-conversation-id="${CSS.escape(
                            String(
                                state.conversationId
                            )
                        )}"]`
                    );

                item?.click();
            }
        }


        if (
            Number.isFinite(
                Number(
                    state.scrollY
                )
            )
        ) {

            setTimeout(
                () => {

                    window.scrollTo({
                        top:
                            Number(
                                state.scrollY
                            ),
                        behavior:
                            "smooth"
                    });
                },
                350
            );
        }
    }


    async function requestHandoff(
        targetDeviceId
    ) {

        if (
            !window.currentConversationId
        ) {

            toast(
                "Open a conversation first."
            );

            return;
        }


        setState(
            "transferring"
        );


        const sent =
            send({
                type:
                    "handoff:request",

                targetDeviceId,

                state:
                    captureState()
            });


        if (!sent) {

            setState(
                "offline"
            );

            toast(
                "Presence is reconnecting."
            );
        }
    }


    async function incomingHandoff(
        message
    ) {

        setState(
            "receiving"
        );


        await applyState(
            message.state
        );


        send({
            type:
                "handoff:accepted",

            handoffId:
                message.handoffId,

            sourceDeviceId:
                message.fromDevice
                    ?.deviceId
        });


        setState(
            "active"
        );


        toast(
            `Presence continued from ${
                message.fromDevice
                    ?.deviceName ||
                "another device"
            }`
        );


        window.dispatchEvent(
            new CustomEvent(
                "ap-presence-handoff",
                {
                    detail:
                        message
                }
            )
        );
    }


    async function connect() {

        clearTimeout(
            reconnectTimer
        );


        setState(
            "connecting"
        );


        let ticket;

        try {

            ticket =
                await getTicket();
        }
        catch (error) {

            console.warn(
                "Presence ticket error:",
                error
            );

            scheduleReconnect();
            return;
        }


        if (!ticket) {

            setState(
                "signed-out"
            );

            renderDevices();

            return;
        }


        const wsBase =
            API_BASE.replace(
                /^http/,
                "ws"
            );


        const params =
            new URLSearchParams({
                ticket,
                deviceId:
                    deviceId(),
                deviceName:
                    deviceName(),
                deviceType:
                    deviceType()
            });


        socket =
            new WebSocket(
                `${wsBase}/presence/ws?${params}`
            );


        socket.addEventListener(
            "open",

            () => {

                reconnectDelay =
                    2000;

                setState(
                    "active"
                );


                send({
                    type:
                        "presence:capabilities",

                    capabilities:
                        capabilities()
                });


                console.log(
                    "⚡ AP Synapse Presence connected"
                );
            }
        );


        socket.addEventListener(
            "message",

            async event => {

                let message;

                try {

                    message =
                        JSON.parse(
                            event.data
                        );
                }
                catch {

                    return;
                }


                switch (
                    message?.type
                ) {


                    case "presence:devices":

                        devices =
                            message.devices ||
                            [];

                        renderDevices();

                        window.dispatchEvent(
                            new CustomEvent(
                                "ap-presence-devices",
                                {
                                    detail: {
                                        devices
                                    }
                                }
                            )
                        );

                        break;


                    case "handoff:incoming":

                        await incomingHandoff(
                            message
                        );

                        break;


                    case "handoff:sent":

                        toast(
                            "Moving Presence..."
                        );

                        break;


                    case "handoff:complete":

                        setState(
                            "active"
                        );

                        toast(
                            `Presence moved to ${
                                message.acceptedBy
                                    ?.deviceName ||
                                "your device"
                            }`
                        );

                        break;


                    case "handoff:error":

                        setState(
                            "active"
                        );

                        toast(
                            message.error ||
                            "Handoff failed."
                        );

                        break;


                    case "presence:event":

                        if (
                            message.event
                        ) {

                            setState(
                                message.event
                            );
                        }

                        break;
                }
            }
        );


        socket.addEventListener(
            "close",

            () => {

                socket = null;

                setState(
                    "offline"
                );

                scheduleReconnect();
            }
        );


        socket.addEventListener(
            "error",

            () => {

                setState(
                    "error"
                );
            }
        );
    }


    function scheduleReconnect() {

        clearTimeout(
            reconnectTimer
        );


        reconnectTimer =
            setTimeout(
                connect,
                reconnectDelay
            );


        reconnectDelay =
            Math.min(
                reconnectDelay * 1.7,
                30000
            );
    }


    setInterval(
        () => {

            send({
                type:
                    "presence:heartbeat"
            });

        },
        25000
    );


    function createUI() {

        if (
            document.getElementById(
                "apPresenceButton"
            )
        ) {

            return;
        }


        const button =
            document.createElement(
                "button"
            );

        button.id =
            "apPresenceButton";

        button.className =
            "ap-presence-button";

        button.innerHTML = `
            <span class="ap-presence-orb"></span>
            <span>Presence</span>
        `;


        const panel =
            document.createElement(
                "aside"
            );

        panel.id =
            "apPresencePanel";

        panel.className =
            "ap-presence-panel";

        panel.innerHTML = `
            <div class="ap-presence-head">

                <div>
                    <small>
                        AP SYNAPSE
                    </small>

                    <h2>
                        Presence
                    </h2>

                    <p>
                        One intelligence.
                        Every device.
                    </p>
                </div>

                <button
                    id="apPresenceClose"
                    type="button"
                >
                    ×
                </button>

            </div>

            <div
                id="apPresenceThisDevice"
                class="ap-presence-this-device"
            ></div>

            <div class="ap-presence-label">
                YOUR DEVICE MESH
            </div>

            <div
                id="apPresenceDevices"
                class="ap-presence-devices"
            ></div>

            <div class="ap-presence-privacy">
                Your Presence Mesh is private
                to your signed-in AP Synapse account.
            </div>
        `;


        document.body.appendChild(
            button
        );

        document.body.appendChild(
            panel
        );


        button.addEventListener(
            "click",

            () => {

                panel.classList.toggle(
                    "open"
                );

                renderDevices();
            }
        );


        panel
            .querySelector(
                "#apPresenceClose"
            )
            .addEventListener(
                "click",

                () => {

                    panel.classList.remove(
                        "open"
                    );
                }
            );
    }


    function renderDevices() {

        createUI();


        const here =
            document.getElementById(
                "apPresenceThisDevice"
            );

        const list =
            document.getElementById(
                "apPresenceDevices"
            );


        if (!here || !list) {
            return;
        }


        const state =
            document.documentElement
                .getAttribute(
                    "data-ap-presence-state"
                );


        if (
            state === "signed-out"
        ) {

            here.innerHTML = `
                <div>
                    <strong>
                        Sign in to activate Presence
                    </strong>

                    <span>
                        Your devices will connect
                        automatically after sign-in.
                    </span>
                </div>
            `;

            list.innerHTML = "";

            return;
        }


        here.innerHTML = `
            <span class="ap-device-symbol">
                ◉
            </span>

            <div>
                <strong>
                    ${escapeHTML(
                        deviceName()
                    )}
                </strong>

                <span>
                    Current Presence
                </span>
            </div>
        `;


        list.innerHTML = "";


        const others =
            devices.filter(
                item =>
                    item.deviceId !==
                    deviceId()
            );


        if (!others.length) {

            list.innerHTML = `
                <div class="ap-presence-empty">
                    Open AP Synapse on another
                    signed-in device and it will
                    appear here automatically.
                </div>
            `;

            return;
        }


        for (
            const device
            of others
        ) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "ap-presence-device";


            card.innerHTML = `
                <span class="ap-device-symbol">
                    ${
                        device.deviceType ===
                        "phone"
                            ?
                            "▯"
                            :
                            "▱"
                    }
                </span>

                <div class="ap-device-copy">

                    <strong>
                        ${escapeHTML(
                            device.deviceName
                        )}
                    </strong>

                    <span>
                        ● Online
                    </span>

                    <small>
                        ${
                            (
                                device.capabilities ||
                                []
                            )
                            .slice(0, 4)
                            .map(
                                escapeHTML
                            )
                            .join(" · ")
                        }
                    </small>

                </div>

                <button
                    type="button"
                    class="ap-presence-move"
                >
                    Continue here
                </button>
            `;


            card
                .querySelector(
                    ".ap-presence-move"
                )
                .addEventListener(
                    "click",

                    () => {

                        requestHandoff(
                            device.deviceId
                        );
                    }
                );


            list.appendChild(
                card
            );
        }
    }


    function renameDevice(
        name
    ) {

        const cleaned =
            String(name || "")
                .trim()
                .slice(0, 80);


        if (!cleaned) return;


        localStorage.setItem(
            DEVICE_NAME_KEY,
            cleaned
        );


        socket?.close(
            4000,
            "Device renamed"
        );
    }


    window.APSynapsePresence = {

        connect,

        getDevices:
            () => [...devices],

        getDeviceId:
            deviceId,

        getDeviceName:
            deviceName,

        renameDevice,

        requestHandoff,

        setState,

        emit(
            event
        ) {

            return send({
                type:
                    "presence:event",

                event
            });
        }
    };


    window.addEventListener(
        "ap-personalization-auth-changed",

        () => {

            socket?.close();

            clearTimeout(
                reconnectTimer
            );

            setTimeout(
                connect,
                300
            );
        }
    );


    function start() {

        createUI();

        connect();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );
    }
    else {

        start();
    }

})();
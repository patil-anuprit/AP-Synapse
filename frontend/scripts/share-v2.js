(() => {
    "use strict";

    const LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
    const API = LOCAL ? "http://localhost:5000/share-v2" : "https://api.ap-synapse.com/share-v2";
    const ORIGIN = LOCAL ? location.origin + location.pathname : "https://ap-synapse.com/";

    // Live/fork rooms must use one shared AP Synapse backend session.
    const AP_NATIVE_FETCH = window.fetch.bind(window);
    window.fetch = function(inputValue, init = {}) {
        const url = typeof inputValue === "string" ? inputValue : (inputValue?.url || "");
        if (window.AP_SHARE_SESSION_ID && /\/chat(?:\?|$)/.test(url)) {
            const headers = new Headers(init.headers || (inputValue instanceof Request ? inputValue.headers : undefined));
            headers.set("x-session-id", window.AP_SHARE_SESSION_ID);
            return AP_NATIVE_FETCH(inputValue, { ...init, headers });
        }
        return AP_NATIVE_FETCH(inputValue, init);
    };

    const state = {
        roomId: null,
        key: null,
        guestKey: null,
        role: null,
        permission: null,
        revision: 0,
        messages: [],
        locked: false,
        approvalRequired: false,
        expiresAt: null,
        participantCount: 1,
        suppress: false,
        polling: null,
        presence: null,
        observer: null,
        typingTimer: null,
        waitingTimer: null,
        lastFingerprint: ""
    };

    const participantId = (() => {
        let value = localStorage.getItem("apShareParticipantId");
        if (!value) {
            value = crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem("apShareParticipantId", value);
        }
        return value;
    })();

    const displayName = (() => {
        let value = localStorage.getItem("apShareDisplayName");
        if (!value) {
            value = `Guest ${participantId.slice(0, 4).toUpperCase()}`;
            localStorage.setItem("apShareDisplayName", value);
        }
        return value;
    })();

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const chat = () => document.getElementById("chatWindow");
    const input = () => document.getElementById("userInput") || document.getElementById("messageInput") || document.getElementById("chatInput");
    const send = () => document.getElementById("sendBtn");
    const shareButton = () => document.getElementById("shareConversationBtn");

    function toast(text) {
        if (typeof window.showToast === "function") return window.showToast(text);
        const node = document.createElement("div");
        node.className = "toast ap-share-toast";
        node.textContent = text;
        document.body.appendChild(node);
        setTimeout(() => node.remove(), 2600);
    }

    function uid() {
        return crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function sanitizeText(value) {
        return String(value || "").replace(/\u0000/g, "").trim();
    }

    function extractText(element) {
        const body = element.querySelector(".message-body,.message-content,.response-content,.ap-response-body,.markdown-body") || element;
        const clone = body.cloneNode(true);
        clone.querySelectorAll(".message-actions,.ap-response-actions,.ap-final-response-actions,button,script,style,textarea,input").forEach(n => n.remove());
        clone.querySelectorAll("a[href]").forEach(a => {
            const label = (a.textContent || a.href).trim();
            a.replaceWith(document.createTextNode(`[${label}](${a.href})`));
        });
        clone.querySelectorAll("img[src]").forEach(img => img.replaceWith(document.createTextNode(`[Image](${img.src})`)));
        return sanitizeText(clone.innerText || clone.textContent || "").replace(/\n{4,}/g, "\n\n\n");
    }

    function messageElements() {
        const root = chat();
        if (!root) return [];
        let nodes = [...root.children].filter(el => el.matches?.(".message.user,.message.ai,.user-message,.assistant-message,.ai-message,.bot-message"));
        if (!nodes.length) nodes = $$(".message.user,.message.ai,.user-message,.assistant-message,.ai-message,.bot-message", root);
        return nodes.filter((el, i, arr) => !arr.some(other => other !== el && other.contains(el)));
    }

    function serializeConversation(selectedIds = null) {
        return messageElements().map(element => {
            if (!element.dataset.apShareMessageId) element.dataset.apShareMessageId = uid();
            if (!element.dataset.apShareCreatedAt) element.dataset.apShareCreatedAt = new Date().toISOString();
            if (selectedIds && !selectedIds.has(element.dataset.apShareMessageId)) return null;
            const user = element.classList.contains("user") || element.classList.contains("user-message");
            const content = extractText(element);
            if (!content) return null;
            return {
                id: element.dataset.apShareMessageId,
                role: user ? "user" : "assistant",
                content,
                author: user ? displayName : "AP Synapse",
                createdAt: element.dataset.apShareCreatedAt
            };
        }).filter(Boolean);
    }

    function fingerprint(messages) {
        return JSON.stringify((messages || []).map(m => [m.id, m.role, m.content]));
    }

    function escapeHTML(value) {
        return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function markdownNode(text) {
        const box = document.createElement("div");
        const safe = escapeHTML(text);
        if (window.marked?.parse) box.innerHTML = window.marked.parse(safe, { gfm: true, breaks: true });
        else box.textContent = text;
        box.querySelectorAll("a[href]").forEach(a => {
            try {
                const url = new URL(a.href, location.href);
                if (!["http:", "https:"].includes(url.protocol)) throw new Error();
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            } catch { a.replaceWith(document.createTextNode(a.textContent || "link")); }
        });
        box.querySelectorAll("img").forEach(img => {
            const a = document.createElement("a");
            a.href = img.src;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = "Open shared image";
            img.replaceWith(a);
        });
        return box;
    }

    function createMessage(item) {
        const wrapper = document.createElement("div");
        wrapper.className = item.role === "user"
            ? "message user user-message ap-share-rendered"
            : "message ai assistant-message ap-share-rendered";
        wrapper.dataset.apShareMessageId = item.id;
        wrapper.dataset.apShareCreatedAt = item.createdAt;

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = item.role === "user" ? "U" : "AP";

        const body = document.createElement("div");
        body.className = "message-body message-content";
        const rendered = markdownNode(item.content);
        while (rendered.firstChild) body.appendChild(rendered.firstChild);
        wrapper.append(avatar, body);
        return wrapper;
    }

    function enterChatMode() {
        document.body.classList.add("chat-active");
        const hero = document.getElementById("heroScreen");
        if (hero) {
            hero.style.setProperty("display", "none", "important");
            hero.style.setProperty("visibility", "hidden", "important");
        }
        const assistant = document.getElementById("assistantPage");
        if (assistant) assistant.style.setProperty("display", "block", "important");
        const root = chat();
        if (root) {
            root.style.setProperty("display", "flex", "important");
            root.style.setProperty("visibility", "visible", "important");
        }
    }

    function renderMessages(messages) {
        const root = chat();
        if (!root) return;
        const next = fingerprint(messages);
        if (next === state.lastFingerprint) return;
        const oldScroll = root.scrollTop;
        state.suppress = true;
        root.innerHTML = "";
        messages.forEach(item => root.appendChild(createMessage(item)));
        root.scrollTop = oldScroll;
        state.messages = messages;
        state.lastFingerprint = next;
        enterChatMode();
        requestAnimationFrame(() => { state.suppress = false; });
    }

    function setComposerAccess(mode, locked = false, snapshot = false) {
        const field = input();
        const button = send();
        const blocked = snapshot || (state.role !== "owner" && (locked || mode === "view"));
        if (field) {
            field.disabled = blocked;
            field.dataset.apShareOriginalPlaceholder ||= field.placeholder || "Ask AP Synapse anything...";
            field.placeholder = blocked
                ? (snapshot ? "Read-only snapshot" : locked ? "Conversation locked by owner" : "View-only shared conversation")
                : field.dataset.apShareOriginalPlaceholder;
        }
        if (button) button.disabled = blocked;
        document.body.classList.toggle("ap-share-readonly", blocked);
    }

    async function api(path, options = {}, key = state.key) {
        const headers = new Headers(options.headers || {});
        if (key) headers.set("x-share-key", key);
        headers.set("x-participant-id", participantId);
        const response = await fetch(API + path, { ...options, headers });
        let data = {};
        try { data = await response.json(); } catch {}
        if (!response.ok) {
            const error = new Error(data.error || `Request failed (${response.status})`);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    }

    function publicURL(kind, id, key) {
        const url = new URL(ORIGIN, location.href);
        url.searchParams.set(kind, id);
        url.searchParams.set("key", key);
        return url.href;
    }

    function liveURL() {
        return state.roomId && state.guestKey ? publicURL("live", state.roomId, state.guestKey) : "";
    }

    function removeSecretFromAddress() {
        const params = new URLSearchParams(location.search);
        params.delete("key");
        history.replaceState(null, "", location.pathname + (params.toString() ? `?${params}` : "") + location.hash);
    }

    function saveOwnerState() {
        if (state.role !== "owner") return;
        sessionStorage.setItem("apShareOwnerState", JSON.stringify({
            roomId: state.roomId,
            ownerKey: state.key,
            guestKey: state.guestKey
        }));
    }

    function clearRoomState() {
        stopRealtime();
        state.roomId = state.key = state.guestKey = state.role = state.permission = null;
        state.revision = 0;
        state.messages = [];
        state.locked = false;
        state.approvalRequired = false;
        state.lastFingerprint = "";
        window.AP_SHARE_SESSION_ID = null;
        const btn = shareButton();
        btn?.classList.remove("ap-share-live", "ap-share-request");
        if (btn) btn.title = "Share conversation";
        setComposerAccess("collaborate", false, false);
    }

    function updateTopbarLive(participants = state.participantCount) {
        const btn = shareButton();
        if (!btn || !state.roomId) return;
        btn.classList.add("ap-share-live");
        btn.title = `Live conversation · ${participants} participant${participants === 1 ? "" : "s"}`;
        const spans = btn.querySelectorAll("span");
        const last = spans[spans.length - 1];
        if (last) last.textContent = `Live · ${participants}`;
    }

    async function joinRoom(roomId, key, roleHint = "guest") {
        state.roomId = roomId;
        state.key = key;
        window.AP_SHARE_SESSION_ID = `live:${roomId}`;

        const attempt = async () => {
            const response = await fetch(`${API}/rooms/${encodeURIComponent(roomId)}/join`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-share-key": key,
                    "x-participant-id": participantId
                },
                body: JSON.stringify({ name: roleHint === "owner" ? "Owner" : displayName })
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 202 && data.needsApproval) {
                showWaitingApproval();
                clearTimeout(state.waitingTimer);
                state.waitingTimer = setTimeout(attempt, 1800);
                return;
            }
            if (!response.ok) throw new Error(data.error || "Unable to join shared conversation.");

            hideWaitingApproval();
            state.role = data.role;
            state.permission = data.participantPermission || data.permission;
            state.revision = Number(data.revision || 1);
            state.locked = !!data.locked;
            state.approvalRequired = !!data.approvalRequired;
            state.expiresAt = data.expiresAt;
            state.messages = data.messages || [];
            state.lastFingerprint = "";
            renderMessages(state.messages);
            setComposerAccess(state.permission, state.locked, false);
            updateTopbarLive();
            startRealtime();
            if (state.role === "owner") saveOwnerState();
            toast(state.role === "owner" ? "Live conversation restored." : "Joined live AP Synapse conversation.");
        };

        try { await attempt(); }
        catch (error) {
            console.error("AP Share join:", error);
            hideWaitingApproval();
            clearRoomState();
            toast(error.message);
        }
    }

    function showWaitingApproval() {
        let box = document.getElementById("apShareWaiting");
        if (!box) {
            box = document.createElement("div");
            box.id = "apShareWaiting";
            box.className = "ap-share-waiting";
            box.innerHTML = `<div class="ap-share-pulse"></div><strong>Waiting for owner approval</strong><span>This conversation requires approval before you can enter.</span>`;
            document.body.appendChild(box);
        }
    }
    function hideWaitingApproval() { document.getElementById("apShareWaiting")?.remove(); }

    function observeConversation() {
        const root = chat();
        if (!root || state.observer) return;
        state.observer = new MutationObserver(() => {
            if (state.suppress || !state.roomId || state.role === "guest" && (state.permission === "view" || state.locked)) return;
            clearTimeout(state.syncTimer);
            state.syncTimer = setTimeout(pushRoom, 500);
        });
        state.observer.observe(root, { childList: true, subtree: true, characterData: true });
    }

    async function pushRoom() {
        if (!state.roomId || state.suppress) return;
        try {
            const messages = serializeConversation();
            const result = await api(`/rooms/${encodeURIComponent(state.roomId)}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages })
            });
            state.revision = Number(result.revision || state.revision);
            state.messages = result.messages || messages;
            state.lastFingerprint = fingerprint(state.messages);
        } catch (error) {
            if (![403, 410].includes(error.status)) console.warn("Live sync:", error);
        }
    }

    async function pullRoom() {
        if (!state.roomId || !state.key || document.getElementById("thinking")) return;
        try {
            const room = await api(`/rooms/${encodeURIComponent(state.roomId)}`);
            state.permission = room.participantPermission || state.permission;
            state.locked = !!room.locked;
            setComposerAccess(state.permission, state.locked, false);
            if (Number(room.revision || 0) > state.revision || fingerprint(room.messages) !== state.lastFingerprint) {
                state.revision = Number(room.revision || state.revision);
                renderMessages(room.messages || []);
            }
        } catch (error) {
            if ([403, 410].includes(error.status)) {
                toast(error.message);
                clearRoomState();
            }
        }
    }

    async function heartbeat() {
        if (!state.roomId) return;
        try {
            const typing = !!input()?.dataset.apShareTyping;
            const thinking = !!document.getElementById("thinking");
            await api(`/rooms/${encodeURIComponent(state.roomId)}/presence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: state.role === "owner" ? "Owner" : displayName, typing, thinking })
            });
            if (state.role === "owner") await ownerPulse();
        } catch {}
    }

    async function ownerPulse() {
        try {
            const [participants, joins] = await Promise.all([
                api(`/rooms/${encodeURIComponent(state.roomId)}/participants`),
                api(`/rooms/${encodeURIComponent(state.roomId)}/join-requests`)
            ]);
            const online = (participants.participants || []).filter(p => p.online);
            state.participantCount = Math.max(1, online.length);
            updateTopbarLive(state.participantCount);
            const pending = joins.requests || [];
            const btn = shareButton();
            btn?.classList.toggle("ap-share-request", pending.length > 0);
            if (pending.length) btn.title = `${pending.length} join request${pending.length === 1 ? "" : "s"} waiting`;
            const typing = online.filter(p => p.typing && p.participant_id !== participantId).map(p => p.display_name);
            const thinking = online.some(p => p.thinking && p.participant_id !== participantId);
            showPresenceHint(typing, thinking);
        } catch {}
    }

    function showPresenceHint(typingNames, thinking) {
        let hint = document.getElementById("apSharePresenceHint");
        const text = typingNames.length ? `${typingNames[0]} is typing…` : thinking ? "AP Synapse is responding for another participant…" : "";
        if (!text) { hint?.remove(); return; }
        if (!hint) {
            hint = document.createElement("div");
            hint.id = "apSharePresenceHint";
            hint.className = "ap-share-presence-hint";
            document.body.appendChild(hint);
        }
        hint.textContent = text;
    }

    function startRealtime() {
        observeConversation();
        clearInterval(state.polling);
        clearInterval(state.presence);
        state.polling = setInterval(pullRoom, 1100);
        state.presence = setInterval(heartbeat, 8500);
        heartbeat();
    }

    function stopRealtime() {
        clearInterval(state.polling);
        clearInterval(state.presence);
        clearTimeout(state.syncTimer);
        clearTimeout(state.waitingTimer);
        state.polling = state.presence = null;
        state.observer?.disconnect();
        state.observer = null;
        document.getElementById("apSharePresenceHint")?.remove();
    }

    function markTyping() {
        const field = input();
        if (!field || !state.roomId) return;
        field.dataset.apShareTyping = "1";
        clearTimeout(state.typingTimer);
        state.typingTimer = setTimeout(() => { delete field.dataset.apShareTyping; heartbeat(); }, 1200);
    }

    function titleFromMessages(messages) {
        const first = messages.find(m => m.role === "user");
        return (first?.content || "AP Synapse Conversation").replace(/\s+/g, " ").slice(0, 90);
    }

    async function createLive() {
        const messages = serializeConversation();
        if (!messages.length) return toast("Start a conversation before sharing it.");
        const permission = $("#apSharePermission")?.value || "collaborate";
        const expiresIn = $("#apShareExpiry")?.value || "7d";
        const approvalRequired = !!$("#apShareApproval")?.checked;
        setBusy(true, "Creating live room…");
        try {
            const result = await api("/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: titleFromMessages(messages), messages, permission, expiresIn, approvalRequired })
            }, null);
            state.roomId = result.roomId;
            state.key = result.ownerKey;
            state.guestKey = result.guestKey;
            state.role = "owner";
            state.permission = "owner";
            state.revision = result.revision;
            state.approvalRequired = result.approvalRequired;
            state.expiresAt = result.expiresAt;
            state.messages = messages;
            state.lastFingerprint = fingerprint(messages);
            window.AP_SHARE_SESSION_ID = `live:${state.roomId}`;
            saveOwnerState();
            startRealtime();
            renderModal();
            toast("Live conversation is ready.");
        } catch (error) { toast(error.message); }
        finally { setBusy(false); }
    }

    async function createSnapshot(selectedIds = null) {
        const messages = serializeConversation(selectedIds);
        if (!messages.length) return toast("Select at least one message.");
        const expiresIn = $("#apSnapshotExpiry")?.value || "30d";
        setBusy(true, "Creating snapshot…");
        try {
            const result = await api("/snapshots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: titleFromMessages(messages), messages, expiresIn })
            }, null);
            const url = publicURL("snapshot", result.snapshotId, result.key);
            showLinkResult("Read-only snapshot", url, "Anyone with this link can read this frozen copy. Future changes are not included.");
        } catch (error) { toast(error.message); }
        finally { setBusy(false); }
    }

    function showSelectedPicker() {
        const messages = serializeConversation();
        const dynamic = $("#apShareDynamic");
        if (!dynamic) return;
        dynamic.innerHTML = `
            <div class="ap-share-section-head"><strong>Select messages</strong><button class="ap-share-mini" data-action="back">Back</button></div>
            <div class="ap-share-select-list">
                ${messages.map((m, i) => `<label class="ap-share-select-item"><input type="checkbox" value="${escapeHTML(m.id)}" checked><span><b>${m.role === "user" ? "You" : "AP Synapse"}</b><small>${escapeHTML(m.content.slice(0, 150))}</small></span></label>`).join("")}
            </div>
            <div class="ap-share-row"><select id="apSnapshotExpiry" class="ap-share-control"><option value="24h">24 hours</option><option value="7d">7 days</option><option value="30d" selected>30 days</option><option value="never">Never</option></select><button class="ap-share-primary" data-action="create-selected">Create selected snapshot</button></div>
        `;
    }

    async function showQR(url) {
        const target = $("#apShareQR");
        if (!target) return;
        target.innerHTML = "";
        target.classList.add("ap-open");
        try {
            if (!window.QRCode) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            new window.QRCode(target, { text: url, width: 180, height: 180, correctLevel: window.QRCode.CorrectLevel.M });
        } catch {
            target.textContent = "QR generation unavailable. Use Copy Link instead.";
        }
    }

    async function copyText(text, message = "Copied.") {
        try { await navigator.clipboard.writeText(text); }
        catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        }
        toast(message);
    }

    async function nativeShare(url) {
        if (navigator.share) {
            try { await navigator.share({ title: "AP Synapse Conversation", text: "Join this AP Synapse conversation.", url }); return; } catch {}
        }
        copyText(url, "Share link copied.");
    }

    function invitationText(url) {
        return `Join this AP Synapse conversation:\n${url}`;
    }

    function showLinkResult(title, url, description) {
        const dynamic = $("#apShareDynamic");
        if (!dynamic) return;
        dynamic.innerHTML = `
            <div class="ap-share-result"><span class="ap-share-live-dot"></span><strong>${escapeHTML(title)}</strong><p>${escapeHTML(description)}</p>
            <div class="ap-share-link-row"><input id="apShareResultURL" class="ap-share-control" readonly value="${escapeHTML(url)}"><button class="ap-share-secondary" data-action="copy-result">Copy</button></div>
            <div class="ap-share-actions"><button class="ap-share-secondary" data-action="share-result">Share</button><button class="ap-share-secondary" data-action="invite-result">Copy invitation</button><button class="ap-share-secondary" data-action="qr-result">QR code</button></div>
            <div id="apShareQR" class="ap-share-qr"></div><button class="ap-share-mini" data-action="back">Back</button></div>`;
        dynamic.dataset.resultUrl = url;
    }

    async function saveSettings() {
        if (state.role !== "owner") return;
        const permission = $("#apManagePermission")?.value || "collaborate";
        const expiresIn = $("#apManageExpiry")?.value || null;
        const approvalRequired = !!$("#apManageApproval")?.checked;
        const locked = !!$("#apManageLock")?.checked;
        try {
            const result = await api(`/rooms/${encodeURIComponent(state.roomId)}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permission, expiresIn, approvalRequired, locked })
            });
            state.locked = result.locked;
            state.approvalRequired = result.approvalRequired;
            state.expiresAt = result.expiresAt;
            toast("Sharing settings updated.");
            renderModal();
        } catch (error) { toast(error.message); }
    }

    async function regenerateLink() {
        if (!confirm("Regenerate the share link? The previous guest link will stop working.")) return;
        try {
            const result = await api(`/rooms/${encodeURIComponent(state.roomId)}/regenerate`, { method: "POST" });
            state.guestKey = result.guestKey;
            saveOwnerState();
            renderModal();
            toast("New secure share link created.");
        } catch (error) { toast(error.message); }
    }

    async function endLive() {
        if (!confirm("End this live conversation? Shared access will stop immediately.")) return;
        try {
            await api(`/rooms/${encodeURIComponent(state.roomId)}`, { method: "DELETE" });
            sessionStorage.removeItem("apShareOwnerState");
            clearRoomState();
            renderModal();
            toast("Live sharing ended.");
        } catch (error) { toast(error.message); }
    }

    async function showParticipants() {
        if (state.role !== "owner") return;
        try {
            const [p, j] = await Promise.all([
                api(`/rooms/${encodeURIComponent(state.roomId)}/participants`),
                api(`/rooms/${encodeURIComponent(state.roomId)}/join-requests`)
            ]);
            const dynamic = $("#apShareDynamic");
            if (!dynamic) return;
            const participants = p.participants || [];
            const requests = j.requests || [];
            dynamic.innerHTML = `
                <div class="ap-share-section-head"><strong>Participants</strong><button class="ap-share-mini" data-action="back">Back</button></div>
                ${requests.length ? `<div class="ap-share-subtitle">JOIN REQUESTS</div>${requests.map(r => `<div class="ap-share-person"><span><i class="ap-share-status pending"></i><b>${escapeHTML(r.display_name)}</b><small>Waiting for approval</small></span><span class="ap-share-inline"><button class="ap-share-mini" data-join="approve" data-request="${r.request_id}">Approve</button><button class="ap-share-mini danger" data-join="deny" data-request="${r.request_id}">Deny</button></span></div>`).join("")}` : ""}
                <div class="ap-share-subtitle">PEOPLE HERE</div>
                ${participants.map(person => `<div class="ap-share-person"><span><i class="ap-share-status ${person.online ? "online" : ""}"></i><b>${escapeHTML(person.display_name)}</b><small>${person.role === "owner" ? "Owner" : person.online ? "Online" : "Offline"}</small></span>${person.role === "owner" ? "" : `<span class="ap-share-inline"><select class="ap-share-mini-select" data-person-permission="${person.participant_id}"><option value="" ${!person.permission_override ? "selected" : ""}>Room default</option><option value="view" ${person.permission_override === "view" ? "selected" : ""}>View</option><option value="continue" ${person.permission_override === "continue" ? "selected" : ""}>Continue</option><option value="collaborate" ${person.permission_override === "collaborate" ? "selected" : ""}>Collaborate</option></select><button class="ap-share-mini danger" data-remove-person="${person.participant_id}">Remove</button></span>`}</div>`).join("") || `<p class="ap-share-muted">No participants yet.</p>`}
            `;
        } catch (error) { toast(error.message); }
    }

    async function participantAction(target) {
        const request = target.dataset.request;
        const decision = target.dataset.join;
        if (request && decision) {
            await api(`/rooms/${encodeURIComponent(state.roomId)}/join-requests/${encodeURIComponent(request)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision })
            });
            return showParticipants();
        }
        const remove = target.dataset.removePerson;
        if (remove) {
            await api(`/rooms/${encodeURIComponent(state.roomId)}/participants/${encodeURIComponent(remove)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "blocked" })
            });
            return showParticipants();
        }
    }

    async function changeParticipantPermission(select) {
        const person = select.dataset.personPermission;
        if (!person) return;
        await api(`/rooms/${encodeURIComponent(state.roomId)}/participants/${encodeURIComponent(person)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "active", permission: select.value || null })
        });
        toast("Participant permission updated.");
    }

    async function showActivity() {
        try {
            const result = await api(`/rooms/${encodeURIComponent(state.roomId)}/events`);
            const dynamic = $("#apShareDynamic");
            if (!dynamic) return;
            dynamic.innerHTML = `<div class="ap-share-section-head"><strong>Activity</strong><button class="ap-share-mini" data-action="back">Back</button></div><div class="ap-share-activity">${(result.events || []).map(e => `<div><i></i><span><b>${escapeHTML(e.text)}</b><small>${new Date(e.at).toLocaleString()}</small></span></div>`).join("") || `<p class="ap-share-muted">No activity yet.</p>`}</div>`;
        } catch (error) { toast(error.message); }
    }

    async function forkPrivately(messages = state.messages) {
        try {
            const result = await api("/fork", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages })
            }, null);
            stopRealtime();
            window.AP_SHARE_SESSION_ID = result.sessionId;
            state.roomId = state.key = state.guestKey = state.role = null;
            const params = new URLSearchParams(location.search);
            params.delete("live"); params.delete("snapshot"); params.delete("key");
            history.replaceState(null, "", location.pathname + (params.toString() ? `?${params}` : "") + location.hash);
            setComposerAccess("collaborate", false, false);
            document.getElementById("apSnapshotBanner")?.remove();
            shareButton()?.classList.remove("ap-share-live");
            closeModal();
            toast("Private continuation created.");
        } catch (error) { toast(error.message); }
    }

    async function loadSnapshot(snapshotId, key) {
        try {
            const snap = await api(`/snapshots/${encodeURIComponent(snapshotId)}`, {}, key);
            state.messages = snap.messages || [];
            renderMessages(state.messages);
            setComposerAccess("view", false, true);
            showSnapshotBanner();
        } catch (error) { toast(error.message); }
    }

    function showSnapshotBanner() {
        let banner = document.getElementById("apSnapshotBanner");
        if (banner) return;
        banner = document.createElement("div");
        banner.id = "apSnapshotBanner";
        banner.className = "ap-snapshot-banner";
        banner.innerHTML = `<span><b>READ-ONLY SNAPSHOT</b><small>This is a frozen copy of an AP Synapse conversation.</small></span><button type="button">Continue privately</button>`;
        banner.querySelector("button").addEventListener("click", () => forkPrivately(state.messages));
        document.body.appendChild(banner);
    }

    function setBusy(on, label = "Working…") {
        const button = $("#apShareMainAction");
        if (!button) return;
        if (on) { button.dataset.original = button.textContent; button.textContent = label; button.disabled = true; }
        else { button.textContent = button.dataset.original || "Start Live Conversation"; button.disabled = false; }
    }

    function buildModal() {
        if (document.getElementById("apShareV2Backdrop")) return;
        const back = document.createElement("div");
        back.id = "apShareV2Backdrop";
        back.className = "ap-share-backdrop";
        back.innerHTML = `<section class="ap-share-panel" role="dialog" aria-modal="true" aria-labelledby="apShareTitle"><header><div><span class="ap-share-kicker">AP SYNAPSE COLLABORATION</span><h2 id="apShareTitle">Share conversation</h2><p>Live collaboration, secure access, snapshots and controlled sharing.</p></div><button class="ap-share-close" data-action="close" aria-label="Close">×</button></header><div id="apShareDynamic" class="ap-share-body"></div></section>`;
        document.body.appendChild(back);
        back.addEventListener("click", e => { if (e.target === back) closeModal(); });
        back.addEventListener("click", handleModalClick);
        back.addEventListener("change", handleModalChange);
    }

    function renderModal() {
        buildModal();
        const dynamic = $("#apShareDynamic");
        if (!dynamic) return;

        if (state.roomId) {
            const url = state.role === "owner" ? liveURL() : "";
            dynamic.innerHTML = `
                <div class="ap-share-live-head"><span class="ap-share-live-dot"></span><div><strong>LIVE CONVERSATION</strong><small>${state.role === "owner" ? "You control this room" : `Access: ${escapeHTML(state.permission || "guest")}`}</small></div></div>
                ${state.role === "owner" ? `<div class="ap-share-link-row"><input id="apLiveURL" class="ap-share-control" readonly value="${escapeHTML(url)}"><button class="ap-share-secondary" data-action="copy-live">Copy</button></div><div class="ap-share-actions"><button class="ap-share-secondary" data-action="native-live">Share</button><button class="ap-share-secondary" data-action="invite-live">Invitation</button><button class="ap-share-secondary" data-action="qr-live">QR</button></div><div id="apShareQR" class="ap-share-qr"></div>` : ""}
                ${state.role === "owner" ? `<div class="ap-share-grid"><label><span>Default permission</span><select id="apManagePermission" class="ap-share-control"><option value="view">Can view</option><option value="continue">Can continue</option><option value="collaborate">Can collaborate</option></select></label><label><span>Expiry</span><select id="apManageExpiry" class="ap-share-control"><option value="1h">1 hour</option><option value="24h">24 hours</option><option value="7d" selected>7 days</option><option value="30d">30 days</option><option value="never">Never</option></select></label></div><label class="ap-share-toggle"><input id="apManageApproval" type="checkbox" ${state.approvalRequired ? "checked" : ""}><span>Ask before someone joins</span></label><label class="ap-share-toggle"><input id="apManageLock" type="checkbox" ${state.locked ? "checked" : ""}><span>Lock conversation to guests</span></label><button class="ap-share-primary" data-action="save-settings">Save access settings</button><div class="ap-share-actions"><button class="ap-share-secondary" data-action="participants">Participants</button><button class="ap-share-secondary" data-action="activity">Activity</button><button class="ap-share-secondary" data-action="regenerate">Regenerate link</button></div><div class="ap-share-actions"><button class="ap-share-secondary" data-action="fork">Continue privately</button><button class="ap-share-danger" data-action="end">End live conversation</button></div>` : `<div class="ap-share-actions"><button class="ap-share-secondary" data-action="fork">Continue privately</button></div>`}
            `;
            const select = $("#apManagePermission");
            if (select && ["view", "continue", "collaborate"].includes(state.permission)) select.value = state.permission;
            return;
        }

        dynamic.innerHTML = `
            <div class="ap-share-card featured"><div class="ap-share-card-title"><span class="ap-share-live-dot"></span><div><strong>Live AP Synapse Conversation</strong><small>Both people see changes and can continue together.</small></div></div><div class="ap-share-grid"><label><span>Permission</span><select id="apSharePermission" class="ap-share-control"><option value="view">Can view</option><option value="continue">Can continue</option><option value="collaborate" selected>Can collaborate</option></select></label><label><span>Expires</span><select id="apShareExpiry" class="ap-share-control"><option value="1h">1 hour</option><option value="24h">24 hours</option><option value="7d" selected>7 days</option><option value="30d">30 days</option><option value="never">Never</option></select></label></div><label class="ap-share-toggle"><input id="apShareApproval" type="checkbox"><span>Ask me before someone joins</span></label><button id="apShareMainAction" class="ap-share-primary" data-action="create-live">Start Live Conversation</button></div>
            <div class="ap-share-card"><div class="ap-share-card-title"><span class="ap-share-icon">◇</span><div><strong>Read-only Snapshot</strong><small>Share a frozen copy that never changes.</small></div></div><div class="ap-share-row"><select id="apSnapshotExpiry" class="ap-share-control"><option value="24h">24 hours</option><option value="7d">7 days</option><option value="30d" selected>30 days</option><option value="never">Never</option></select><button class="ap-share-secondary" data-action="snapshot">Create Snapshot</button></div></div>
            <div class="ap-share-card"><div class="ap-share-card-title"><span class="ap-share-icon">✓</span><div><strong>Selected Messages</strong><small>Choose exactly what is shared.</small></div></div><button class="ap-share-secondary wide" data-action="selected">Select messages</button></div>
        `;
    }

    function openModal() { renderModal(); $("#apShareV2Backdrop")?.classList.add("ap-open"); }
    function closeModal() { $("#apShareV2Backdrop")?.classList.remove("ap-open"); }

    async function handleModalClick(event) {
        const target = event.target.closest("[data-action],[data-join],[data-remove-person]");
        if (!target) return;
        const action = target.dataset.action;
        if (action === "close") return closeModal();
        if (action === "create-live") return createLive();
        if (action === "snapshot") return createSnapshot();
        if (action === "selected") return showSelectedPicker();
        if (action === "back") return renderModal();
        if (action === "create-selected") {
            const ids = new Set($$(".ap-share-select-item input:checked").map(i => i.value));
            return createSnapshot(ids);
        }
        const resultURL = $("#apShareDynamic")?.dataset.resultUrl || "";
        if (action === "copy-result") return copyText(resultURL, "Snapshot link copied.");
        if (action === "share-result") return nativeShare(resultURL);
        if (action === "invite-result") return copyText(invitationText(resultURL), "Invitation copied.");
        if (action === "qr-result") return showQR(resultURL);
        if (action === "copy-live") return copyText(liveURL(), "Live link copied.");
        if (action === "native-live") return nativeShare(liveURL());
        if (action === "invite-live") return copyText(invitationText(liveURL()), "Invitation copied.");
        if (action === "qr-live") return showQR(liveURL());
        if (action === "save-settings") return saveSettings();
        if (action === "participants") return showParticipants();
        if (action === "activity") return showActivity();
        if (action === "regenerate") return regenerateLink();
        if (action === "fork") return forkPrivately(state.messages.length ? state.messages : serializeConversation());
        if (action === "end") return endLive();
        if (target.dataset.join || target.dataset.removePerson) return participantAction(target);
    }

    function handleModalChange(event) {
        const select = event.target.closest("[data-person-permission]");
        if (select) changeParticipantPermission(select).catch(error => toast(error.message));
    }

    function blockUnauthorizedSend(event) {
        if (!state.roomId || state.role === "owner") return;
        if (state.locked || state.permission === "view") {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            toast(state.locked ? "This live conversation is locked." : "This shared conversation is view-only.");
        }
    }

    async function boot() {
        buildModal();

        document.addEventListener("click", event => {
            const btn = event.target.closest?.("#shareConversationBtn");
            if (!btn) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            openModal();
        }, true);

        document.addEventListener("click", event => {
            if (event.target.closest?.("#sendBtn")) blockUnauthorizedSend(event);
        }, true);

        document.addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey && event.target === input()) blockUnauthorizedSend(event);
            if (event.key === "Escape") closeModal();
        }, true);

        document.addEventListener("input", event => {
            if (event.target === input()) markTyping();
        }, true);

        const params = new URLSearchParams(location.search);
        const liveId = params.get("live");
        const snapId = params.get("snapshot");
        let key = params.get("key");

        if (liveId) {
            if (key) sessionStorage.setItem(`apShareGuestKey:${liveId}`, key);
            else key = sessionStorage.getItem(`apShareGuestKey:${liveId}`);
            if (key) {
                removeSecretFromAddress();
                return joinRoom(liveId, key, "guest");
            }
        }

        if (snapId) {
            if (key) sessionStorage.setItem(`apShareSnapshotKey:${snapId}`, key);
            else key = sessionStorage.getItem(`apShareSnapshotKey:${snapId}`);
            if (key) {
                removeSecretFromAddress();
                return loadSnapshot(snapId, key);
            }
        }

        try {
            const saved = JSON.parse(sessionStorage.getItem("apShareOwnerState") || "null");
            if (saved?.roomId && saved?.ownerKey) {
                state.guestKey = saved.guestKey || null;
                return joinRoom(saved.roomId, saved.ownerKey, "owner");
            }
        } catch {}

        console.log("✅ AP SYNAPSE — SHARE V2 READY");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
    else boot();
})();

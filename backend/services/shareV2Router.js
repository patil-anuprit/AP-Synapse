import express from "express";
import crypto from "crypto";
import pg from "pg";
import { remember } from "../memory/index.js";

const { Pool } = pg;
const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let ready;

const nowISO = () => new Date().toISOString();
const hash = value => crypto.createHash("sha256").update(String(value || "")).digest("hex");
const token = bytes => crypto.randomBytes(bytes).toString("base64url");
const id = prefix => `${prefix}_${crypto.randomBytes(10).toString("hex")}`;
const titleOf = value => String(value || "Live AP Synapse Conversation").replace(/\s+/g, " ").trim().slice(0, 180) || "Live AP Synapse Conversation";
const safeName = value => String(value || "Guest").replace(/\s+/g, " ").trim().slice(0, 70) || "Guest";

function safeMessages(list) {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
        if (!item || typeof item !== "object") return null;
        const content = String(item.content || "").trim().slice(0, 60000);
        if (!content) return null;
        return {
            id: String(item.id || crypto.randomUUID()).replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 120),
            role: item.role === "assistant" ? "assistant" : "user",
            content,
            author: safeName(item.author || (item.role === "assistant" ? "AP Synapse" : "Participant")),
            createdAt: Number.isNaN(Date.parse(item.createdAt)) ? nowISO() : String(item.createdAt)
        };
    }).filter(Boolean).slice(-300);
}

function expiryFrom(value) {
    const map = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
    if (value === "never") return new Date("2099-12-31T23:59:59.000Z");
    return new Date(Date.now() + (map[value] || map["7d"]));
}

async function ensureTables() {
    if (!ready) ready = pool.query(`
        CREATE TABLE IF NOT EXISTS ap_share_rooms (
            room_id VARCHAR(80) PRIMARY KEY,
            owner_key_hash CHAR(64) NOT NULL,
            guest_key_hash CHAR(64) NOT NULL,
            title VARCHAR(180) NOT NULL,
            permission VARCHAR(20) NOT NULL DEFAULT 'collaborate',
            locked BOOLEAN NOT NULL DEFAULT FALSE,
            approval_required BOOLEAN NOT NULL DEFAULT FALSE,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            messages JSONB NOT NULL DEFAULT '[]'::jsonb,
            events JSONB NOT NULL DEFAULT '[]'::jsonb,
            revision BIGINT NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
        );
        CREATE TABLE IF NOT EXISTS ap_share_presence (
            room_id VARCHAR(80) NOT NULL,
            participant_id VARCHAR(120) NOT NULL,
            display_name VARCHAR(70) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'guest',
            permission_override VARCHAR(20),
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            typing BOOLEAN NOT NULL DEFAULT FALSE,
            thinking BOOLEAN NOT NULL DEFAULT FALSE,
            PRIMARY KEY (room_id, participant_id)
        );
        ALTER TABLE ap_share_presence ADD COLUMN IF NOT EXISTS typing BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE ap_share_presence ADD COLUMN IF NOT EXISTS thinking BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE TABLE IF NOT EXISTS ap_share_join_requests (
            request_id VARCHAR(80) PRIMARY KEY,
            room_id VARCHAR(80) NOT NULL,
            participant_id VARCHAR(120) NOT NULL,
            display_name VARCHAR(70) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            decided_at TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS ap_share_snapshots (
            snapshot_id VARCHAR(80) PRIMARY KEY,
            key_hash CHAR(64) NOT NULL,
            title VARCHAR(180) NOT NULL,
            messages JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
        );
    `);
    return ready;
}

function isExpired(row) {
    return !row.active || new Date(row.expires_at).getTime() <= Date.now();
}

async function room(roomId) {
    await ensureTables();
    const result = await pool.query("SELECT * FROM ap_share_rooms WHERE room_id=$1", [roomId]);
    if (!result.rows.length) {
        const error = new Error("Shared conversation not found.");
        error.statusCode = 404;
        throw error;
    }
    const row = result.rows[0];
    if (isExpired(row)) {
        const error = new Error("This shared conversation has expired or ended.");
        error.statusCode = 410;
        throw error;
    }
    return row;
}

function roleFromKey(row, key) {
    const keyHash = hash(key);
    if (keyHash === row.owner_key_hash) return "owner";
    if (keyHash === row.guest_key_hash) return "guest";
    return null;
}

async function auth(req, { ownerOnly = false, requireApproved = true } = {}) {
    const row = await room(req.params.roomId);
    const role = roleFromKey(row, req.headers["x-share-key"]);
    if (!role || (ownerOnly && role !== "owner")) {
        const error = new Error(ownerOnly ? "Owner authorization required." : "Invalid share link.");
        error.statusCode = 403;
        throw error;
    }
    const participantId = String(req.headers["x-participant-id"] || "").slice(0, 120);
    let presence = null;
    if (role === "guest" && participantId) {
        const p = await pool.query("SELECT * FROM ap_share_presence WHERE room_id=$1 AND participant_id=$2", [row.room_id, participantId]);
        presence = p.rows[0] || null;
        if (presence?.status === "blocked") {
            const error = new Error("Access to this conversation has been removed.");
            error.statusCode = 403;
            throw error;
        }
        if (requireApproved && row.approval_required && presence?.status !== "active") {
            const error = new Error("Join approval required.");
            error.statusCode = 425;
            throw error;
        }
    }
    const permission = role === "owner" ? "owner" : (presence?.permission_override || row.permission);
    return { row, role, participantId, presence, permission };
}

async function event(roomId, type, text) {
    const entry = { id: id("evt"), type, text: String(text).slice(0, 240), at: nowISO() };
    await pool.query(`UPDATE ap_share_rooms SET events=(COALESCE(events,'[]'::jsonb) || $1::jsonb), updated_at=NOW() WHERE room_id=$2`, [JSON.stringify([entry]), roomId]);
}

function publicRoom(row, extra = {}) {
    return {
        roomId: row.room_id,
        title: row.title,
        permission: row.permission,
        locked: row.locked,
        approvalRequired: row.approval_required,
        revision: Number(row.revision || 1),
        messages: Array.isArray(row.messages) ? row.messages : [],
        expiresAt: row.expires_at,
        updatedAt: row.updated_at,
        ...extra
    };
}

router.post("/rooms", async (req, res) => {
    try {
        await ensureTables();
        const roomId = id("room");
        const ownerKey = token(28);
        const guestKey = token(24);
        const permission = ["view", "continue", "collaborate"].includes(req.body?.permission) ? req.body.permission : "collaborate";
        const messages = safeMessages(req.body?.messages);
        const title = titleOf(req.body?.title);
        const expiresAt = expiryFrom(req.body?.expiresIn);
        const approval = req.body?.approvalRequired === true;
        await pool.query(`INSERT INTO ap_share_rooms(room_id,owner_key_hash,guest_key_hash,title,permission,approval_required,messages,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`, [roomId, hash(ownerKey), hash(guestKey), title, permission, approval, JSON.stringify(messages), expiresAt]);
        await event(roomId, "created", "Live conversation created.");
        for (const item of messages.slice(-80)) remember(`live:${roomId}`, item.role, item.content);
        res.status(201).json({ roomId, ownerKey, guestKey, revision: 1, title, permission, approvalRequired: approval, expiresAt });
    } catch (error) {
        console.error("SHARE CREATE:", error);
        res.status(500).json({ error: error.message || "Unable to create live conversation." });
    }
});

router.post("/rooms/:roomId/join", async (req, res) => {
    try {
        const row = await room(req.params.roomId);
        const role = roleFromKey(row, req.headers["x-share-key"]);
        if (!role) return res.status(403).json({ error: "Invalid share link." });
        const participantId = String(req.headers["x-participant-id"] || "").slice(0, 120) || id("p");
        const name = safeName(req.body?.name);
        if (role === "owner") {
            await pool.query(`INSERT INTO ap_share_presence(room_id,participant_id,display_name,role,status,last_seen) VALUES($1,$2,$3,'owner','active',NOW()) ON CONFLICT(room_id,participant_id) DO UPDATE SET display_name=EXCLUDED.display_name,last_seen=NOW(),status='active'`, [row.room_id, participantId, name]);
            return res.json({ approved: true, role, participantId, permission: "owner", ...publicRoom(row) });
        }
        const p = await pool.query("SELECT * FROM ap_share_presence WHERE room_id=$1 AND participant_id=$2", [row.room_id, participantId]);
        if (p.rows[0]?.status === "blocked") return res.status(403).json({ error: "Access removed by owner." });
        if (row.approval_required && p.rows[0]?.status !== "active") {
            const existing = await pool.query("SELECT * FROM ap_share_join_requests WHERE room_id=$1 AND participant_id=$2 AND status='pending' ORDER BY created_at DESC LIMIT 1", [row.room_id, participantId]);
            const requestId = existing.rows[0]?.request_id || id("join");
            if (!existing.rows.length) {
                await pool.query("INSERT INTO ap_share_join_requests(request_id,room_id,participant_id,display_name) VALUES($1,$2,$3,$4)", [requestId, row.room_id, participantId, name]);
                await event(row.room_id, "join-request", `${name} requested access.`);
            }
            return res.status(202).json({ needsApproval: true, requestId, participantId });
        }
        await pool.query(`INSERT INTO ap_share_presence(room_id,participant_id,display_name,role,status,last_seen) VALUES($1,$2,$3,'guest','active',NOW()) ON CONFLICT(room_id,participant_id) DO UPDATE SET display_name=EXCLUDED.display_name,last_seen=NOW(),status=CASE WHEN ap_share_presence.status='blocked' THEN 'blocked' ELSE 'active' END`, [row.room_id, participantId, name]);
        await event(row.room_id, "joined", `${name} joined the conversation.`);
        const pp = await pool.query("SELECT permission_override FROM ap_share_presence WHERE room_id=$1 AND participant_id=$2", [row.room_id, participantId]);
        return res.json({ approved: true, role, participantId, permission: pp.rows[0]?.permission_override || row.permission, ...publicRoom(row) });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get("/rooms/:roomId", async (req, res) => {
    try {
        const { row, role, permission } = await auth(req);
        res.json({ role, participantPermission: permission, ...publicRoom(row) });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post("/rooms/:roomId/sync", async (req, res) => {
    const client = await pool.connect();
    try {
        const { row, role, permission } = await auth(req);
        if (role !== "owner" && (row.locked || permission === "view")) return res.status(403).json({ error: row.locked ? "Conversation is locked." : "View-only access." });
        await client.query("BEGIN");
        const locked = await client.query("SELECT messages,revision FROM ap_share_rooms WHERE room_id=$1 FOR UPDATE", [row.room_id]);
        const existing = Array.isArray(locked.rows[0].messages) ? locked.rows[0].messages : [];
        const incoming = safeMessages(req.body?.messages);
        const merged = existing.map(x => ({ ...x }));
        const positions = new Map(merged.map((x, i) => [x.id, i]));
        for (const item of incoming) {
            if (positions.has(item.id)) merged[positions.get(item.id)] = { ...merged[positions.get(item.id)], ...item };
            else { positions.set(item.id, merged.length); merged.push(item); }
        }
        const finalMessages = merged.slice(-300);
        const changed = JSON.stringify(finalMessages) !== JSON.stringify(existing);
        let revision = Number(locked.rows[0].revision || 1);
        if (changed) {
            revision += 1;
            await client.query("UPDATE ap_share_rooms SET messages=$1::jsonb,revision=$2,updated_at=NOW() WHERE room_id=$3", [JSON.stringify(finalMessages), revision, row.room_id]);
        }
        await client.query("COMMIT");
        res.json({ revision, messages: finalMessages });
    } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        res.status(error.statusCode || 500).json({ error: error.message });
    } finally { client.release(); }
});

router.post("/rooms/:roomId/presence", async (req, res) => {
    try {
        const { row, role, participantId } = await auth(req, { requireApproved: false });
        const name = safeName(req.body?.name);
        if (!participantId) return res.status(400).json({ error: "Participant id required." });
        const existing = await pool.query("SELECT status FROM ap_share_presence WHERE room_id=$1 AND participant_id=$2", [row.room_id, participantId]);
        if (existing.rows[0]?.status === "blocked") return res.status(403).json({ error: "Access removed." });
        if (role === "guest" && row.approval_required && existing.rows[0]?.status !== "active") return res.status(425).json({ error: "Approval required." });
        const typing = req.body?.typing === true;
        const thinking = req.body?.thinking === true;
        await pool.query(`INSERT INTO ap_share_presence(room_id,participant_id,display_name,role,status,last_seen,typing,thinking) VALUES($1,$2,$3,$4,'active',NOW(),$5,$6) ON CONFLICT(room_id,participant_id) DO UPDATE SET display_name=EXCLUDED.display_name,last_seen=NOW(),typing=EXCLUDED.typing,thinking=EXCLUDED.thinking`, [row.room_id, participantId, name, role, typing, thinking]);
        res.json({ ok: true });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.get("/rooms/:roomId/participants", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        const result = await pool.query(`SELECT participant_id,display_name,role,permission_override,status,joined_at,last_seen,typing,thinking,(last_seen > NOW()-INTERVAL '25 seconds') AS online FROM ap_share_presence WHERE room_id=$1 ORDER BY role='owner' DESC,last_seen DESC`, [row.room_id]);
        res.json({ participants: result.rows });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.patch("/rooms/:roomId/participants/:participantId", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        const permission = ["view", "continue", "collaborate", null].includes(req.body?.permission) ? req.body.permission : null;
        const status = req.body?.status === "blocked" ? "blocked" : "active";
        await pool.query("UPDATE ap_share_presence SET permission_override=$1,status=$2 WHERE room_id=$3 AND participant_id=$4", [permission, status, row.room_id, req.params.participantId]);
        await event(row.room_id, "participant", `${status === "blocked" ? "Participant removed" : "Participant permission updated"}.`);
        res.json({ ok: true });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.get("/rooms/:roomId/join-requests", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        const result = await pool.query("SELECT request_id,participant_id,display_name,status,created_at FROM ap_share_join_requests WHERE room_id=$1 AND status='pending' ORDER BY created_at ASC", [row.room_id]);
        res.json({ requests: result.rows });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.post("/rooms/:roomId/join-requests/:requestId", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        const decision = req.body?.decision === "approve" ? "approved" : "denied";
        const found = await pool.query("SELECT * FROM ap_share_join_requests WHERE room_id=$1 AND request_id=$2", [row.room_id, req.params.requestId]);
        if (!found.rows.length) return res.status(404).json({ error: "Join request not found." });
        const jr = found.rows[0];
        await pool.query("UPDATE ap_share_join_requests SET status=$1,decided_at=NOW() WHERE request_id=$2", [decision, jr.request_id]);
        if (decision === "approved") await pool.query(`INSERT INTO ap_share_presence(room_id,participant_id,display_name,role,status,last_seen) VALUES($1,$2,$3,'guest','active',NOW()) ON CONFLICT(room_id,participant_id) DO UPDATE SET display_name=EXCLUDED.display_name,status='active',last_seen=NOW()`, [row.room_id, jr.participant_id, jr.display_name]);
        await event(row.room_id, "approval", `${jr.display_name} was ${decision}.`);
        res.json({ ok: true, decision });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.patch("/rooms/:roomId/settings", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        const permission = ["view", "continue", "collaborate"].includes(req.body?.permission) ? req.body.permission : row.permission;
        const locked = typeof req.body?.locked === "boolean" ? req.body.locked : row.locked;
        const approval = typeof req.body?.approvalRequired === "boolean" ? req.body.approvalRequired : row.approval_required;
        const title = req.body?.title ? titleOf(req.body.title) : row.title;
        const expiresAt = req.body?.expiresIn ? expiryFrom(req.body.expiresIn) : row.expires_at;
        await pool.query("UPDATE ap_share_rooms SET permission=$1,locked=$2,approval_required=$3,title=$4,expires_at=$5,updated_at=NOW() WHERE room_id=$6", [permission, locked, approval, title, expiresAt, row.room_id]);
        await event(row.room_id, "settings", "Sharing settings updated.");
        const updated = await room(row.room_id);
        res.json(publicRoom(updated));
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.post("/rooms/:roomId/regenerate", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        const guestKey = token(24);
        await pool.query("UPDATE ap_share_rooms SET guest_key_hash=$1,updated_at=NOW() WHERE room_id=$2", [hash(guestKey), row.room_id]);
        await event(row.room_id, "security", "Share link regenerated. Previous guest link revoked.");
        res.json({ guestKey });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.get("/rooms/:roomId/events", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        res.json({ events: (Array.isArray(row.events) ? row.events : []).slice(-100).reverse() });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.delete("/rooms/:roomId", async (req, res) => {
    try {
        const { row } = await auth(req, { ownerOnly: true });
        await pool.query("UPDATE ap_share_rooms SET active=FALSE,updated_at=NOW() WHERE room_id=$1", [row.room_id]);
        res.json({ ok: true });
    } catch (error) { res.status(error.statusCode || 500).json({ error: error.message }); }
});

router.post("/snapshots", async (req, res) => {
    try {
        await ensureTables();
        const snapshotId = id("snap");
        const key = token(24);
        const messages = safeMessages(req.body?.messages);
        if (!messages.length) return res.status(400).json({ error: "No messages to share." });
        const title = titleOf(req.body?.title || "AP Synapse Conversation Snapshot");
        const expiresAt = expiryFrom(req.body?.expiresIn || "30d");
        await pool.query("INSERT INTO ap_share_snapshots(snapshot_id,key_hash,title,messages,expires_at) VALUES($1,$2,$3,$4::jsonb,$5)", [snapshotId, hash(key), title, JSON.stringify(messages), expiresAt]);
        res.status(201).json({ snapshotId, key, title, expiresAt });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get("/snapshots/:snapshotId", async (req, res) => {
    try {
        await ensureTables();
        const result = await pool.query("SELECT * FROM ap_share_snapshots WHERE snapshot_id=$1", [req.params.snapshotId]);
        const row = result.rows[0];
        if (!row || hash(req.headers["x-share-key"]) !== row.key_hash) return res.status(404).json({ error: "Snapshot not found." });
        if (new Date(row.expires_at).getTime() <= Date.now()) return res.status(410).json({ error: "Snapshot expired." });
        res.json({ snapshotId: row.snapshot_id, title: row.title, messages: row.messages, expiresAt: row.expires_at });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post("/fork", async (req, res) => {
    try {
        const messages = safeMessages(req.body?.messages);
        if (!messages.length) return res.status(400).json({ error: "Nothing to fork." });
        const sessionId = `fork:${token(18)}`;
        for (const item of messages.slice(-80)) remember(sessionId, item.role, item.content);
        res.status(201).json({ sessionId });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;

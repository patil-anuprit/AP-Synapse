import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import {
    WebSocketServer,
    WebSocket
} from "ws";

import {
    resolvePersonalizationIdentity
} from "../services/personalizationService.js";


const SECRET =
    process.env.AP_PRESENCE_SECRET ||
    crypto.randomBytes(48).toString("hex");


if (!process.env.AP_PRESENCE_SECRET) {
    console.warn(
        "AP Presence: AP_PRESENCE_SECRET is not configured. " +
        "Using temporary process secret."
    );
}


const DEVICE_LIMIT = 12;
const MAX_NAME = 80;

function isDevelopmentPresenceOrigin(
    origin
) {

    return /^https?:\/\/(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?$/i
        .test(
            String(
                origin ||
                ""
            )
        );
}


function developmentPresenceCors(
    req,
    res,
    next
) {

    const origin =
        String(
            req.headers.origin ||
            ""
        );


    const allowed =
        process.env.AP_PRESENCE_LOCAL_TEST ===
            "1" &&
        isDevelopmentPresenceOrigin(
            origin
        );


    if (!allowed) {

        return next();
    }


    res.setHeader(
        "Access-Control-Allow-Origin",
        origin
    );

    res.setHeader(
        "Vary",
        "Origin"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-ap-presence-local-user, x-personalization-id, x-session-id"
    );


    if (
        req.method ===
        "OPTIONS"
    ) {

        return res.sendStatus(
            204
        );
    }


    next();
}



const presenceUsers = new Map();


function safeText(value, max = MAX_NAME) {

    return String(value || "")
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, max);
}


function sign(value) {

    return crypto
        .createHmac("sha256", SECRET)
        .update(value)
        .digest("base64url");
}


function sameSignature(a, b) {

    try {

        const A = Buffer.from(String(a));
        const B = Buffer.from(String(b));

        return (
            A.length === B.length &&
            crypto.timingSafeEqual(A, B)
        );

    }
    catch {

        return false;
    }
}


function presenceUserKey(identityId) {

    return crypto
        .createHmac("sha256", SECRET)
        .update(String(identityId))
        .digest("hex");
}


function createTicket(userKey) {

    const payload = {
        v: 1,
        sub: userKey,
        exp: Date.now() + 60_000,
        nonce: crypto.randomUUID()
    };

    const body = Buffer
        .from(JSON.stringify(payload))
        .toString("base64url");

    return `${body}.${sign(body)}`;
}


function verifyTicket(ticket) {

    try {

        const [body, supplied] =
            String(ticket || "").split(".");

        if (!body || !supplied) {
            return null;
        }

        const expected = sign(body);

        if (!sameSignature(supplied, expected)) {
            return null;
        }

        const payload =
            JSON.parse(
                Buffer
                    .from(body, "base64url")
                    .toString("utf8")
            );

        if (
            payload?.v !== 1 ||
            !payload?.sub ||
            Number(payload.exp) < Date.now()
        ) {
            return null;
        }

        return payload;
    }
    catch {

        return null;
    }
}


function send(ws, value) {

    if (
        ws &&
        ws.readyState === WebSocket.OPEN
    ) {

        ws.send(JSON.stringify(value));
    }
}


function devicesFor(userKey) {

    if (!presenceUsers.has(userKey)) {

        presenceUsers.set(
            userKey,
            new Map()
        );
    }

    return presenceUsers.get(userKey);
}


function publicDevice(device) {

    return {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        capabilities: device.capabilities || [],
        online: true,
        lastSeen: device.lastSeen
    };
}


function broadcastDevices(userKey) {

    const devices =
        presenceUsers.get(userKey);

    if (!devices) return;

    const publicList =
        [...devices.values()]
            .map(publicDevice);

    for (const device of devices.values()) {

        send(device.ws, {
            type: "presence:devices",
            devices: publicList,
            timestamp: Date.now()
        });
    }
}


function removeDevice(
    userKey,
    deviceId
) {

    const devices =
        presenceUsers.get(userKey);

    if (!devices) return;

    devices.delete(deviceId);

    if (!devices.size) {

        presenceUsers.delete(userKey);
        return;
    }

    broadcastDevices(userKey);
}


export function installUniversalPresenceRoutes(app) {

    app.use(
        "/presence",
        developmentPresenceCors
    );

    app.post(
        "/presence/ticket",

        (req, res) => {

            try {

                const sessionId =
                    req.headers["x-session-id"] ||
                    req.headers["x-personalization-id"] ||
                    "presence";

                const identity =
                    resolvePersonalizationIdentity(
                        req,
                        sessionId
                    );

                /*
                 * AP_PRESENCE_LOCAL_TEST_IDENTITY
                 *
                 * Production:
                 * real AP Synapse authenticated identity ONLY.
                 *
                 * Localhost development:
                 * temporary shared test identity is permitted.
                 */

                let presenceIdentityId =
                    (
                        identity?.authenticated &&
                        identity?.identityId
                    )
                        ? identity.identityId
                        : null;


                const origin =
                    String(
                        req.headers.origin || ""
                    );


                const isLocalOrigin =
                    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
                        .test(origin);


                const localDevelopment =
                    process.env.NODE_ENV !==
                    "production";


                const lanPresenceTestEnabled =
                    process.env.AP_PRESENCE_LOCAL_TEST ===
                    "1";


                const isLanPresenceOrigin =
                    isDevelopmentPresenceOrigin(
                        origin
                    );


                if (
                    !presenceIdentityId &&
                    (
                        localDevelopment &&
                        isLocalOrigin
                    ) ||
                    (
                        lanPresenceTestEnabled &&
                        isLanPresenceOrigin
                    )
                ) {

                    const requestedTestUser =
                        safeText(
                            req.headers[
                                "x-ap-presence-local-user"
                            ],
                            120
                        );


                    if (requestedTestUser) {

                        presenceIdentityId =
                            "local-test:" +
                            requestedTestUser;
                    }
                }


                if (!presenceIdentityId) {

                    return res
                        .status(401)
                        .json({
                            success: false,
                            error:
                                "Sign in to AP Synapse to activate Presence."
                        });
                }


                const userKey =
                    presenceUserKey(
                        presenceIdentityId
                    );

                return res.json({
                    success: true,
                    ticket:
                        createTicket(userKey),
                    expiresInSeconds: 60
                });
            }
            catch (error) {

                console.error(
                    "Presence ticket error:",
                    error
                );

                return res
                    .status(500)
                    .json({
                        success: false,
                        error:
                            "Presence ticket could not be created."
                    });
            }
        }
    );


    app.get(
        "/presence/health",

        (req, res) => {

            res.json({
                service:
                    "AP Synapse Universal Presence",
                status: "healthy"
            });
        }
    );


    console.log(
        "⚡ AP Synapse Universal Presence routes active"
    );
}


export function attachUniversalPresenceWebSocket(
    server
) {

    const wss =
        new WebSocketServer({
            noServer: true,
            maxPayload:
                2 * 1024 * 1024
        });


    server.on(
        "upgrade",

        (request, socket, head) => {

            try {

                const host =
                    request.headers.host ||
                    "localhost";

                const url =
                    new URL(
                        request.url,
                        `http://${host}`
                    );


                if (
                    url.pathname !==
                    "/presence/ws"
                ) {

                    return;
                }


                const ticket =
                    verifyTicket(
                        url.searchParams.get(
                            "ticket"
                        )
                    );


                if (!ticket) {

                    socket.write(
                        "HTTP/1.1 401 Unauthorized\r\n\r\n"
                    );

                    socket.destroy();
                    return;
                }


                const deviceId =
                    safeText(
                        url.searchParams.get(
                            "deviceId"
                        ),
                        120
                    );


                if (
                    !deviceId ||
                    !/^[A-Za-z0-9._:-]+$/.test(
                        deviceId
                    )
                ) {

                    socket.write(
                        "HTTP/1.1 400 Bad Request\r\n\r\n"
                    );

                    socket.destroy();
                    return;
                }


                request.apPresence = {
                    userKey: ticket.sub,
                    deviceId,

                    deviceName:
                        safeText(
                            url.searchParams.get(
                                "deviceName"
                            )
                        ) ||
                        "AP Synapse Device",

                    deviceType:
                        safeText(
                            url.searchParams.get(
                                "deviceType"
                            ),
                            30
                        ) ||
                        "device"
                };


                wss.handleUpgrade(
                    request,
                    socket,
                    head,

                    (ws) => {

                        wss.emit(
                            "connection",
                            ws,
                            request
                        );
                    }
                );
            }
            catch (error) {

                console.error(
                    "Presence WebSocket upgrade error:",
                    error
                );

                socket.destroy();
            }
        }
    );


    wss.on(
        "connection",

        (ws, request) => {

            const {
                userKey,
                deviceId,
                deviceName,
                deviceType
            } =
                request.apPresence;


            const devices =
                devicesFor(userKey);


            if (
                !devices.has(deviceId) &&
                devices.size >= DEVICE_LIMIT
            ) {

                ws.close(
                    4003,
                    "Device limit reached"
                );

                return;
            }


            const previous =
                devices.get(deviceId);


            if (
                previous?.ws &&
                previous.ws.readyState ===
                    WebSocket.OPEN
            ) {

                previous.ws.close(
                    4000,
                    "Device reconnected"
                );
            }


            const device = {
                ws,
                deviceId,
                deviceName,
                deviceType,
                capabilities: [],
                lastSeen: Date.now(),
                alive: true
            };


            devices.set(
                deviceId,
                device
            );


            ws.on(
                "pong",

                () => {

                    device.alive = true;
                    device.lastSeen =
                        Date.now();
                }
            );


            send(ws, {
                type: "presence:connected",
                device:
                    publicDevice(device),
                timestamp: Date.now()
            });


            broadcastDevices(userKey);


            ws.on(
                "message",

                (raw) => {

                    let message;

                    try {

                        message =
                            JSON.parse(
                                raw.toString()
                            );
                    }
                    catch {

                        return;
                    }


                    device.lastSeen =
                        Date.now();


                    switch (
                        message?.type
                    ) {


                        case "presence:heartbeat":

                            send(ws, {
                                type:
                                    "presence:heartbeat:ack",
                                timestamp:
                                    Date.now()
                            });

                            break;


                        case "presence:capabilities":

                            device.capabilities =
                                Array.isArray(
                                    message.capabilities
                                )
                                    ?
                                    message.capabilities
                                        .map(item =>
                                            safeText(
                                                item,
                                                40
                                            )
                                        )
                                        .filter(Boolean)
                                        .slice(0, 20)

                                    :
                                    [];

                            broadcastDevices(
                                userKey
                            );

                            break;


                        case "handoff:request": {

                            const targetId =
                                safeText(
                                    message.targetDeviceId,
                                    120
                                );

                            const target =
                                devices.get(
                                    targetId
                                );


                            if (!target) {

                                send(ws, {
                                    type:
                                        "handoff:error",
                                    error:
                                        "Target device is offline."
                                });

                                break;
                            }


                            if (
                                targetId ===
                                deviceId
                            ) {

                                break;
                            }


                            const handoffId =
                                crypto.randomUUID();


                            send(
                                target.ws,
                                {
                                    type:
                                        "handoff:incoming",

                                    handoffId,

                                    fromDevice:
                                        publicDevice(
                                            device
                                        ),

                                    state:
                                        message.state ||
                                        {},

                                    timestamp:
                                        Date.now()
                                }
                            );


                            send(ws, {
                                type:
                                    "handoff:sent",
                                handoffId,
                                targetDeviceId:
                                    targetId,
                                timestamp:
                                    Date.now()
                            });

                            break;
                        }


                        case "handoff:accepted": {

                            const source =
                                devices.get(
                                    safeText(
                                        message.sourceDeviceId,
                                        120
                                    )
                                );


                            if (source) {

                                send(
                                    source.ws,
                                    {
                                        type:
                                            "handoff:complete",

                                        handoffId:
                                            safeText(
                                                message.handoffId,
                                                120
                                            ),

                                        acceptedBy:
                                            publicDevice(
                                                device
                                            ),

                                        timestamp:
                                            Date.now()
                                    }
                                );
                            }

                            break;
                        }


                        case "presence:event":

                            for (
                                const peer
                                of devices.values()
                            ) {

                                if (
                                    peer.deviceId ===
                                    deviceId
                                ) {
                                    continue;
                                }

                                send(
                                    peer.ws,
                                    {
                                        type:
                                            "presence:event",

                                        event:
                                            safeText(
                                                message.event,
                                                40
                                            ),

                                        sourceDeviceId:
                                            deviceId,

                                        timestamp:
                                            Date.now()
                                    }
                                );
                            }

                            break;
                    }
                }
            );


            ws.on(
                "close",

                () => {

                    removeDevice(
                        userKey,
                        deviceId
                    );
                }
            );


            ws.on(
                "error",

                (error) => {

                    console.error(
                        "Presence socket error:",
                        error?.message ||
                        error
                    );
                }
            );
        }
    );


    const heartbeat =
        setInterval(
            () => {

                for (
                    const [
                        userKey,
                        devices
                    ]
                    of presenceUsers.entries()
                ) {

                    for (
                        const [
                            deviceId,
                            device
                        ]
                        of devices.entries()
                    ) {

                        if (
                            device.alive ===
                            false
                        ) {

                            try {
                                device.ws.terminate();
                            }
                            catch {}

                            removeDevice(
                                userKey,
                                deviceId
                            );

                            continue;
                        }

                        device.alive = false;

                        try {
                            device.ws.ping();
                        }
                        catch {}
                    }
                }

            },
            30_000
        );


    wss.on(
        "close",

        () => {

            clearInterval(
                heartbeat
            );
        }
    );


    console.log(
        "⚡ AP Synapse Universal Presence WebSocket active"
    );


    return wss;
}
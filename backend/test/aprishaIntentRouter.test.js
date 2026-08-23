import test from "node:test";
import assert from "node:assert/strict";

import { routeAprishaIntent } from "../services/aprishaIntentRouter.js";

test("routes numeric and spoken timers to Android", () => {
    assert.deepEqual(
        routeAprishaIntent("Hey Aprisha, set a timer for 1 minute"),
        {
            handled: true,
            mode: "device",
            intent: "set_timer",
            command: "set a timer for 60 seconds"
        }
    );

    assert.equal(
        routeAprishaIntent("start a timer for twenty five seconds").command,
        "set a timer for 25 seconds"
    );
});

test("routes battery questions to the phone", () => {
    const result = routeAprishaIntent("What is my battery level?");
    assert.equal(result.handled, true);
    assert.equal(result.intent, "get_battery");
    assert.equal(result.command, "battery");
});

test("routes calls, messages, reminders, settings, and app actions", () => {
    const commands = [
        "call Mom",
        "send a message to Dad saying hello",
        "remind me in ten minutes to drink water",
        "turn on bluetooth",
        "open YouTube",
        "set an alarm for 7 am"
    ];

    for (const command of commands) {
        const result = routeAprishaIntent(command);
        assert.equal(result.handled, true, command);
        assert.equal(result.mode, "device", command);
    }
});

test("keeps knowledge questions in AP Synapse chat", () => {
    assert.deepEqual(
        routeAprishaIntent("Explain photosynthesis simply"),
        { handled: false, mode: "chat" }
    );
});

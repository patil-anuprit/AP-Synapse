const NUMBERS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4,
    five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90
};

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/^hey\s+aprisha\b[\s,]*/, "")
        .replace(/[^a-z0-9:+\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function parseNumber(value) {
    const source = String(value || "").trim();

    if (/^\d+$/.test(source)) {
        return Number(source);
    }

    let total = 0;
    let group = 0;
    let found = false;

    for (const token of source.replace(/-/g, " ").split(/\s+/)) {
        if (!token || token === "and") continue;

        if (token === "a" || token === "an") {
            group += 1;
            found = true;
        } else if (token === "hundred") {
            group = Math.max(1, group) * 100;
            found = true;
        } else if (token === "thousand") {
            total += Math.max(1, group) * 1000;
            group = 0;
            found = true;
        } else if (Object.hasOwn(NUMBERS, token)) {
            group += NUMBERS[token];
            found = true;
        } else {
            return null;
        }
    }

    return found ? total + group : null;
}

function device(command, intent) {
    return {
        handled: true,
        mode: "device",
        intent,
        command
    };
}

export function routeAprishaIntent(message) {
    const text = normalize(message);

    if (!text) {
        return { handled: false, mode: "chat" };
    }

    const timer = text.match(
        /\b(?:set|start|create)\s+(?:a\s+)?timer(?:\s+for)?\s+(.+?)\s+(seconds?|minutes?|hours?)\b/
    );

    if (timer) {
        const amount = parseNumber(timer[1]);

        if (Number.isFinite(amount) && amount > 0) {
            const multiplier = timer[2].startsWith("hour")
                ? 3600
                : timer[2].startsWith("minute")
                ? 60
                : 1;

            const seconds = Math.min(
                86400,
                Math.max(1, amount * multiplier)
            );

            return device(
                `set a timer for ${seconds} seconds`,
                "set_timer"
            );
        }
    }

    const battery =
        /\b(?:battery|charge)\b/.test(text) &&
        /\b(?:level|percent|percentage|remaining|left|status|how much)\b/.test(text);

    if (battery || text === "battery") {
        return device("battery", "get_battery");
    }

    if (/\b(?:flashlight|torch)\b.*\b(?:on|enable)\b/.test(text)) {
        return device("flashlight on", "flashlight_on");
    }

    if (/\b(?:flashlight|torch)\b.*\b(?:off|disable)\b/.test(text)) {
        return device("flashlight off", "flashlight_off");
    }

    if (/\b(?:what|tell).*\btime\b|^current time$/.test(text)) {
        return device("what time is it", "get_time");
    }

    if (/\b(?:what|tell).*\bdate\b|^current date$/.test(text)) {
        return device("what is the date", "get_date");
    }

    const deviceCommand =
        /^(?:open|launch|start|call|phone|ring|send|message|text|sms|turn|remind|navigate to|directions to|take me to|go to|search for|google|set|create|schedule)\b/;

    const exactCommand =
        /^(?:mute|unmute|pause|play|resume|next|previous|stop music|volume up|volume down)$/;

    if (
        deviceCommand.test(text) ||
        exactCommand.test(text) ||
        /\bsettings$/.test(text)
    ) {
        return device(text, "device_command");
    }

    return {
        handled: false,
        mode: "chat"
    };
}

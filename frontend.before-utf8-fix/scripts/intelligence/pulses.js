export function createPulses(connections) {

    return connections.map(() => ({

    progress: Math.random(),

    speed: 0.0004 + Math.random() * 0.0010,

    opacity: 0.20 + Math.random() * 0.35,

    size: 0.25 + Math.random() * 0.15,

    colorShift: Math.random() * 20 - 10,

    active: Math.random() > 0.35

}));

}

export function updatePulses(pulses) {

    pulses.forEach(pulse => {

        if (!pulse.active) {

            if (Math.random() < 0.0005) {

                pulse.active = true;
                pulse.progress = 0;
                pulse.opacity = 0;

            }

            return;

        }

        pulse.progress += pulse.speed;

        if (pulse.progress < 0.2) {

    pulse.opacity = pulse.progress / 0.2;

}
else if (pulse.progress > 0.8) {

    pulse.opacity = (1 - pulse.progress) / 0.2;

}
else {

    pulse.opacity = 1;

}

        if (pulse.progress > 1) {

            pulse.progress = 0;
            pulse.opacity = 0;

            if (Math.random() < 0.35) {

                pulse.active = false;

            }

        }

    });

}
import { generateNodes } from "./nodes.js";
import { generateConnections } from "./connections.js";
import { updateAnimation } from "./animation.js";
import { createMouseTracker } from "./mouse.js";
import {
    createPulses,
    updatePulses
} from "./pulses.js";
import {
    createParticles,
    updateParticles
} from "./particles.js";
import { CONFIG } from "./config.js";

export class IntelligenceEngine {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.resize();

        this.nodes = generateNodes(this.canvas);
        this.connections = generateConnections(this.nodes);
        this.pulses = createPulses(this.connections);
        this.particles = createParticles(this.canvas);

        this.startTime = performance.now();

       this.mouse = createMouseTracker();

       this.camera = {
     x: 0,
     y: 0
};

       window.addEventListener("resize", () => {

    this.resize();

    this.nodes = generateNodes(this.canvas);
    this.connections = generateConnections(this.nodes);
    this.pulses = createPulses(this.connections);

});

    }

    resize() {

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

    }

    draw() {

        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        
this.ctx.translate(
    this.camera.x,
    this.camera.y
);

// Draw ambient particles

this.particles.forEach(particle => {

    this.ctx.beginPath();

    this.ctx.fillStyle =
        `rgba(${CONFIG.NODE_COLOR},${particle.opacity})`;

    this.ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
    );

    this.ctx.fill();

});

        // Draw connections

        this.connections.forEach(connection => {

     const from = this.nodes[connection.from];
     const to = this.nodes[connection.to];

     const dx = from.x - to.x;
     const dy = from.y - to.y;

     const distance = Math.sqrt(dx * dx + dy * dy);

     let opacity =
    Math.max(
        0,
        CONFIG.MAX_LINE_OPACITY *
        (1 - distance / CONFIG.MAX_CONNECTION_DISTANCE)
    );

const pulse = this.pulses.find((p, i) =>
    i === this.connections.indexOf(connection) &&
    p.active
);

if (pulse) {

    const glow =
        1 - Math.abs(pulse.progress - 0.5) * 2;

    opacity += glow * 0.05;

}

     this.ctx.beginPath();


    this.ctx.shadowBlur =
    pulse && pulse.active ? 6 : 0;

    this.ctx.shadowColor =
    `rgba(${CONFIG.LINE_COLOR},${opacity})`;
     this.ctx.strokeStyle =
        `rgba(${CONFIG.LINE_COLOR},${opacity})`;

     this.ctx.lineWidth =
    CONFIG.LINE_WIDTH +
    (pulse ? 0.3 : 0);

     this.ctx.moveTo(from.x, from.y);
     this.ctx.lineTo(to.x, to.y);

     this.ctx.stroke();

     this.ctx.shadowBlur = 0;

});

    // Draw signal pulses

     this.pulses.forEach((pulse, index) => {
     if (!pulse.active) return;

    const connection = this.connections[index];

    const from = this.nodes[connection.from];
    const to = this.nodes[connection.to];

    const x =
        from.x +
        (to.x - from.x) * pulse.progress;

    const y =
        from.y +
        (to.y - from.y) * pulse.progress;

    this.ctx.beginPath();

    this.ctx.shadowBlur = 8;

    this.ctx.shadowColor =
        `rgba(${CONFIG.NODE_COLOR},${pulse.opacity})`;

    this.ctx.fillStyle =
        `rgba(${CONFIG.NODE_COLOR},${pulse.opacity})`;

    this.ctx.arc(
        x,
        y,
        CONFIG.NODE_RADIUS * pulse.size,
        0,
        Math.PI * 2
    );

    this.ctx.fill();

    this.ctx.shadowBlur = 0;

});


        // Draw nodes

       this.nodes.forEach(node => {

    // Soft glow

    this.ctx.shadowBlur = CONFIG.NODE_GLOW;

    this.ctx.shadowColor =
    `rgba(${CONFIG.NODE_COLOR},${node.opacity})`;

    this.ctx.beginPath();

    this.ctx.fillStyle =
    `rgba(${CONFIG.NODE_COLOR},${node.opacity})`;

    this.ctx.arc(
        node.x,
        node.y,
        CONFIG.NODE_RADIUS * node.scale,
        0,
        Math.PI * 2
    );

    this.ctx.fill();

    // Reset glow

    this.ctx.shadowBlur = 0;

});

this.ctx.restore();

    }

    animate = () => {

        const elapsed =
            performance.now() - this.startTime;

        updateAnimation(
        this.nodes,
        elapsed,
        this.mouse
    );

        updatePulses(this.pulses);

        updateParticles(
        this.particles,
        this.canvas
   );

const targetX =
    (this.mouse.x - this.canvas.width / 2) *
    (CONFIG.PARALLAX_STRENGTH / 1000);

const targetY =
    (this.mouse.y - this.canvas.height / 2) *
    (CONFIG.PARALLAX_STRENGTH / 1000);

this.camera.x +=
    (targetX - this.camera.x) *
    CONFIG.PARALLAX_SMOOTHING;

this.camera.y +=
    (targetY - this.camera.y) *
    CONFIG.PARALLAX_SMOOTHING;

        this.draw();

        requestAnimationFrame(this.animate);

    }

}
import { CONFIG } from "./config.js";

export function updateAnimation(nodes, elapsedTime, mouse) {

    const settled = elapsedTime > CONFIG.SETTLE_TIME;

    nodes.forEach(node => {

        if (elapsedTime > node.delay) {

    const pulse =
        Math.sin(
            elapsedTime * CONFIG.PULSE_SPEED +
            node.offset
        ) * 0.5 + 0.5;

    node.opacity =
        CONFIG.MAX_NODE_OPACITY *
        (0.4 + pulse * 0.6);

        }

    node.scale =
1 + Math.sin(elapsedTime * 0.0008 + node.offset) * 0.05;

        if (!settled) {

            node.x += node.vx;
            node.y += node.vy;

        } else {

            node.vx *= CONFIG.SETTLE_FACTOR;
            node.vy *= CONFIG.SETTLE_FACTOR;

            node.x += node.vx;
            node.y += node.vy;

        }

        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.MOUSE_RADIUS) {

    const force =
        (1 - distance / CONFIG.MOUSE_RADIUS) *
        CONFIG.MOUSE_FORCE;

    node.x += dx * force;
    node.y += dy * force;
 
        }
  
        const homeDX = node.homeX - node.x;
        const homeDY = node.homeY - node.y;

        node.x += homeDX * 0.02;
        node.y += homeDY * 0.02;

    });

}
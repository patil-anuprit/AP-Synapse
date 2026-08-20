import { CONFIG } from "./config.js";

export function generateNodes(canvas) {

    const nodes = [];

    for (let c = 0; c < CONFIG.CLUSTERS; c++) {

        const centerX =
            canvas.width * (0.35 + Math.random() * 0.55);

        const centerY =
            canvas.height * (0.15 + Math.random() * 0.70);

        for (let i = 0; i < CONFIG.NODES_PER_CLUSTER; i++) {

            const angle = Math.random() * Math.PI * 2;

            const radius =
                Math.random() * CONFIG.CLUSTER_RADIUS;

             const x =
                  centerX + Math.cos(angle) * radius;

             const y =
                 centerY + Math.sin(angle) * radius;

            nodes.push({

           x,
           y,

           homeX: x,
           homeY: y,

           vx: (Math.random() - 0.5) * 0.3,
           vy: (Math.random() - 0.5) * 0.3,

           opacity: 0,
           delay: Math.random() * 4000,

           offset: Math.random() * Math.PI * 2,
           scale: 1

         });

        }

    }

    return nodes;

}
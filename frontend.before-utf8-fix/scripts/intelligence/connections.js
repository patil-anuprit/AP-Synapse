import { CONFIG } from "./config.js";

export function generateConnections(nodes) {

    const connections = [];

    for (let i = 0; i < nodes.length; i++) {

        const distances = [];

        for (let j = 0; j < nodes.length; j++) {

            if (i === j) continue;

            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= CONFIG.MAX_CONNECTION_DISTANCE) {

                distances.push({
                    index: j,
                    distance
                });

            }

        }

        distances.sort((a, b) => a.distance - b.distance);

        for (
            let k = 0;
            k < Math.min(CONFIG.MAX_CONNECTIONS_PER_NODE, distances.length);
            k++
        ) {

            connections.push({

                from: i,

                to: distances[k].index,

                distance: distances[k].distance

            });

        }

    }

    return connections;

}
export function createParticles(canvas, count = 100) {

    const particles = [];

    for (let i = 0; i < count; i++) {

        particles.push({

    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,

    // Different speeds
    vx: (Math.random() - 0.5) * (0.02 + Math.random() * 0.05),
    vy: (Math.random() - 0.5) * (0.02 + Math.random() * 0.05),

    // Three particle sizes
    radius:
        Math.random() < 0.15
            ? 2.0
            : Math.random() < 0.45
                ? 1.2
                : 0.5,

    // Three brightness levels
    opacity:
        Math.random() < 0.15
            ? 0.10
            : Math.random() < 0.45
                ? 0.07
                : 0.04

});

    }

    return particles;

}

export function updateParticles(particles, canvas) {

    particles.forEach(p => {

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

    });

}
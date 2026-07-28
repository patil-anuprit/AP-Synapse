export function createMouseTracker() {

    const mouse = {
        x: -1000,
        y: -1000
    };

    window.addEventListener("mousemove", (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    return mouse;

}
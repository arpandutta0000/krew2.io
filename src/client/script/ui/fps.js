/* FPS Stat */

let times = [];
const getFPS = () => {
    window.requestAnimationFrame(() => {
        const now = performance.now();

        while (times.length > 0 && times[0] <= now - 1000) times.shift();
        times.push(now);

        document.querySelector(`#fps-wrapper > span`).innerHTML = `${times.length} FPS`;
        getFPS();
    });
};

getFPS();
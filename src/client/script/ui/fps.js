/**
 * Set FPS stat
 */
const getFPS = () => {
    window.requestAnimationFrame(() => {
        const now = performance.now();

        while (fpsTimes.length > 0 && fpsTimes[0] <= now - 1000) fpsTimes.shift();
        fpsTimes.push(now);

        document.querySelector(`#fps-wrapper > span`).innerHTML = `${fpsTimes.length} FPS`;
        getFPS();
    });
};
getFPS();

// Automatically resize renderer when the window is resized
var updateViewport = function () {
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
};

window.addEventListener('resize', updateViewport, false);
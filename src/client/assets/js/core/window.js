// Automatically resize renderer whent he window is resized.
let updateViewport = () => {
    if(renderer) renderer.setSize(window.innerWidth, window.innerHeight);
    if(camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}
window.addEventListener(`resize`, updateViewport, false);

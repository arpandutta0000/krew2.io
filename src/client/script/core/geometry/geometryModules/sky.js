/**
 * Add the sky to the scene
 */
let initSky = () => {
    // Add ceiling
    ceiling = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(config.worldsize * 1.5, config.worldsize * 1.5),
        materials.sky
    );
    ceiling.rotation.x = -Math.PI * 0.5;
    ceiling.position.set(config.worldsize * 0.5, 90, config.worldsize * 0.5);
    scene.add(ceiling);

    // Add environment sphere
    envSphere = new THREE.Mesh(
        new THREE.SphereGeometry(config.worldsize * 2),
        materials.sky
    );
    envSphere.position.set(config.worldsize * 0.5, 0, config.worldsize * 0.5);
    scene.add(envSphere);
};

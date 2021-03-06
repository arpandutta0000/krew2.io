/**
 * Set up the environment
 */
let setUpEnvironment = () => {
    // Set scene background
    scene.background = new THREE.Color(0x7de8ff);

    // Add Fog
    scene.fog = new THREE.FogExp2(0x7de8ff, 0.007);

    // Add warm and cold ambient lights
    warmAmbientlight = new THREE.AmbientLight(0xffd2ad, 0.7);
    scene.add(warmAmbientlight);
    coldAmbientlight = new THREE.AmbientLight(0xd4e4ff, 0.3);
    scene.add(coldAmbientlight);

    // Add directional light
    light = new THREE.DirectionalLight(0xffdfab, 1.0);
    light.position.set(0, 10, 20);
    scene.add(light);

    // Create sky, water, and world boundries
    initSky();
    initWater();
    initWorldBoundries();
    addEasterEggs();
};

/**
 * Add world boundries
 */
let initWorldBoundries = () => {
    environment.boundaryLeft = new THREE.Mesh(baseGeometry.box, materials.boundary);
    environment.boundaryLeft.position.set(config.worldsize * 0.5, 1.5, 0);
    environment.boundaryLeft.scale.set(config.worldsize, 0.1, 3);
    scene.add(environment.boundaryLeft);

    environment.boundaryRight = new THREE.Mesh(baseGeometry.box, materials.boundary);
    environment.boundaryRight.position.set(config.worldsize * 0.5, 1.5, config.worldsize);
    environment.boundaryRight.scale.set(config.worldsize, 0.1, 3);
    scene.add(environment.boundaryRight);

    environment.boundaryUp = new THREE.Mesh(baseGeometry.box, materials.boundary);
    environment.boundaryUp.position.set(0, 1.5, config.worldsize * 0.5);
    environment.boundaryUp.scale.set(3, 0.1, config.worldsize);
    scene.add(environment.boundaryUp);

    environment.boundaryDown = new THREE.Mesh(baseGeometry.box, materials.boundary);
    environment.boundaryDown.position.set(config.worldsize, 1.5, config.worldsize * 0.5);
    environment.boundaryDown.scale.set(3, 0.1, config.worldsize);
    scene.add(environment.boundaryDown);
};

/**
 * Add Easters Eggs
 */
let addEasterEggs = () => {
    let lostTreasure = models.lostTreasure;
    lostTreasure.position.set(2620, 1, 2620);
    lostTreasure.scale.set(3, 3, 3);
    lostTreasure.rotation.y = Math.PI / 2;
    scene.add(lostTreasure);
};

/**
 * Do a day/night transition
 *
 * @param {number} time If it's day or night (0 = Day, 1 = Night)
 */
let doDaylightCycle = (time) => {
    if (!water || (water && window.currentTime === time)) return;

    let daySkyColor = {
        r: 0,
        g: 197,
        b: 255
    };
    let nightSkyColor = {
        r: 0,
        g: 36,
        b: 112
    };

    let daySceneColor = {
        r: 125,
        g: 232,
        b: 255
    };
    let nightSceneColor = {
        r: 21,
        g: 35,
        b: 69
    };

    window.currentTime = time;
    if (time === 1) {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity -= 0.02;
            ceiling.material.color.set(colorFade(daySkyColor, nightSkyColor, i / 100));
            envSphere.material.color.set(colorFade(daySkyColor, nightSkyColor, i / 100));
            water.parent.fog.color.set(colorFade(daySceneColor, nightSceneColor, i / 100));
            scene.background = new THREE.Color(colorFade(daySceneColor, nightSceneColor, i / 100));
            if (i === 100) clearInterval(anim);
        }, 20);
    } else if (time === 0) {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity += 0.02;
            ceiling.material.color.set(colorFade(nightSkyColor, daySkyColor, i / 100));
            envSphere.material.color.set(colorFade(nightSkyColor, daySkyColor, i / 100));
            water.parent.fog.color.set(colorFade(nightSceneColor, daySceneColor, i / 100));
            scene.background = new THREE.Color(colorFade(nightSceneColor, daySceneColor, i / 100));
            if (i === 100) clearInterval(anim);
        }, 20);
    }
};

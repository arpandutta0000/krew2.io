let environment = {};
let water, light, ceiling, envSphere;

// Main environment setup method
let setUpEnvironment = () => {
    // Set scene background
    scene.background = new THREE.Color(0xbff0ff);

    // Add Fog
    scene.fog = new THREE.FogExp2(0xbff0ff, 0.007);

    // Add warm and cold ambient lights
    warmAmbientlight = new THREE.AmbientLight(0xffd2ad, 0.7);
    scene.add(warmAmbientlight);
    coldAmbientlight = new THREE.AmbientLight(0xd4efff, 0.3);
    scene.add(coldAmbientlight);

    // Add ceiling
    ceiling = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(worldsize * 1.5, worldsize * 1.5),
        materials.sky
    );
    ceiling.rotation.x = -Math.PI * 0.5;
    ceiling.position.set(worldsize * 0.5, 55, worldsize * 0.5);
    scene.add(ceiling);

    // Add environment sphere
    envSphere = new THREE.Mesh(
        new THREE.SphereGeometry(worldsize * 2),
        materials.sky
    );
    envSphere.position.set(worldsize * 0.5, 0, worldsize * 0.5);
    scene.add(envSphere);

    // Add directional light
    light = new THREE.DirectionalLight(0xffdfab, 1.0);
    light.position.set(0, 10, 20);
    light.castShadow = true;
    scene.add(light);

    // Add Water
    let initWater = () => {
        const Water = waterSetup();

        let waterGeometry = new THREE.PlaneBufferGeometry(worldsize * 1.5, worldsize * 1.5);

        water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: textures.water,
            alpha: 1.0,
            sunDirection: light.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 1.0,
            fog: scene.fog
        });

        water.rotation.x = -Math.PI * 0.5;
        water.position.set(worldsize * 0.5, 0, worldsize * 0.5);
        water.renderOrder = 32;

        scene.add(water);
    };

    // Add World Boundries
    let initWorldBoundries = () => {
        environment.boundaryLeft = new THREE.Mesh(base_geometries.box, materials.boundary);
        environment.boundaryLeft.position.set(worldsize * 0.5, 1.5, 0);
        environment.boundaryLeft.scale.set(worldsize, 0.1, 3);
        scene.add(environment.boundaryLeft);

        environment.boundaryRight = new THREE.Mesh(base_geometries.box, materials.boundary);
        environment.boundaryRight.position.set(worldsize * 0.5, 1.5, worldsize);
        environment.boundaryRight.scale.set(worldsize, 0.1, 3);
        scene.add(environment.boundaryRight);

        environment.boundaryUp = new THREE.Mesh(base_geometries.box, materials.boundary);
        environment.boundaryUp.position.set(0, 1.5, worldsize * 0.5);
        environment.boundaryUp.scale.set(3, 0.1, worldsize);
        scene.add(environment.boundaryUp);

        environment.boundaryDown = new THREE.Mesh(base_geometries.box, materials.boundary);
        environment.boundaryDown.position.set(worldsize, 1.5, worldsize * 0.5);
        environment.boundaryDown.scale.set(3, 0.1, worldsize);
        scene.add(environment.boundaryDown);
    };

    initWater();
    initWorldBoundries();
};

// Day Night Cycle Transition Method
let doDaylightCycle = (time) => {
    if (!water || (water && window.currentTime == time)) return;

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
        r: 191,
        g: 240,
        b: 255
    };
    let nightSceneColor = {
        r: 6,
        g: 0,
        b: 31
    };

    window.currentTime = time;
    if (time == 1) {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity -= 0.02;
            ceiling.material.color.set(colorFade(daySkyColor, nightSkyColor, i / 100));
            envSphere.material.color.set(colorFade(daySkyColor, nightSkyColor, i / 100));
            water.parent.fog.color.set(colorFade(daySceneColor, nightSceneColor, i / 100));
            scene.background = new THREE.Color(colorFade(daySceneColor, nightSceneColor, i / 100));
            if (i == 100) clearInterval(anim);
        }, 20);
    } else if (time == 0) {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity += 0.02;
            ceiling.material.color.set(colorFade(nightSkyColor, daySkyColor, i / 100));
            envSphere.material.color.set(colorFade(nightSkyColor, daySkyColor, i / 100));
            water.parent.fog.color.set(colorFade(nightSceneColor, daySceneColor, i / 100));
            scene.background = new THREE.Color(colorFade(nightSceneColor, daySceneColor, i / 100));
            if (i == 100) clearInterval(anim);
        }, 20);
    }
};

// Fade between two RGB colors
let colorFade = (start, end, i) => {
    let R = Math.round((end.r - start.r) * i + start.r);
    let G = Math.round((end.g - start.g) * i + start.g);
    let B = Math.round((end.b - start.b) * i + start.b);
    return 0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255);
};

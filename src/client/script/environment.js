let environment = {};
let water, light, sun;

// Main environment setup method
let setUpEnvironment = () => {
    // Set scene background
    scene.background = new THREE.Color(0x00c5ff);
    renderer.setClearColor(0x00c5ff);

    // Add Fog
    scene.fog = new THREE.FogExp2(0xd5e1e3, 0.007);

    // Add warm and cold ambient lights
    warmAmbientlight = new THREE.AmbientLight(0xffd2ad, 0.7);
    scene.add(warmAmbientlight);
    coldAmbientlight = new THREE.AmbientLight(0xd4efff, 0.3);
    scene.add(coldAmbientlight);

    // Add directional light
    light = new THREE.DirectionalLight(0xffdfab, 0.8);
    light.position.set(0, 10, 50);
    light.castShadow = true;
    scene.add(light);

    // Add Water
    let initWater = () => {
        const Water = waterSetup();

        let waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000);

        water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: textures.water,
            alpha: 1.0,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 1.0,
            fog: scene.fog
        });

        water.rotation.x = -Math.PI * 0.5;

        scene.add(water);
    }

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
    }

    initWater();
    initWorldBoundries();
}

// Day Night Cycle Transition Method
let doDaylightCycle = (time) => {
    if (!water || (water && window.currentTime == time)) return;

    window.currentTime = time;
    if (time == 1) {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity -= 0.01;
            water.material.uniforms.waterColor.value.r -= 0.004;
            water.material.uniforms.waterColor.value.g -= 0.006;
            water.material.uniforms.waterColor.value.b -= 0.008;
            water.parent.fog.color.r -= 0.008;
            water.parent.fog.color.g -= 0.008;
            water.parent.fog.color.b -= 0.008;
            if (i == 100) clearInterval(anim);
        }, 20);
    } else if (time == 0) {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity += 0.01;
            water.material.uniforms.waterColor.value.r += 0.004;
            water.material.uniforms.waterColor.value.g += 0.006;
            water.material.uniforms.waterColor.value.b += 0.008;
            water.parent.fog.color.r += 0.008;
            water.parent.fog.color.g += 0.008;
            water.parent.fog.color.b += 0.008;
            if (i == 100) clearInterval(anim);
        }, 20);
    }
}
let environment = {};
let water, light, ceiling;

// Main environment setup method
let setUpEnvironment = () => {
    // Set scene background
    scene.background = new THREE.Color(0xd5e1e3);
    renderer.setClearColor(0x00c5ff);

    // Add Fog
    scene.fog = new THREE.FogExp2(0xd5e1e3, 0.01);

    // Add warm and cold ambient lights
    warmAmbientlight = new THREE.AmbientLight(0xffd2ad, 0.7);
    scene.add(warmAmbientlight);
    coldAmbientlight = new THREE.AmbientLight(0xd4efff, 0.3);
    scene.add(coldAmbientlight);

    // Add ceiling
    ceiling = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(worldsize * 1.5, worldsize * 1.5),
        new THREE.MeshBasicMaterial({
            color: 0x00c5ff,
            side: THREE.DoubleSide
        })
    );
    ceiling.rotation.x = -Math.PI * 0.5;
    ceiling.position.set(worldsize * 0.5, 30, worldsize * 0.5)
    scene.add(ceiling)

    // Add directional light
    light = new THREE.DirectionalLight(0xffdfab, 0.8);
    light.position.set(0, 5, 5);
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
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 1.0,
            fog: scene.fog
        });

        water.rotation.x = -Math.PI * 0.5;
        water.position.set(worldsize * 0.5, 0, worldsize * 0.5)

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
            ceiling.material.color.set(lightenColor(0x00c5ff, 100 - i))
            if (i == 100) clearInterval(anim);
        }, 20);
    } else if (time == 0) {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity += 0.01;
            ceiling.material.color.set(lightenColor(0x00c5ff, i))
            if (i == 100) clearInterval(anim);
        }, 20);
    }
}

let lightenColor = (color, percent) => {
    let num = parseInt(color, 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = (num >> 8 & 0x00FF) + amt,
        G = (num & 0x0000FF) + amt;

    console.log(typeof (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1));
};
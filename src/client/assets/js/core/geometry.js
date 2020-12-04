let base_geometries = {
    box: new THREE.BoxBufferGeometry(1, 1, 1),
    sphere: new THREE.SphereBufferGeometry(0.65),
    line: new THREE.Geometry(),
    plane: new THREE.PlaneGeometry(2, 2)
}

// Create reusable bodies.
let geometry = {
    player: base_geometries.box,
    boat: base_geometries.box,
    projectile: base_geometries.sphere,
    hook: base_geometries.plane,
    impact_water: base_geometries.sphere,
    islandradius: new THREE.CylinderBufferGeometry(0.3, 1, 1, 20, 1)
}

// Create models.
let createModels = () => {
    geometry.island = models.island.children[0].geometry;
    geometry.palm = models.island.children[1].geometry;
    geometry.dog_1 = models.dog_1.children[0].geometry;
    geometry.fishingrod = models.fishingrod.children[0].geometry;

    models.sloop.children[0].name = `sail`;
    models.sloop.children[1].name = `body`;
    models.sloop.children[2].name = `mast`;

    models.bigship.children[0].name = `body`;
    models.bigship.children[1].name = `mast`;
    models.bigship.children[2].name = `sail`;

    models.schooner.children[0].name = `body`;
    models.schooner.children[1].name = `mast`;
    models.schooner.children[2].name = `sail`;

    models.vessel.children[0].name = `body`;
    models.vessel.children[1].name = `mast`;
    models.vessel.children[2].name = `sail`;

    models.raft.children[1].name = `body`;
    models.raft.children[0].name = `sail`;

    models.trader.children[2].name = `body`;
    models.trader.children[0].name = `sail`;

    models.boat.children[2].name = `body`;
    models.boat.children[0].name = `sail`;

    models.destroyer.children[1].name = `body`;
    models.destroyer.children[0].name = `sail`;
    
    models.raft.getObjectByName(`body`).material = materials.boat;
    models.raft.getObjectByName(`sail`).material = materials.sail;

    models.trader.getObjectByName(`body`).material = materials.boat;
    models.trader.getObjectByName(`sail`).material = materials.sail;

    models.boat.getObjectByName(`body`).material = materials.boat;
    models.boat.getObjectByName(`sail`).material = materials.sailRed;

    models.destroyer.getObjectByName(`body`).material = materials.boat;
    models.destroyer.getObjectByName(`sail`).material = materials.sail;

    setShipModels();
    setPlayerModels();
}

let createMaterials = () => {
    materials.cannonball = new THREE.SpriteMaterial({ map: textures.cannonball, color: 0xffffff, fog: true });
    materials.fishingrod = new THREE.MeshPhongMaterial({ color: 0xffffff, map: textures.props_diffuse1 });
    materials.colorset = new THREE.MeshLambertMaterial({ map: textures.colorset, side: THREE.DoubleSide });
    materials.hook = new THREE.MeshLambertMaterial({ map: textures.hook, side: THREE.DoubleSide, transparent: true });
    materials.colorsetCaptain = new THREE.MeshLambertMaterial({ map: textures.colorset, side: THREE.DoubleSide, emissive: 0x1C1C1C });
    materials.transparentDetails = new THREE.MeshLambertMaterial({ map: textures.colorset, side: THREE.DoubleSide, opacity: 0.025, transparent: true });
    materials.crate = new THREE.MeshLambertMaterial({ map: textures.crate });
    materials.chest = new THREE.MeshLambertMaterial({ map: textures.chest });

    textures.water.wrapS = textures.water.wrapT = THREE.RepeatWrapping
}

let materials = {
    player: new THREE.MeshLambertMaterial({ color: 0xF9A022 }),
    boat: new THREE.MeshLambertMaterial({ color: 0x8A503E }),
    boat: {
        side: THREE.DoubleSide
    },
    sail: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    sail: {
        side: THREE.DoubleSide
    },
    sailRed: new THREE.MeshLambertMaterial({ color: 0xd9534f }),
    sailRed: {
        side: THREE.DoubleSide
    },
    splinter: new THREE.MeshLambertMaterial({ color: 0xCDAC8F, flatShading: true }),
    projectile: new THREE.MeshPhongMaterial({ color: 0x1E1A28, shininess: 0.9, flatShading: true }),
    boundary: new THREE.MeshLambertMaterial({ color: 0xB4EBFF, flatShading: true, opacity: 0.8, transparent: true }),
    impact_water: new THREE.MeshBasicMaterial({ color: 0xE9F1FF, flatShading: true, opacity: 0.9, transparent: true }),
    islandradius: new THREE.MeshBasicMaterial({ color: 0xbbf3ff, flatShading: false, opacity: 0.2, transparent: true }),
    
    smoke_enemy: new THREE.MeshBasicMaterial({ color: 0xFFCACA, flatShading: true, opacity: 0.7, transparent: true }),
    smoke_friendly: new THREE.MeshBasicMaterial({ color: 0xCDE6FF, flatShading: true, opacity: 0.7, transparent: true }),
    smoke_player: new THREE.MeshBasicMaterial({ color: 0xE01E1E, flatShading: true, opacity: 0.5, transparent: true }),
    fishing_line: new THREE.MeshBasicMaterial({ color: 0x000000, flatShading: true, opacity: 0.5, transparent: true }),
    
    sky: new THREE.MeshBasicMaterial({ color: 0x0AD1FA, side: THREE.BackSide })
}

let labeledColors = {
    player: new THREE.Color(0xffffff),
    myself: new THREE.Color(0x00ff00),
    krewmate: new THREE.Color(0x0275d8),
    captain: new THREE.Color(0xff0000),
    clanmate: new THREE.Color(0xff9800),
    staff: new THREE.Color(0xbb15eb)
}

let vectors = {
    modeloffestCrab: new THREE.Vector3(0, 0.9, 0),
    modeloffsetFishShellClam: new THREE.Vector3(0, 0.3, 0),
    sizeEntity: new THREE.Vector3(1, 1, 1),
    sizePlayer: new THREE.Vector3(1, 1, 1),
    sizeProjectile: new THREE.Vector3(0.3, 0.3, 0.3)
}

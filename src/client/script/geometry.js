let base_geometries = {
    box: new THREE.BoxBufferGeometry(1, 1, 1),
    sphere: new THREE.SphereBufferGeometry(0.65),
    line: new THREE.Geometry(),
    plane: new THREE.PlaneGeometry(2, 2)
};

// create a bunch of reusable bodies
let geometry = {};
geometry.player = base_geometries.box;
geometry.boat = base_geometries.box;
geometry.projectile = base_geometries.sphere;
geometry.hook = base_geometries.plane;
geometry.impact_water = base_geometries.sphere;
geometry.islandradius = new THREE.CylinderBufferGeometry(0.3, 1, 1, 20, 1);

let createModels = function () {
    geometry.island = models.island.children[0].geometry;
    geometry.palm = models.island.children[1].geometry;
    geometry.fishingrod = models.fishingrod.children[0].geometry;

    geometry.seadog = models.seadog.children[0].geometry;
    geometry.shibainu = models.shibainu.children[0].geometry;
    geometry.arcticwolf = models.arcticwolf.children[0].geometry;
    geometry.seafox = models.seafox.children[0].geometry;
    geometry.krewmate = models.krewmate.children[0].geometry;

    models.sloop.children[0].name = `sail`;
    models.sloop.children[1].name = `body`;
    models.sloop.children[2].name = `mast`;

    // Queen Barb's Justice
    models.bigship.children[0].name = `body`;
    models.bigship.children[1].name = `mast`;
    models.bigship.children[2].name = `sail`;

    models.schooner.children[0].name = `body`;
    models.schooner.children[1].name = `mast`;
    models.schooner.children[2].name = `sail`;

    models.vessel.children[0].name = `body`;
    models.vessel.children[1].name = `mast`;
    models.vessel.children[2].name = `sail`;

    // Raft
    models.raft.children[1].name = `body`;
    models.raft.children[0].name = `sail`;

    // Trader
    models.trader.children[2].name = `body`;
    models.trader.children[0].name = `sail`;

    // Boat
    models.boat.children[2].name = `body`;
    models.boat.children[0].name = `sail`;

    // Destroyer
    models.destroyer.children[1].name = `body`;
    models.destroyer.children[0].name = `sail`;

    // Set default materials
    models.raft.getObjectByName(`body`).material = materials.boat;
    models.raft.getObjectByName(`sail`).material = materials.sail;
    models.trader.getObjectByName(`body`).material = materials.boat;
    models.trader.getObjectByName(`sail`).material = materials.sail;
    models.boat.getObjectByName(`body`).material = materials.boat;
    models.boat.getObjectByName(`sail`).material = materials.sailRed;
    models.destroyer.getObjectByName(`body`).material = materials.boat;
    models.destroyer.getObjectByName(`sail`).material = materials.sail;

    // Fortune Trader
    models.ft.children[0].name = `body`;
    models.ft.children[1].name = `mast`;
    models.ft.children[2].name = `sail`;

    // Black Oyster
    models.bo.children[0].name = `body`;
    models.bo.children[1].name = `mast`;
    models.bo.children[2].name = `sail`;

    // Raider
    models.raider.children[0].name = `body`;
    models.raider.children[1].name = `mast`;
    models.raider.children[2].name = `sail`;

    // Junkie
    models.junk.children[0].name = `body`;
    models.junk.children[1].name = `sail`;
    models.junk.children[2].name = `mast`;

    setShipModels();
    setPlayerModels();
};

let createMaterials = function () {
    // items
    // textures['items'].minFilter = THREE.LinearMipMapLinearFilter;
    // textures['items'].magFilter = THREE.LinearMipMapLinearFilter;
    materials.cannonball = new THREE.SpriteMaterial({
        map: textures.cannonball,
        color: 0xffffff,
        fog: true
    });
    materials.fishingrod = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.props_diffuse1
    });
    materials.colorset = new THREE.MeshLambertMaterial({
        map: textures.colorset,
        side: THREE.DoubleSide
    });
    materials.hook = new THREE.MeshLambertMaterial({
        map: textures.hook,
        side: THREE.DoubleSide,
        transparent: true
    });
    materials.colorset_captain = new THREE.MeshLambertMaterial({
        map: textures.colorset,
        side: THREE.DoubleSide,
        emissive: 0x1C1C1C
    });
    materials.transparentDetails = new THREE.MeshLambertMaterial({
        map: textures.colorset,
        side: THREE.DoubleSide,
        opacity: 0.025,
        transparent: true
    });
    materials.crate = new THREE.MeshLambertMaterial({
        map: textures.crate
    });
    materials.chest = new THREE.MeshLambertMaterial({
        map: textures.chest
    });
    // old wave repeat
    /* textures.wave.repeat.set(500, 500);
    textures.wave.wrapT = THREE.RepeatWrapping;
    textures.wave.wrapS = THREE.RepeatWrapping;
    materials.wave = new THREE.MeshBasicMaterial({
        map: textures.wave,
    }); */
    textures.water.wrapS = textures.water.wrapT = THREE.RepeatWrapping;
};

// create a bunch of reusable materials
var materials = {};
materials.player = new THREE.MeshLambertMaterial({
    color: 0xF9A022
});
materials.boat = new THREE.MeshLambertMaterial({
    color: 0x8A503E
});
materials.boat.side = THREE.DoubleSide;
// set color for the sail of traders
materials.sail = new THREE.MeshLambertMaterial({
    color: 0xffffff
});
materials.sail.side = THREE.DoubleSide;
// set color for the sail of boats
materials.sailRed = new THREE.MeshLambertMaterial({
    color: 0xd9534f
});
materials.sailRed.side = THREE.DoubleSide;
materials.splinter = new THREE.MeshLambertMaterial({
    color: 0xCDAC8F,
    flatShading: true
});
materials.projectile = new THREE.MeshPhongMaterial({
    color: 0x1E1A28,
    shininess: 0.9,
    flatShading: true
});
materials.boundary = new THREE.MeshLambertMaterial({
    color: 0xB4EBFF,
    flatShading: true,
    opacity: 0.8,
    transparent: true
});
materials.impact_water = new THREE.MeshBasicMaterial({
    color: 0xE9F1FF,
    flatShading: true,
    opacity: 0.9,
    transparent: true
});
materials.islandradius = new THREE.MeshBasicMaterial({
    color: 0xd4f7ff,
    flatShading: false,
    opacity: 0.2,
    transparent: true
});

materials.smoke_enemy = new THREE.MeshBasicMaterial({
    color: 0xFFCACA,
    flatShading: true,
    opacity: 0.7,
    transparent: true
});
materials.smoke_friendly = new THREE.MeshBasicMaterial({
    color: 0xCDE6FF,
    flatShading: true,
    opacity: 0.7,
    transparent: true
});
materials.smoke_player = new THREE.MeshBasicMaterial({
    color: 0xE01E1E,
    flatShading: true,
    opacity: 0.5,
    transparent: true
});
materials.fishing_line = new THREE.MeshBasicMaterial({
    color: 0x000000,
    flatShading: true,
    opacity: 0.5,
    transparent: true
});

materials.sky = new THREE.MeshBasicMaterial({
    color: 0x00c5ff,
    side: THREE.DoubleSide
});

// colors for text labels for player & boat names
let labelcolors = {};
labelcolors.staff = new THREE.Color(0xbb15eb);
labelcolors.myself = new THREE.Color(0x00ff00);
labelcolors.player = new THREE.Color(0xffffff);
labelcolors.captain = new THREE.Color(0xff0000);

let vectors = {};
vectors.modeloffsetCrab = new THREE.Vector3(0, 0.9, 0);
vectors.modeloffsetFishShellClam = new THREE.Vector3(0, 0.3, 0);
vectors.sizeEntity = new THREE.Vector3(1, 1, 1);
vectors.sizePlayer = new THREE.Vector3(1, 1, 1);
vectors.sizeProjectile = new THREE.Vector3(0.3, 0.3, 0.3);

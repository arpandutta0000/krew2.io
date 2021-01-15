/* Load models from files */
let loadModels = () => {
    // Items
    loader.loadObjWithMtl(`./assets/models/cannon/cannon.obj`);
    loader.loadModel(`./assets/models/fishingrod.obj`);
    loader.loadObjWithMtl(`./assets/models/spyglass.obj`);

    // Load Boats
    loader.loadModel(`./assets/models/ships/raft.obj`);
    loader.loadModel(`./assets/models/ships/boat.obj`);
    loader.loadModel(`./assets/models/ships/trader.obj`);
    loader.loadModel(`./assets/models/ships/destroyer.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/schooner.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/bigship.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/sloop.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/vessel.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/junk.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/raider.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/bo.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/ft.obj`);

    // Load projectiles
    loader.loadTexture(`./assets/img/cannonball.png`);
    loader.loadTexture(`./assets/models/hook.png`);
    loader.loadObjWithMtl(`./assets/models/fish.obj`);

    // Load dogs
    loader.loadModel(`./assets/models/dogs/seadog.obj`);
    loader.loadModel(`./assets/models/dogs/shibainu.obj`);
    loader.loadModel(`./assets/models/dogs/arcticwolf.obj`);
    loader.loadModel(`./assets/models/dogs/seafox.obj`);
    loader.loadModel(`./assets/models/dogs/krewmate.obj`);
    loader.loadTexture(`./assets/models/dogs/seadog.tga`);
    loader.loadTexture(`./assets/models/dogs/shibainu.tga`);
    loader.loadTexture(`./assets/models/dogs/arcticwolf.tga`);
    loader.loadTexture(`./assets/models/dogs/seafox.tga`);
    loader.loadTexture(`./assets/models/dogs/krewmate.tga`);

    // Load hats
    loader.loadObjWithMtl(`./assets/models/hat_pirate.obj`);

    // Load islands
    loader.loadModel(`./assets/models/island.obj`);

    // Load island pickups
    loader.loadObjWithMtl(`./assets/models/shell.obj`);
    loader.loadObjWithMtl(`./assets/models/crab.obj`);
    loader.loadObjWithMtl(`./assets/models/clam.obj`);

    // Load sea pickups
    loader.loadObjWithMtl(`./assets/models/chest.obj`);
    loader.loadTexture(`./assets/img/crate.jpg`);

    // Load misc textures
    loader.loadTexture(`./assets/models/colorset.png`);
    loader.loadTexture(`./assets/models/props_diffuse1.tga`);
    loader.loadTexture(`./assets/img/water.jpg`);

    // Christmas Models
    // loader.loadObjWithMtl('./assets/models/elka.obj');
    // loader.loadObjWithMtl('./assets/models/snowman.obj');

    // Once loader is done, create the objects in the world
    loader.onFinish(() => {
        createModels();
        createMaterials();
        createGame();
        threejsStarted = true;

        $(`#play-button`).text(`Play as guest`).attr(`disabled`, false);
        if (!(ui.getCookie(`username`) && ui.getCookie(`token`))) {
            ui.getKrewioData();
        } else {
            ui.username = ui.getCookie(`username`);
            ui.prepareForPlay();
        }
    });
};

/* Function to set model geometry */
let createModels = () => {
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

    // Call setting ship and player models
    setShipModels();
    setPlayerModels();
};

/* Create materials from textures */
let createMaterials = () => {
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

    textures.water.wrapS = textures.water.wrapT = THREE.RepeatWrapping;
};
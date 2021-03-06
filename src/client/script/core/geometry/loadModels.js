/**
 * Load all models
 */
let loadModels = () => {
    let startedLoading = performance.now();

    // Load decorations
    if (config.christmasTree[0]) loader.loadObjWithMtl(`./assets/models/decorations/christmasTree.obj`);
    if (config.snowman[0]) loader.loadObjWithMtl(`./assets/models/decorations/snowman.obj`);

    // Load dogs
    loader.loadModel(`./assets/models/dogs/seadog.obj`);
    loader.loadTexture(`./assets/models/dogs/seadog.tga`);
    loader.loadModel(`./assets/models/dogs/shibainu.obj`);
    loader.loadTexture(`./assets/models/dogs/shibainu.tga`);
    loader.loadModel(`./assets/models/dogs/arcticwolf.obj`);
    loader.loadTexture(`./assets/models/dogs/arcticwolf.tga`);
    loader.loadModel(`./assets/models/dogs/seafox.obj`);
    loader.loadTexture(`./assets/models/dogs/seafox.tga`);
    loader.loadModel(`./assets/models/dogs/krewmate.obj`);
    loader.loadTexture(`./assets/models/dogs/krewmate.tga`);
    loader.loadModel(`./assets/models/dogs/skeleton.obj`);
    loader.loadTexture(`./assets/models/dogs/skeleton.tga`);
    loader.loadModel(`./assets/models/dogs/commodore.obj`);
    loader.loadTexture(`./assets/models/dogs/commodore.tga`);
    // Staff dogs
    loader.loadModel(`./assets/models/dogs/br88c.obj`);
    loader.loadTexture(`./assets/models/dogs/br88c.tga`);

    // Load hats
    loader.loadObjWithMtl(`./assets/models/hats/pirateHat.obj`);
    loader.loadObjWithMtl(`./assets/models/hats/sailorHat.obj`);
    loader.loadObjWithMtl(`./assets/models/hats/shipMasterHat.obj`);

    // Load islands
    loader.loadModel(`./assets/models/islands/island.obj`);
    loader.loadTexture(`./assets/models/islands/island.png`);

    // Load pickups
    loader.loadObjWithMtl(`./assets/models/pickups/shell.obj`);
    loader.loadObjWithMtl(`./assets/models/pickups/crab.obj`);
    loader.loadObjWithMtl(`./assets/models/pickups/clam.obj`);
    loader.loadObjWithMtl(`./assets/models/pickups/chest.obj`);
    loader.loadTexture(`./assets/models/pickups/crate.jpg`);
    loader.loadObjWithMtl(`./assets/models/pickups/fish.obj`);

    // Load projectiles
    loader.loadTexture(`./assets/models/projectiles/cannonball.png`);
    loader.loadTexture(`./assets/models/projectiles/hook.png`);

    // Load ships
    loader.loadObjWithMtl(`./assets/models/ships/babyFancy.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/blackOyster.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/boat.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/calmSpirit.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/destroyer.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/fortuneTrader.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/junkie.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/queenBarbsJustice.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/raft.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/raider.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/royalFortune.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/trader.obj`);

    // Load tools
    loader.loadObjWithMtl(`./assets/models/tools/cannon.obj`);
    loader.loadModel(`./assets/models/tools/fishingrod.obj`);
    loader.loadTexture(`./assets/models/tools/fishingrod.tga`);
    loader.loadObjWithMtl(`./assets/models/tools/spyglass.obj`);

    // Load misc objects
    loader.loadObjWithMtl(`./assets/models/misc/lostTreasure.obj`);
    loader.loadTexture(`./assets/models/misc/water.jpg`);

    // Once loader is done, create the objects in the world
    loader.onFinish(() => {
        createModels();
        createMaterials();
        createGame();
        threejsStarted = true;
        console.log(`\nLoaded all models in ${Math.round((performance.now() - startedLoading) * 1e3) / 1e3}ms\n\n`);

        $(`#play-button`).text(`Play as guest`).attr(`disabled`, false);
        if (!(headers.getCookie(`username`) && headers.getCookie(`token`))) initLoginRegister();
        else {
            headers.username = headers.getCookie(`username`);
            addLogout();
        }
    });
};

/**
 * Set model geometry, materials, etc
 */
let createModels = () => {
    geometry.island = models.island.children[0].geometry;
    if (config.palmTree[0]) geometry.palm = models.island.children[1].geometry;
    geometry.fishingrod = models.fishingrod.children[0].geometry;

    geometry.seadog = models.seadog.children[0].geometry;
    geometry.shibainu = models.shibainu.children[0].geometry;
    geometry.arcticwolf = models.arcticwolf.children[0].geometry;
    geometry.seafox = models.seafox.children[0].geometry;
    geometry.krewmate = models.krewmate.children[0].geometry;
    geometry.skeleton = models.skeleton.children[0].geometry;
    geometry.br88c = models.br88c.children[0].geometry;
    geometry.commodore = models.commodore.children[0].geometry;

    // Baby Fancy
    models.babyFancy.children[0].name = `sail`;
    models.babyFancy.children[1].name = `body`;
    models.babyFancy.children[2].name = `mast`;

    // Black Oyster
    models.blackOyster.children[0].name = `body`;
    models.blackOyster.children[1].name = `mast`;
    models.blackOyster.children[2].name = `sail`;

    // Boat
    models.boat.children[0].name = `sail`;
    models.boat.children[1].name = `mast`;
    models.boat.children[2].name = `body`;

    // Calm Spirit
    models.calmSpirit.children[0].name = `body`;
    models.calmSpirit.children[1].name = `mast`;
    models.calmSpirit.children[2].name = `sail`;

    // Destroyer
    models.destroyer.children[0].name = `mast`;
    models.destroyer.children[1].name = `sail`;
    models.destroyer.children[2].name = `body`;

    // Fortune Trader
    models.fortuneTrader.children[0].name = `body`;
    models.fortuneTrader.children[1].name = `mast`;
    models.fortuneTrader.children[2].name = `sail`;

    // Junkie
    models.junkie.children[0].name = `body`;
    models.junkie.children[1].name = `sail`;
    models.junkie.children[2].name = `mast`;

    // Queen Barb's Justice
    models.queenBarbsJustice.children[0].name = `body`;
    models.queenBarbsJustice.children[1].name = `mast`;
    models.queenBarbsJustice.children[2].name = `sail`;

    // Raft
    models.raft.children[1].name = `body`;
    models.raft.children[2].name = `mast`;
    models.raft.children[0].name = `sail`;

    // Raider
    models.raider.children[0].name = `body`;
    models.raider.children[1].name = `mast`;
    models.raider.children[2].name = `sail`;

    // Royal Fortune
    models.royalFortune.children[0].name = `body`;
    models.royalFortune.children[1].name = `mast`;
    models.royalFortune.children[2].name = `sail`;

    // Trader
    models.trader.children[0].name = `body`;
    models.trader.children[1].name = `mast`;
    models.trader.children[2].name = `sail`;

    // Call setting ship, player, and hat models
    BoatModels.setShipModels();
    PlayerModels.setPlayerModels();
    PlayerModels.setHatModels();
};

/**
 * Create materials from textures
 */
let createMaterials = function () {
    materials.cannonball = new THREE.SpriteMaterial({
        map: textures.cannonball,
        color: 0xffffff,
        fog: true
    });
    materials.fishingrod = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.fishingrod
    });
    materials.island = new THREE.MeshLambertMaterial({
        map: textures.island,
        side: THREE.DoubleSide
    });
    materials.hook = new THREE.MeshLambertMaterial({
        map: textures.hook,
        side: THREE.DoubleSide,
        transparent: true
    });
    materials.crate = new THREE.MeshLambertMaterial({
        map: textures.crate
    });

    textures.water.wrapS = textures.water.wrapT = THREE.RepeatWrapping;
};

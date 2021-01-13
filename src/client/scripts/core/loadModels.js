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
}
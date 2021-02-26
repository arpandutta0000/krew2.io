global.entities = entities;
let compressor = require(`../compressor/compressor.js`);

let createPlayer = function (data) {
    data = data || {};
    data.startingItems = Object.assign({}, Config.startingItems);
    data.disableSnapAndDelta = true;

    let player = new Player(data);
    if (data.playerModel) player.playerModel = data.playerModel;
    if (data.hatModel) player.hatModel = data.hatModel;

    // real player
    if (TEST_ENV) {
        // if (data && players[player.id] === undefined) {
        if (data) {
            player.id = data.socketId;
        } else {
            player.id = randomid();
        }
    } else {
        player.id = data.socketId;
    }

    // add player to global array variables
    players[player.id] = player;
    entities[player.id] = player;
    return player;
};

let createPickup = function (size, x, z, type, collisionIsland, specialBonus) {
    x = Math.min(Math.max(0, x), worldsize);
    z = Math.min(Math.max(0, z), worldsize);

    // check if it is in island position
    if (!collisionIsland) {
        for (l in entities) {
            if (entities[l].netType === 5 && (type === 0 || type === 4)) {
                if (entities[l].isWithinDockingRadius(x, z)) {
                    // console.log("stopped pickup from spawning in docking radius")
                    return;
                }
            }
        }
    }

    // core.createPickup
    let id;
    while (!id || entities[id] !== undefined) {
        id = randomid();
    }

    let p = new Pickup(size, x, z, type, specialBonus);
    p.id = id;

    pickups[id] = p;
    entities[id] = p;

    return p;
};

let createBoat = function (captainId, krewName, spawnBool) {
    let id;
    while (!id || entities[id] !== undefined) {
        id = randomid();
    }

    let err = new Error();

    let b = new Boat(captainId, krewName, spawnBool);
    b.id = id;

    boats[id] = b;
    entities[id] = b;
    return b;
};

let createLandmark = function (type, x, z, name) {
    let id;
    while (!id || entities[id] !== undefined) {
        id = randomid();
    }

    let l = new Landmark(type, x, z, name);
    l.id = id;
    Landmarks[id] = l;
    entities[id] = l;
    return l;
};

let createBot = function () {
    let id;
    while (!id || entities[id] !== undefined) {
        id = randomid();
    }

    let b = new Bot();
    b.id = id;
    bots[id] = b;
    entities[id] = b;
    return b;
};

let removeEntity = function (entity) {
    // remove it from entities object
    if (entity && entities.hasOwnProperty(entity.id)) {
        entity.onDestroy();
        compressor.events[entity.id] = {
            del: true
        };
        let id = entity.id;
        delete entities[id];
    }
};

let randomid = () => Math.random().toString(36).substring(6, 10);

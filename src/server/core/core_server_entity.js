global.entities = entities;
var compressor = require('../compressor/compressor.js');

var createPlayer = function (data) {
    data = data || {};
    data.startingItems = Object.assign({}, Config.startingItems);
    data.disableSnapAndDelta = true;

    var player = new Player(data);

    // real player
    if (TEST_ENV) {
        //if (data && players[player.id] === undefined) {
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

var createPickup = function (size, x, z, type, collisionIsland, specialBonus) {

    var x = Math.min(Math.max(0, x), worldsize);
    var z = Math.min(Math.max(0, z), worldsize);
    // check if it is in island position
    if (!collisionIsland){
        for (l in entities) {
            if (entities[l].netType == 5 && (type == 0 || type == 4)) {
                if (entities[l].isWithinDockingRadius(x, z)) {
                    //console.log("stopped pickup from spawning in docking radius")
                    return;
                }
            }
        }
    }

    //core.createPickup
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    var p = new Pickup(size, x, z, type, specialBonus);
    p.id = id;

    pickups[id] = p;
    entities[id] = p;

    return p;
};

var createBoat = function (captainId, krewName, spawnBool) {
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    let err = new Error();

    var b = new Boat(captainId, krewName, spawnBool);
    b.id = id;

    boats[id] = b;
    entities[id] = b;
    return b;
};

var createLandmark = function (type, x, z, name) {
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    var l = new Landmark(type, x, z, name);
    l.id = id;
    Landmarks[id] = l;
    entities[id] = l;
    return l;
};

var createBot = function () {
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    var b = new Bot();
    b.id = id;
    bots[id] = b;
    entities[id] = b;
    return b;
};

var removeEntity = function (entity) {

    // remove it from entities object
    if (entity && entities.hasOwnProperty(entity.id)) {
        entity.onDestroy();
        compressor.events[entity.id] = { del: true };
        var id = entity.id;
        delete entities[id];
    }

};

var randomid = function () {
    return Math.random().toString(36).substring(6, 10);
};

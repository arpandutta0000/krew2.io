global.entities = entities;

let compressor = require(`../compressor/compressor.js`);

let createPlayer = data => {
    data = data || {}
    data.startingItems = Object.assign({}, Config.startingItems);
    data.disableSnapAndDelta = true;

    let player = new Player(data);

    // Real player.
    if(TEST_ENV) {
        if(data) player.id = data.socketId;
        else player.id = randomID();
    }
    else player.id = data.socketId;

    // Add player to global array variables.
    players[player.id] = player;
    entities[player.id] = player;
    return player;
}

let createPickup = (size, x, z, type, collisionIsland, specialBonus) => {
    let x = Math.min(Math.max(0, x), worldsize);
    let z = Math.min(Math.max(0, z), worldsize);

    // Check if it is in island position.
    if(!collisionIsland) {
        entities.forEach(entity => {
            if(entity.netType == 5 && (type == 0 || type == 4)) {
                if(entity.isWithinDockingRadius(x, z)) return;
            }
        });
    }

    let id;
    while(!id || entities[id] != undefined) id = randomID();

    let p = new Pickup(size, x, z, type, specialBonus);
    p.id = id;

    pickups[id] = p;
    entities[id] = p;

    return p;
}

let createBoat = (captainId, krewName, spawnBool) => {
    let id;
    while(!id || entities[id] != undefined) id = randomID();

    let b = new Boat(captainId, krewName, spawnBool);
    b.id = id;

    boats[id] = b;
    entities[id] = b;

    return b;
}

let createLandmark = (type, x, z, name) => {
    let id;
    while(!id || entities[id] != undefined) id = randomID();

    let l = new Landmarks(type, x, z, name);
    l.id = id;

    Landmarks[id] = l;
    entities[id] = l;

    return l;
}

let createBot = () => {
    let id;
    while(!id || entities[id] != undefined) id = randomID();

    let b = new bots();
    b.id = id;

    bots[id] = b;
    entities[id] = b;

    return b;
}

let removeEntity = entity => {
    // Remove it from entities object.
    if(entity && entities.hasOwnProperty(entity.id)) {
        entity.onDestroy();
        compressor.events[entity.id] = { del: true }
        delete entities[entity.id];
    }
}

let randomID = () => {
    return Math.random().toString(36).substring(6, 10);
}
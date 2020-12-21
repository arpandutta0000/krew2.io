let entities = {};

let boats = {};
let players = {};
let playerNames = {};
let sceneCanBalls = {};
let sceneLines = {};
let Landmarks = {};
let pickups = {};
let bots = {};

let worldsize = 1700; // 1000 is default

let iterateEntities = function (dt) {

    // tick each entity
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].tick(dt);
        }
    }
};
let entities = {}

let boats = {}
let players = {}
let playerNames = {}
let sceneCanBalls = {}
let sceneLines = {}
let Landmarks = {}
let pickups = {}
let bots = {}

// 1000 is the default worldsize.
let { worldsize } = require(`../src/server/config/gameConfig.js`);

let iterateEntities = dt => {
    // Tick each entity.
    for(let i in entities) {
        if(entities.hasOwnProperty(i)) entities[i].tick(dt);
    }
}

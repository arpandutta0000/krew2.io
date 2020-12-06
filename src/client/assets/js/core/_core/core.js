let entities = {}

let boats = {}
let players = {}
let playerNames = {}
let sceneCanBalls = {}
let sceneLines = {}
let Landmarks = {}
let pickups = {}
let bots = {}

let worldsize = 1700; // The default worldsize is 1000.

let iterateEntities = dt => {
    // Tick each entity.
    for(let i in entities) if(entities.hasOwnProperty(i)) entities[i].tick(dt);
}

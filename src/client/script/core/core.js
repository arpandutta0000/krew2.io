/* Create global variables used throughout the client */
let renderer, scene, camera, myPlayer, myBoat, domEvents, raycaster, canvas, gl, defaultWidth, defaultHeight, SERVER;

let boats = {};
let bots = {};
let entities = {};
let Landmarks = {};
let markers = {};
let pickups = {};
let playerNames = {};
let players = {};
let sceneCanBalls = {};
let sceneLines = {};

let threejsStarted = false;
let countDown = 10;
let playerName = ``;
let worldsize = config.worldsize;

/* Create function to iterate through each entity */
let iterateEntities = (dt) => {
    // Tick each entity
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].tick(dt);
        }
    }
};

/* Create global variables used throughout the client*/
let renderer, scene, camera, myPlayer, myBoat, domEvents, raycaster, canvas, gl, defaultWidth, defaultHeight, SERVER;
let entities, markers, boats, players, playerNames, sceneCanBalls, sceneLines, Landmarks, pickups, bots = {};
let threejsStarted = false;
let countDown = 10;
let playerName = ``;
let worldsize = config.worldsize;

let iterateEntities = (dt) => {
    // Tick each entity
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].tick(dt);
        }
    }
};

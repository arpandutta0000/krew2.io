var entities = {};

var boats = {};
var players = {};
var playerNames = {};
var sceneCanBalls = {};
var sceneLines = {};
var Landmarks = {};
var pickups = {};
var bots = {};

var worldsize = 2500; // 1000 is default

var iterateEntities = function (dt) {

    // tick each entity
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].tick(dt);
        }
    }
};
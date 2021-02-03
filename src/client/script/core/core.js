/* Create global variables used throughout the client */
let renderer, scene, camera, myPlayer, myBoat, domEvents, raycaster, canvas, gl, defaultWidth, defaultHeight, SERVER;

let boats = {};
let bots = {};
let entities = {};
let markers = {};
let pickups = {};
let playerNames = {};
let players = {};
let sceneCanBalls = {};
let sceneLines = {};

let threejsStarted = false;
let countDown = 10;
let playerName = ``;

/* Create function to iterate through each entity */
let iterateEntities = (dt) => {
    // Tick each entity
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].tick(dt);
        }
    }
};

/** --------------- Information --------------- **
 * 
 * -- Net Types --
 * -1 = Standard Entity
 * 0 = Player
 * 1 = Boat
 * 2 = Projectile
 * 3 = Impact
 * 4 = Pickup ( Fish / Crab / Shell / Cargo / Chest)
 * 5 = Island
 * 6 = Bot / Misc
 * 
 * -- Ship States --
 * -1 = Starting
 * 0 = Sailing
 * 1 = Docking
 * 2 = Finished Docking
 * 3 = Anchored
 * 4 = Departing
 *
 * -- Projectiles --
 * 0 = Cannonball
 * 1 = Fishing hook
 * 
 * -- Pickups --
 * 0 = Crate
 * 1 = Fish
 * 2 = Static island pickups
 * 3 = Island animals
 * 4 = Chests
 * 
 * -- Weapons --
 * -1 = Nothing
 * 0 = Cannon
 * 1 = Fishing Rod
 * 2 = Spyglass
 *
 * -- Player States --
 * 0 = Alive
 * 1 = Dead
 * 2 = Respawning
 * 
 ** ------------------------------------------- **
 */
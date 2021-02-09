/* Create global variables to be used throughout the client */
let camera, ceiling, controls, coldAmbientlight, defaultHeight, defaultWidth, envSphere, gl, keyboard, light, myPlayer, raycaster, renderer, scene, socket, warmAmbientlight, water;

let boats = {};
let entities = {};
let environment = {};
let markers = {};
let models = {};
let pickups = {};
let playerNames = {};
let players = {};
let sceneCanBalls = {};
let sceneLines = {};
let textures = {};

let dogModels = [];
let fpsTimes = [];
let particles = [];
let staffDogModels = [];

let playerName = ``;

let countDown = 10;
let fov = 1;
let goldMultiplier = 2000;
let middle = config.worldsize / 2;
let secondsAlive = 0;

let adBlockEnabled = false;
let threejsStarted = false;

let staffChatOn = false;
let clanChatOn = false;
let localChatOn = false;
let globalChatOn = true;

let keys_walkLeft = false;
let keys_walkRight = false;
let keys_walkFwd = false;
let keys_walkBwd = false;
let keys_rotRight = false;
let keys_rotLeft = false;
let keys_jump = false;
let keys_boot = false;

let textureLoader = new THREE.TextureLoader();
let fileLoader = new THREE.FileLoader();
let objLoader = new THREE.OBJLoader();
let tgaLoader = new THREE.TGALoader();
let mtlLoader = new THREE.MTLLoader();

let time = performance.now();

let Store = {
    $shoppingList: $(`#shopping-item-list`)
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
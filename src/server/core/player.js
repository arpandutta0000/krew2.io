// Players are entities, check entity.js for the base class.
Player.prototype = new Entity();
Player.prototype.constructor = Player;

const Player = data => {
    this.isLoggedIn = true;
    this.name = data != undefined ? (data.name || ``): ``;

    if(this.name.trim() == ``) {
        this.name = `seadog${Math.floor(Math.random() * 900) + 100}`;
        this.isLoggedIn = false;
    }

    this.createProperties();
    this.disableSnapAndDelta = data.disableSnapAndDelta ? true: false;

    this.goods = Object.assign({}, data.startingItems.goods);
    this.cargoUsed = 0;

    // Stand on top of the boat.
    this.CaretPosition.y = 0.0;

    // Netcode type.
    this.netType = 0; // When parseSnap reads this, netType of 0 means new player.

    // Size of a player.
    this.size = new THREE.Vector3(1, 1, 1);

    // Players can walk forward and sideward. 1 = forward, 0 = stop, -1 = backward, etc.
    this.walkForward = 0;
    this.walkSideward = 0; 

    // Players can use whatever they are holding.
    this.use = false;
    this.useid = 0; // Helper value to predict the id of the next cannonball.
    this.cooldown = 0;

    // Players have a pitch value (The angle at which they look into the sky).
    this.pitch = 0;
    this.score = 50; // Player score.
    this.salary = 0; // Player salary (deprecated).
    this.overallCargo = 0; // Sum of the amount of cargo that the player has ever traded.
    this.lastIsland = ``; // Last island the player bought goods on.
    this.gold = (data.startingItems || {}).gold || 0, // Player gold.

    this.islandBoundary = { x: 0, z: 0 } //To limit boundaries around island.
    this.shipsSank = 0; // Number of ships player has sunk.
    this.shotsFired = 0; // NUmber of projectiles player has fired.
    this.shotsHit = 0; // Number of projectiles that have hit other ships.

    this.sentDockingMsg = false; // Used to stop server from emitting enterIsland message before docking.

    // Keep track of player state.
    this.state = {
        alive: 0,
        dead: 1,
        respawning: 2
    }
    this.state = 0;

    this.activeWeapon = {
        nothing: -1,
        cannon: 0,
        fishingRod: 1,
        spyglass: 2
    }
    this.activeWeapon = 0;

    this.justLogged = true;
    this.isFishing = false;

    this.checkedItemsList = false; // If player's boat docked into island and already checked island list.
    this.rareItemsFound = []; // Rare items found when player docks into island.

    this.rodRotationSpeed = (Math.random() * 0.25) + 0.25; // Rotation speed for fishing rod.

    // Players keep track of whether they are captain or not.
    this.isCaptain = false;
    this.oldCaptainState = false; // This is a helper value that just helps us keep track of when our captain state changes.

    // Anti-chat measures.
    this.sentMessages = [];
    this.lastMessagesSentAt = undefined;
    this.isSpammer = false;
    this.lastMoved = new Date();

    this.jumping = 0;
    this.jumpCount = 0;

    this.itemId;

    this.ownsCannon = true;
    this.ownsFishingRod = true;
    
    this.attackSpeedBonus = 0;
    this.attackDamageBonus = 0;
    this.attackDistanceBonus = 0;
    this.movementSpeedBonus = 0;
    this.armorBonus = 0;

    // Leveling system.
    this.level = 0;
    this.experience = 0;
    this.experienceBase = 100;
    this.experienceMaxLevel = 50;

    // Bank and casino.
    this.bank = { deposit: 0 }
    this.casino = {}
    this.markerMapCount = new Date();

    
}
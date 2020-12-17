var THREE = require('../../client/libs/three.min.js');
var SERVER = true;

var entities = {};

var boats = {};
var players = {};
var playerNames = {};
var sceneCanBalls = {};
var sceneLines = {};
var Landmarks = {};
var pickups = {};
var bots = {};

var worldsize = 1700; // 1000 is default

var iterateEntities = function (dt) {

    // tick each entity
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {entities[e].tick(dt);}
    }
};

var lerp = function (start, end, amount) {
    return (1 - amount) * start + amount * end;
};

var charLimit = function (text, chars, suffix) {
    chars = chars || 140;
    suffix = suffix || '';
    text = ('' + text).replace(/(\t|\n)/gi, '').replace(/\s\s/gi, ' ');
    if (text.length > chars) {
        return text.slice(0, chars - suffix.length).replace(/(\.|\,|:|-)?\s?\w+\s?(\.|\,|:|-)?$/, suffix);
    }

    return text;
};

var entityDistance = function (a, b) {
    return Math.sqrt((a.position.x - b.position.x) * (a.position.x - b.position.x) + (a.position.z - b.position.z) * (a.position.z - b.position.z));
};

function distance(p1, p2) {
    var dx = p2.x - p1.x;
    var dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function worldAngle(vector) {
    var result = vector.angle() + Math.PI * 0.5;
    if (result > Math.PI * 2) {
        result -= Math.PI * 2;
    }

    result = Math.PI * 2 - result;
    return result;
}

function anglediff(firstAngle, secondAngle) {
    var difference = secondAngle - firstAngle;
    while (difference < -Math.PI) {difference += Math.PI * 2.0;}

    while (difference > Math.PI) {difference -= Math.PI * 2.0;}

    return difference;
}

function angleToVector(angle) {
    return new THREE.Vector2(-Math.sin(angle), -Math.cos(angle));
}

function rotationToPosition(origin, target) {
    return worldAngle(new THREE.Vector2(target.x - origin.x, target.z - origin.z));
}

function rotationToObject(origin, target) {
    return worldAngle(new THREE.Vector2(target.position.x - origin.position.x, target.position.z - origin.position.z));
}

function distanceToPosition(origin, target) {
    return origin.position.distanceTo(target);
}

function distanceToPositionSquared(origin, target) {
    return origin.position.distanceToSquared(target);
}

function distanceToObject(origin, target) {
    return origin.position.distanceTo(target.position);
}

function distanceToObjectSquared(origin, target) {
    return origin.position.distanceToSquared(target.position);
}

/**
 * This method checks if a 3d object is in the players vision range
 * Is created with a factory function to create the frustum only once and
 * not on every check
 * @return {Boolean}
 */
var inPlayersVision = (function () {
    var frustum = new THREE.Frustum();
    /**
     * This is the exported function that will used for the check
     * @param  {Object} object3d    It must be a 3d object with a position property
     * @param  {Object} camera      It must be the camera to compare with
     * @return {Boolean}            Returns true if the player sees the object or false on the contrary
     */
    var inPlayersVision = function (object3d, camera) {
            // If the object has no position property just return false
            if (object3d.position === undefined) {
                return false;
            }

            camera.updateMatrix();
            camera.updateMatrixWorld();

            frustum.setFromMatrix(
                new THREE.Matrix4()
                    .multiplyMatrices(
                        camera.projectionMatrix,
                        camera.matrixWorldInverse
                    )
            );

            // Return if the object is in the frustum
            return frustum.containsPoint(object3d.position);
        };

    // Returns the final function
    return inPlayersVision;
})();

function getFixedFrameRateMethod(fps, callback) {
    fps = fps || 5;
    var time = performance.now();
    var previousTime = performance.now();
    var method = function () {
        time = performance.now();
        if (time - previousTime > 1000 / fps) {
            previousTime = time;
            if (typeof callback === 'function') {
                requestAnimationFrame(callback.bind(this));
            }
        }
    };

    return method;
}

var goodsTypes = {
    // water: { drainRate: 1, cargoSpace: 1 },
    // food: { drainRate: 1, cargoSpace: 1 },
    // wood: { drainRate: 1, cargoSpace: 1 },
    // gunpowder: { drainRate: 1, cargoSpace: 1 },

    // Current trading goods starts here
    rum: { drainRate: 0, cargoSpace: 5 },
    coffee: { drainRate: 0, cargoSpace: 8 },
    spice: { drainRate: 0, cargoSpace: 8 },
    silk: { drainRate: 0, cargoSpace: 12 },
};

function Entity() {

}

Entity.prototype.createProperties = function () {
        // Each and every thing in the game has a position and a velocity
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Everything has a size and rotation (y axis), and in terms of logic, everything is a box
        this.size = new THREE.Vector3(1, 1, 1);
        this.rotation = 0;
        this.collisionRadius = 1;

        // Things can have a parent entity, for example a boat, which is a relative anchor in the world. things that dont have a parent, float freely
        this.parent = undefined;
        this.children = {};

        this.isNew = true; // if this is a new guy entering the server

        // Things have a unique ID, which is used to identify things in the engine and via netcode
        // this.id = "";

        // things have a netcode type
        this.netType = -1;

        // last snap, stores info to be able to get delta snaps
        this.sendSnap = true;   // decide if we want to send the snapshots (full entity info) once a second
        this.sendDelta = true;  // decide if we want to send the delta information if there is a change (up to 10 times a second)

        // if this is set to true, but sendSnap isnt, then it will simply send the first delta
        // as a full snap (good for things that only sned their creation)
        this.sendCreationSnapOnDelta = true;
        //"true" to disable snap and delta completely
        this.disableSnapAndDelta = false;
        this.last = {};
        this.lastType = {};

        // some entities have muted netcode parts
        this.muted = [];
    };

Entity.prototype.tick = function (dt) {

    // compute the base class logic. this is set by the children classes
    this.logic(dt);

    // move ourselves by the current speed
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
};

// function that generates a snapshot
Entity.prototype.getSnap = function (force) {
    if (!force && !this.sendSnap || this.disableSnapAndDelta) {
        return undefined;
    }

    if (this.rotation === undefined) {
        console.log(this); // Bots don't have a rotation so this fails
    }

    var snap = {
        p: this.parent ? this.parent.id : undefined,
        n: this.netType, // netcode id is for entity type (e.g. 0 player)
        x: this.position.x.toFixed(2), // x and z position relative to parent
        y: this.position.y.toFixed(2),
        z: this.position.z.toFixed(2),
        r: (this.rotation || 0).toFixed(2), // rotation
        t: this.getTypeSnap(), // type based snapshot data
    };
    // pass name variable if we're first time creating this entity
    if (this.netType === 0 && this.isNew) {
        snap.name = this.name;
        snap.id = this.id;
        this.isNew = false;
    }
    return snap;
};

// function that generates a snapshot
Entity.prototype.getDelta = function () {

    if (!this.sendDelta && !this.sendCreationSnapOnDelta || this.disableSnapAndDelta) {
        return undefined;
    }

    // send a full snapshot on the delta data, for creation?
    if (this.sendCreationSnapOnDelta) {
        var result = this.getSnap(true);
        this.sendCreationSnapOnDelta = false;
        return result;
    }

    var delta = {
        p: this.deltaCompare('p', this.parent ? this.parent.id : undefined),
        n: this.deltaCompare('n', this.netType),
        x: this.deltaCompare('x', this.position.x.toFixed(2)),
        y: this.deltaCompare('y', this.position.y.toFixed(2)),
        z: this.deltaCompare('z', this.position.z.toFixed(2)),
        r: this.deltaCompare('r', this.rotation.toFixed(2)),
        t: this.getTypeDelta(),
    };

    if (isEmpty(delta)) {
        delta = undefined;
    }

    return delta;
};

// function that parses a snapshot
Entity.prototype.parseSnap = function (snap, id) {
    if (snap.t !== undefined) {
        this.parseTypeSnap(snap.t);
    }

    if (!this.isPlayer) {
        if (snap.x !== undefined && typeof(snap.x) === "number") {this.position.x = parseFloat(snap.x);}

        if (snap.y !== undefined && typeof(snap.y) === "number") {this.position.y = parseFloat(snap.y);}

        if (snap.z !== undefined && typeof(snap.z) === "number") {this.position.z = parseFloat(snap.z);}

        if (snap.r !== undefined && typeof(snap.r) === "number") {this.rotation = parseFloat(snap.r);}
    }
};

Entity.prototype.addChildren = function (entity) {
    // remove entity from its previous parent
        /*if (entity !== undefined &&
            entity.parent !== undefined
         && entity.parent.children[entity.id] !== undefined)
            entity.parent.children[entity.id] = undefined;*/

        this.children[entity.id] = entity;
        entity.parent = this;
};

Entity.prototype.hasChild = function (id) {
    for (key in this.children) {
        if (this.children[key].id == id) {
            return true;
        }
    }

    return false;
};

Entity.prototype.deltaCompare = function (old, fresh) {
    if (this.last[old] !== fresh && this.muted.indexOf(old) < 0) {
        this.last[old] = fresh;
        return fresh;
    }

    return undefined;
};

Entity.prototype.deltaTypeCompare = function (old, fresh) {
    if (this.lastType[old] !== fresh) {
        this.lastType[old] = fresh;
        return fresh;
    }

    return undefined;
};

Entity.prototype.worldPos = function () {
    var pos = new THREE.Vector3();
    pos.copy(this.position);
    if (this.parent !== undefined) {
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.parent.rotation);
        pos.add(this.parent.worldPos());
    }

    return pos;
};

// turns a world coordinate into our local coordinate space (subtract rotation, set relative)
Entity.prototype.toLocal = function (coord) {
    var pos = new THREE.Vector3();
    pos.copy(coord);
    pos.sub(this.position);
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.rotation);
    return pos;
};

Entity.prototype.onDestroy = function () {

    if (this.parent != undefined) {

        var parent = this.parent;
        if (parent.children[this.id] != undefined) {
            delete parent.children[this.id];
        }
    }
};

var isEmpty = function (obj) {
    // check if object is completely empty
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
        return true;
    }

    // check if object is full of undefined
    for (p in obj) {
        if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
            return false;
        }
    }

    return true;
};

// PLayers are entities, check core_entity.js for the base class
Player.prototype = new Entity();
Player.prototype.constructor = Player;

function Player(data) {

    this.isLoggedIn = true;
    this.name = data !== undefined ?
        (data.name || '') :
        '';

    if (this.name.trim() === '') {
        this.name = 'seadog' + (Math.floor(Math.random() * 900) + 100);
        this.isLoggedIn = false
    }

    this.createProperties();

    this.disableSnapAndDelta = data.disableSnapAndDelta ? true : false;

    this.goods = Object.assign({}, data.startingItems.goods);
    this.cargoUsed = 0;

    // stand on top of the boat
    this.position.y = 0.0;

    // netcode type
    this.netType = 0; // when parseSnap reads this, netType of 0 means new player

    // size of a player
    this.size = new THREE.Vector3(1, 1, 1);

    // players can walk forward and sideward. 1 = forward, 0 = stop, -1 = backward, etc
    this.walkForward = 0;
    this.walkSideward = 0;

    // playaers can use whatever they are holding
    this.use = false;
    this.useid = 0; // helper value to predict the id of the next cannonball
    this.cooldown = 0;

    // players have a pitch value (The angle at which they look into the sky)
    this.pitch = 0;
    this.score = 50; // player score
    this.salary = 0; // player score
    this.overall_cargo = 0; // sum up amount of cargo ever traded
    this.last_island = ""; // last island the seadog bought goods on
    this.gold = (data.startingItems || {}).gold || 0; // player gold

    this.islandBoundary = { x: 0, z: 0 }; // to limit  boundaries around island
    this.shipsSank = 0; //Number of ships player has sunk
    this.shotsFired = 0; //Number of projectiles player has used
    this.shotsHit = 0; //Number of projectiles that hit other ships

    this.sentDockingMsg = false; // Used to stop server from emitting enterIsland message before docking.
    // Keep track of player state.
    this.state = {
        alive: 0,
        dead: 1,
        respawning: 2,
    };
    this.state = 0;

    this.activeWeapon = {
        nothing: -1,
        cannon: 0,
        fishingRod: 1,
        spyglass: 2,
    };
    this.activeWeapon = 0;

    this.justLogged = true;

    this.isFishing = false;

    this.checkedItemsList = false; // if player's boat docked into island and already checked island list
    this.rareItemsFound = []; // Rare items found when player docks into island

    this.rodRotationSpeed = Math.random() * 0.25 + 0.25; // rotation speed for fishing rod

    // players keep track of wether they are captain or not.
    this.isCaptain = false;
    this.oldCaptainState = false; // this is a helper value that just helps us keep track of when our captain state changes

    // anti-chat measures
    this.sentMessages = [];
    this.lastMessageSentAt = undefined;
    this.isSpammer = false;
    this.lastMoved = new Date();

    this.jumping = 0;
    this.jump_count = 0;

    //this.items = [];
    this.itemId;

    this.ownsCannon = true;
    this.ownsFishingRod = true;

    this.attackSpeedBonus = 0;
    this.attackDamageBonus = 0;
    this.attackDistanceBonus = 0;
    this.movementSpeedBonus = 0;
    this.armorBonus = 0;

    // Leveling system
    this.level = 0;
    this.experience = 0;
    this.experienceBase = 100;
    this.experienceMaxLevel = 50;
    this.experienceNeedsUpdate = true;
    //Bank and casino
    this.bank = {
      deposit: 0,
    };
    this.casino = {
    };
    this.markerMapCount = new Date();

    // Build an object with the levels from 0 to max level for future references
    this.experienceNeededForLevels = (function (entity) {
        var levels = { 0: { amount: 0, total: 0 }, 1: { amount: entity.experienceBase, total: entity.experienceBase } };

        for (var i = 1; i < entity.experienceMaxLevel + 1; i++) {
            levels[i + 1] = {};
            levels[i + 1].amount = Math.ceil(levels[i].amount * 1.07);
            levels[i + 1].total = levels[i + 1].amount + levels[i].total;
        }

        return levels;
    })(this);

    this.points = {
        fireRate: 0,
        distance: 0,
        damage: 0,
    };
    var _this = this;
    this.pointsFormula = {
        getFireRate: function () {
            return (_this.points.fireRate >= 50 ? 50 : _this.points.fireRate) * 1.2;
        },

        getDistance: function () {
            return (_this.points.distance >= 50 ? 50 : _this.points.distance) / 2;
        },

        getDamage: function () {
            return (_this.points.damage >= 50 ? 50 : _this.points.damage) / 2;
        },

        getExperience: function (damage) {
            return parseInt(damage * 2.4);
        },
    };

    this.usedPoints = 0;
    this.availablePoints = 0;
    this.updateExperience();
}

Player.prototype.updateExperience = function (damage) {

    var experience = this.experience;
    var level = 0;
    var i;

    if (typeof damage === 'number') {
        experience += this.pointsFormula.getExperience(damage);
    }

    if (experience > this.experienceNeededForLevels[this.experienceMaxLevel].total) {
        experience = this.experienceNeededForLevels[this.experienceMaxLevel].total;
    }

    for (i in this.experienceNeededForLevels) {
        if (experience < this.experienceNeededForLevels[i].total) {
            break;
        }

        level = i;
    }

    level = parseInt(level);

    if (level !== this.level) {
        if (this.socket) {
            this.socket.emit('levelUpdate', { id: this.id, level: level });
        }
    }

    this.level = level;
    this.experience = experience;

    this.usedPoints = 0;
    for (i in this.points) {
        this.usedPoints += this.points[i];
    }

    this.availablePoints = this.level - this.usedPoints;
};

Player.prototype.rotationOffset = -0.45;

Player.prototype.logic = function (dt) {

    // check if we are the captain of our ship
    this.oldCaptainState = this.isCaptain;
    this.isCaptain = this.parent && this.id === this.parent.captainId;

    // the player movemnt logic is depending on wether the walkSideward / forward buttons are pressed
    var moveVector = new THREE.Vector3(0, 0, 0);
    moveVector.z = -this.walkForward;
    moveVector.x = this.walkSideward;

    //this.changeWeapon();
    // we create a movement vector depending on the walk buttons and normalize it
    if (moveVector.lengthSq() > 0) {
        moveVector.normalize();
    }

    // rotate movevector along y rotation of cube
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
    this.velocity = moveVector;

    this.velocity.x *= 3;
    this.velocity.z *= 3;

    // collisions (movement restriction when on boat and not anchored/dockd yet)
    if (this.parent) {
        if (this.parent.netType === 5 || this.parent.shipState === 3 || this.parent.shipState === -1) {
            this.velocity.x *= 2;
            this.velocity.z *= 2;
        }

        if (this.parent.netType !== 5 && this.parent.shipState !== 3 && this.parent.shipState !== 2 && this.parent.shipState !== -1 && this.parent.shipState !== 4) {
            if (this.position.x > this.parent.size.x / 2) { this.position.x = this.parent.size.x / 2;}

            if (this.position.z > this.parent.size.z / 2) { this.position.z = this.parent.size.z / 2;}

            if (this.position.x < -this.parent.size.x / 2) { this.position.x = -this.parent.size.x / 2;}

            if (this.position.z < -this.parent.size.z / 2) { this.position.z = -this.parent.size.z / 2;}

            // oval boat shape collision
            if (this.parent.arcFront > 0 && this.position.z > 0) {
                var bound = this.parent.size.x / 2 - this.position.z * this.parent.arcFront; //this.parent.size.z/2 -
                if (this.position.x > 0) {
                    if (this.position.x > bound) { this.position.x = bound;}
                } else {
                    if (this.position.x < -bound) { this.position.x = -bound;}
                }
            }

        }
    }

    // use active thing (e.g. cannonbann fire)
    if (this.cooldown > 0) { this.cooldown -= dt;}

    if (this.use === true && this.cooldown <= 0) {
        var attackSpeedBonus = parseFloat((this.attackSpeedBonus + this.pointsFormula.getFireRate()) / 100);
        this.cooldown = this.activeWeapon === 1 ? 2 : (1.5 - attackSpeedBonus).toFixed(2);

        // If we are not in an island or the active weapon is the fishingrod
        // Here we prevent the creation of an empty cannon projectile that does not ment to exist
        if ((this.parent && this.parent.netType !== 5) || this.activeWeapon === 1) {
            ++this.useid;
            var projectile = new Projectile(this);
            entities[this.id + '' + this.useid] = projectile;
            projectile.id = this.id + '' + this.useid;
            if (this.activeWeapon === 1) {
                this.isFishing = true;
                if (entities[this.id + '' + (this.useid-1)] !== undefined)
                        removeEntity(entities[this.id + '' + (this.useid-1)]);
            }
        }
    }
};

// function that generates boat specific snapshot data
Player.prototype.getTypeSnap = function () {
    var obj = {
        f: this.walkForward,
        s: this.walkSideward,
        u: this.use,
        p: this.pitch,
        j: this.jumping,
        m: this.movementSpeedBonus,
        g: this.armorBonus,
        w: this.activeWeapon,
        c: this.checkedItemsList,
        d: this.itemId,
        o: this.ownsCannon,
        r: this.ownsFishingRod,
        v: this.availablePoints,
        cl: this.clan,
        cll: this.clanLeader,
        clo: this.clanOwner,
        cr: this.clanRequest,
        l: this.isLoggedIn,
        e: {
            e: this.experience,
            p: {
                fr: this.fireRate,
                ds: this.distance,
                dm: this.damage,
            },
            l: this.level,
        },
    };

    return obj;
};

// function that generates boat specific snapshot data
Player.prototype.getTypeDelta = function () {
    var delta = {
        f: this.deltaTypeCompare('f', this.walkForward),
        s: this.deltaTypeCompare('s', this.walkSideward),
        u: this.deltaTypeCompare('u', this.use),
        p: this.deltaTypeCompare('p', this.pitch.toFixed(2)),
        j: this.deltaTypeCompare('j', this.jumping),
        w: this.deltaTypeCompare('w', this.activeWeapon),
        c: this.deltaTypeCompare('c', this.checkedItemsList),
        d: this.deltaTypeCompare('d', this.itemId),
        o: this.deltaTypeCompare('o', this.ownsCannon),
        r: this.deltaTypeCompare('r', this.ownsFishingRod),
        v: this.deltaTypeCompare('v', this.availablePoints),
    };
    if (isEmpty(delta)) { delta = undefined;}

    return delta;
};

// function that parses a snapshot
Player.prototype.parseTypeSnap = function (snap) {
    if (snap.f !== undefined) {this.walkForward = parseInt(snap.f);}

    if (snap.s !== undefined) {this.walkSideward = parseInt(snap.s);}

    if (snap.u !== undefined) {this.use = parseBool(snap.u);}

    if (snap.p !== undefined) {this.pitch = parseFloat(snap.p);}

    if (snap.j !== undefined) {this.jumping = parseInt(snap.j);}

    //if (snap.m !== undefined) {this.movementSpeedBonus = parseInt(snap.m);}

    if (snap.v !== undefined && snap.v !== this.availablePoints) {this.availablePoints = parseInt(snap.v);}

    if (snap.o !== undefined && snap.o !== this.ownsCannon) {
        this.ownsCannon = parseBool(snap.o);
    }

    if (snap.r !== undefined && snap.r !== this.ownsFishingRod) {
        this.ownsFishingRod = parseBool(snap.r);
    }

    if (snap.c !== undefined && snap.c !== this.checkedItemsList) {this.checkedItemsList = parseBool(snap.c);}

    if (snap.d !== undefined && snap.d !== this.itemId) {
        this.itemId = parseInt(snap.d);
    }

    if (snap.w !== undefined && snap.w !== this.activeWeapon) {
        this.activeWeapon = parseInt(snap.w);
        // this.changeWeapon();
    }

    if (
        snap.f !== undefined ||
        snap.s !== undefined ||
        snap.u !== undefined ||
        snap.p !== undefined
    ) {
        this.lastMoved = new Date();
    }
};

Player.prototype.equip = function (item) {
    //this.items.push(item);

    // reset player stats
    this.attackSpeedBonus = 0;
    this.attackDistanceBonus = 0;
    this.movementSpeedBonus = 0;
    this.armorBonus = 0;
    this.attackDamageBonus = 0;

    if (item.attributes.attackSpeed !== undefined) {
        this.attackSpeedBonus += parseInt(item.attributes.attackSpeed);
    }

    if (item.attributes.attackDistance !== undefined) {
        this.attackDistanceBonus += parseInt(item.attributes.attackDistance);
    }

    if (item.attributes.movementSpeed !== undefined) {
        this.movementSpeedBonus += parseInt(item.attributes.movementSpeed);
    }

    if (item.attributes.armor !== undefined) {
        this.armorBonus += parseInt(item.attributes.armor);
    }

    if (item.attributes.attackDamage !== undefined) {
        this.attackDamageBonus += parseInt(item.attributes.attackDamage);
    }
};

Player.prototype.dequip = function () {

    //this.items = [];

    // reset player stats
    this.attackSpeedBonus = 0;
    this.attackDistanceBonus = 0;
    this.movementSpeedBonus = 0;
    this.attackDamageBonus = 0;
    this.armorBonus = 0;
};

Player.prototype.purchaseItem = function (itemId) {
    var item = null;
    for (i in itemTypes) {
        if (itemTypes[i].id == parseInt(itemId)) {
            item = itemTypes[i];
        }
    }

    // if player can afford the ship/item
    if (item && this.gold >= item.price) {
        this.gold -= item.price;

        if (itemId != '14') {
            this.equip(item);
            this.itemId = itemId;
        }
    }
};

Player.prototype.purchaseShip = function (itemId, krewName) {

    var item;
    for (i in boatTypes) {
        if (i == itemId) {
            item = boatTypes[i];
            break;
        }
    }

    // check if crewCount is larger than maxKrewCapacity and if player is captain
    if (item && this.parent.krewCount > item.maxKrewCapacity && this.isCaptain){
        this.socket.emit('showCenterMessage', "This boat doesn't have enough space for your krew!", 1);
    }

    // if player can afford the ship
    else if (item && this.gold >= item.price) {
        this.gold -= item.price;
        var oldParent = this.parent;
        var previousState = oldParent.netType === 1 ? oldParent.shipState : 3;

        // if the player is a krewMember (not captain), create a new boat for him
        if ((oldParent.netType === 1 && oldParent.captainId !== this.id) || oldParent.netType === 5) {
            delete oldParent.children[this.id]; // delete him from the previous krew
            oldParent.updateProps && oldParent.updateProps();

            var boat = core.createBoat(this.id, krewName, false);
            boat.addChildren(this);
            boat.departureTime = 5;
            boat.recruiting = true;
            boat.isLocked = false;
            boat.updateProps();
        }

        this.parent.setShipClass(itemId); // this is temporary. once we implement unique item shopping system, it'll go away
        this.parent.shipState = previousState === 4 ? 4 : 3;
    }
};

Player.prototype.respawnShip = function (itemId, krewName) {

    var item;
    for (i in boatTypes) {
        if (i === itemId) {
            item = boatTypes[i];
            break;
        }
    }
    var boat = core.createBoat(this.id, krewName, true);
    boat.addChildren(this);
    boat.departureTime = 5;
    boat.recruiting = true;
    boat.isLocked = false;
    boat.updateProps();

    this.parent.setShipClass(itemId); // this is temporary. once we implement unique item shopping system, it'll go away
};

Player.prototype.onDestroy = function () {

    Entity.prototype.onDestroy.call(this);

    if (this.parent) {
        delete this.parent.children[this.id];
        if (this.parent.netType === 1)
        {
            this.parent.updateProps();
            if (Object.keys(this.parent.children).length === 0) {
                core.removeEntity(this.parent);
            }
        }

    }

    if (players[this.id]) {
        delete players[this.id];
    }
};

Player.prototype.addScore = function (score) {
    this.score += score;
};

var parseBool = function (b) {
    return b === true || b === 'true';
};

// Make a clone of get ships function
// items to be available at specific islands
// Rarity maybe?

var itemTypes = [
{
    id: 0,
    name: "Cannon",
    Description: 'Cannon for seadog',
    price: 500,
    rarity: 1,
    availableAt: [],
    // availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
},
{
    id: 1,
    name: "Fishing rod",
    Description: 'Fishing rod for seadog (used for fishing)',
    price: 500,
    rarity: 1,
    availableAt: [],
    // availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
},
/*{
    id: 2,
    name: "Rapid cannon",
    Description: 'Replace your normal cannon with a faster one (30% faster attack speed)',
    price: 20000,
    rarity: 1,
    availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
    attributes: {
        attackSpeed: '30',
    },
},
{
    id: 3,
    name: "Lunar fishing rod",
    Description: 'Grants you a higher catching chance of catching better rewards',
    price: 20000,
    rarity: 1,
    availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
    attributes: {
        catchChance: '20',
    },
},
{
    id: 4,
    name: "Annihilator",
    Description: 'Cannon used by legendary pirate captains</br>+6 Attack Damage</br>25% faster attack speed',
    price: 50000,
    rarity: 1,
    availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
    attributes: {
        attackSpeed: "25",
        attackDamage: "6"
    },
},*/
{
    id: 2,
    name: "Sinker's Gloves",
    Description: '+25 cannon fire rate',
    price: 45000,
    rarity: 0.2,
    availableAt: ['Spain', 'Brazil'],
    attributes: {
        attackSpeed: '25',
    },
},
{
    id: 3,
    name: 'Steel Barrel',
    Description: '+30 cannon distance',
    price: 35000,
    rarity: 0.6,
    availableAt: ['Labrador'],
    attributes: {
        attackDistance: '30',
    },
},
{
    id: 4,
    name: 'Air Pegleg',
    Description: '+1 ship speed (only works if you are captain)',
    price: 22000,
    rarity: 0.3,
    availableAt: ['Jamaica'],
    attributes: {
        movementSpeed: '100',
    },
},
{
    id: 5,
    name: 'Blue Gunpowder',
    Description: '+8 cannon damage',
    price: 50000,
    rarity: 0.25,
    availableAt: ['Jamaica'],
    attributes: {
        attackDamage: '8',
    },
},
{
    id: 6,
    name: "Cannon distance upgrade",
    Description: "+5 cannon distance",
    price: 4000,
    rarity: 1,
    attributes: {
        attackDistance: "5"
    }
},
{
    id: 7,
    name: "Attack speed upgrade",
    Description: "+5 cannon fire rate",
    price: 2000,
    rarity: 1,
    attributes: {
        attackSpeed: "5"
    }
},
{
    id: 8,
    name: "Damage upgrade",
    Description: "+5 cannon damage",
    price: 5000,
    rarity: 1,
    attributes: {
        attackDamage: "5"
    }
},
{
    id: 9,
    name: "Ship Speed Upgrade",
    Description: "+0.2 ship speed (only works if you are captain)",
    price: 3000,
    rarity: 1,
    attributes: {
        movementSpeed: "20"
    }
},
{
    id: 10,
    name: "Bruiser",
    Description: "+2 cannon damage</br>+10 cannon fire rate",
    price: 20000,
    rarity: 0.35,
    availableAt: ['Spain', 'Brazil'],
    attributes: {
        attackSpeed: "10",
        attackDamage: "2"
    }
},
{
    id: 11,
    name: "Demolisher",
    Description: "+4 cannon damage</br>+25 cannon fire rate</br></br>Requirements:</br>- Sink 10 ships</br>- Trade goods worth 100,000 gold",
    price: 100000,
    rarity: 1,
    availableAt: ['Jamaica'],
    attributes: {
        attackSpeed: "25",
        attackDamage: "4"
    }
},
{
    id: 12,
    name: "Drifter",
    Description: "+2 cannon damage</br>+0.5 ship speed (only works if you are captain)",
    price: 25000,
    rarity: 0.45,
    availableAt: ['Guinea','Labrador'],
    attributes: {
        attackDamage: "2",
        movementSpeed: "50"
    }
},
{
    id: 13,
    name: "Reinforced Planks",
    Description: "+25% to protect your ship (only works if you are captain)",
    price: 35000,
    rarity: 0.45,
    availableAt: ['Brazil'],
    attributes: {
        armor: "25"
    }
},
{
    id: 14,
    name: "Fountain of youth",
    Description: "New chance to allocate all your skill points.</br>Can only be bought once",
    price: 150000,
    rarity: 0.33,
    availableAt: ['Jamaica'],
},
];

// PLayers are entities, check core_entity.js for the base class
Item.prototype.constructor = Item;

function Item() {
}

Item.prototype.logic = function (dt) {

};

var boatTypes = {
    0: {
        id: 0,
        name: 'Wood Plank',
        hp: 25,
        turnspeed: 1.0,
        price: 501,
        maxKrewCapacity: 1,
        cargoSize: 50,
        baseheight: 1.4,
        width: 4,
        depth: 5.5,
        arcFront: 0,
        inertia: 0.1,
        radius: 5,
        speed: 6.5,
        labelHeight: 7,
        regeneration: 1,
        body: 'raft',
        sail: undefined,
        scale: [1.2, 1, 1.5],
        offset: [0, -1, 0],
        rotation: [0, 0, 0],
    },
    1: {
        id: 1,
        image: '<img src="./assets/img/raft.png" style="height: 30px">',
        name: 'Raft 1',
        hp: 75,
        turnspeed: 1.2,
        price: 500,
        maxKrewCapacity: 1,
        cargoSize: 200,
        baseheight: 1.4,
        width: 4,
        depth: 5.5,
        arcFront: 0.3,
        inertia: 0.1,
        radius: 5,
        speed: 6,
        labelHeight: 10,
        regeneration: 1,
        body: 'raft',
        sail: 'raft',
        scale: [1.7, 1.7, 1.7],
        offset: [0, -1.0, 0],
        rotation: [0, 0, 0],
    },
    2: {
        id: 2,
        image: '<img src="./assets/img/raft.png" style="height: 35px">',
        name: 'Raft 2',
        hp: 150,
        turnspeed: 1,
        price: 1300,
        maxKrewCapacity: 2,
        cargoSize: 300,
        baseheight: 1.4,
        width: 4.5,
        depth: 6,
        arcFront: 0.3,
        inertia: 0.1,
        radius: 5,
        speed: 5.9,
        labelHeight: 10,
        regeneration: 1,
        body: 'raft',
        sail: 'raft',
        scale: [1.7, 1.7, 1.7],
        offset: [0, -1.0, 0],
        rotation: [0, 0, 0],
    },
    3: {
        id: 3,
        image: '<img src="./assets/img/raft.png" style="height: 40px">',
        name: 'Raft 3',
        hp: 200,
        turnspeed: 0.9,
        price: 2400,
        maxKrewCapacity: 3,
        cargoSize: 400,
        baseheight: 1.4,
        width: 5,
        depth: 6.5,
        arcFront: 0.3,
        inertia: 0.1,
        radius: 5,
        speed: 5.8,
        labelHeight: 10,
        regeneration: 1,
        body: 'raft',
        sail: 'raft',
        scale: [1.7, 1.7, 1.7],
        offset: [0, -1.0, 0],
        rotation: [0, 0, 0],
    },
    4: {
        id: 4,
        image: '<img src="./assets/img/trader.png" style="height: 30px">',
        name: 'Trader 1',
        hp: 400,
        turnspeed: 0.5,
        price: 4350,
        maxKrewCapacity: 4,
        cargoSize: 2000,
        baseheight: 3,
        width: 7,
        depth: 12.5,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 10,
        speed: 5.4,
        labelHeight: 12,
        regeneration: 1,
        body: 'ship1',
        sail: 'ship1',
        scale: [5.5, 5.5, 5.5],
        offset: [0, -4.5, 1],
        rotation: [0, 0, 0],
    },
    5: {
        id: 5,
        image: '<img src="./assets/img/boat.png" style="height: 30px">',
        name: 'Boat 1',
        hp: 450,
        turnspeed: 0.7,
        price: 6900,
        maxKrewCapacity: 5,
        cargoSize: 500,
        baseheight: 3,
        width: 7,
        depth: 12.5,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 10,
        speed: 5.8,
        labelHeight: 12,
        regeneration: 1,
        body: 'ship1',
        sail: 'ship1',
        scale: [5, 5, 5],
        offset: [0, -4.5, 1],
        rotation: [0, 0, 0],
    },
    6: {
        id: 6,
        image: '<img src="./assets/img/boat.png" style="height: 35px">',
        name: 'Boat 2',
        hp: 600,
        turnspeed: 0.7,
        price: 11000,
        maxKrewCapacity: 6,
        cargoSize: 600,
        baseheight: 3,
        width: 7,
        depth: 12.5,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 10,
        speed: 5.9,
        labelHeight: 12,
        regeneration: 1,
        body: 'ship1',
        sail: 'ship1',
        scale: [5, 5, 5],
        offset: [0, -4.5, 1],
        rotation: [0, 0, 0],
    },
    7: {
        id: 7,
        image: '<img src="./assets/img/boat.png" style="height: 40px">',
        name: 'Boat 3',
        hp: 750,
        turnspeed: 0.7,
        price: 16000,
        maxKrewCapacity: 7,
        cargoSize: 700,
        baseheight: 3,
        width: 7,
        depth: 12.5,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 10,
        speed: 6.0,
        labelHeight: 12,
        regeneration: 1,
        body: 'ship1',
        sail: 'ship1',
        scale: [5, 5, 5],
        offset: [0, -4.5, 1],
        rotation: [0, 0, 0],
    },
    8: {
        id: 8,
        image: '<img src="./assets/img/destroyer.png" style="height: 35px">',
        name: 'Destroyer 1',
        hp: 1200,
        turnspeed: 0.7,
        price: 50000,
        maxKrewCapacity: 12,
        cargoSize: 1000,
        baseheight: 5,
        width: 11.5,
        depth: 26,
        arcFront: 0.1,
        inertia: 1.0,
        radius: 15,
        speed: 5.9,
        labelHeight: 21,
        regeneration: 1,
        body: 'ship2',
        sail: 'ship2',
        scale: [6, 6, 6],
        offset: [0, -8, 0],
        rotation: [0, 0, 0],
    },
    9: {
        id: 9,
        image: '<img src="./assets/img/destroyer.png" style="height: 40px">',
        name: 'Destroyer 2',
        hp: 1800,
        turnspeed: 0.7,
        price: 80000,
        maxKrewCapacity: 14,
        cargoSize: 1300,
        baseheight: 5,
        width: 11.5,
        depth: 26,
        arcFront: 0.1,
        inertia: 1.0,
        radius: 15,
        speed: 5.8,
        labelHeight: 21,
        regeneration: 1,
        body: 'ship2',
        sail: 'ship2',
        scale: [6, 6, 6],
        offset: [0, -8, 0],
        rotation: [0, 0, 0],
    },
    10: {
        id: 10,
        image: '<img src="./assets/img/destroyer.png" style="height: 45px">',
        name: 'Destroyer 3',
        hp: 2600,
        turnspeed: 0.7,
        price: 130000,
        maxKrewCapacity: 16,
        cargoSize: 1600,
        baseheight: 5,
        width: 11.5,
        depth: 26,
        arcFront: 0.1,
        inertia: 1.0,
        radius: 15,
        speed: 5.7,
        labelHeight: 21,
        regeneration: 1,
        body: 'ship2',
        sail: 'ship2',
        scale: [6, 6, 6],
        offset: [0, -8, 0],
        rotation: [0, 0, 0],
    },

    11: {
        id: 11,
        image: '<img src="./assets/img/baby_fancy.png" style="height: 35px">',
        name: 'Baby Fancy',
        hp: 300,
        turnspeed: 1,
        price: 8000,
        maxKrewCapacity: 3,
        cargoSize: 300,
        baseheight: 1.4,
        width: 4,
        depth: 6.5,
        arcFront: 0.3,
        inertia: 0.1,
        radius: 8,
        speed: 5.9,
        labelHeight: 10,
        regeneration: 0.5,
        body: 'sloop',
        sail: 'sloop',
        mast: 'sloop',
        scale: [0.15, 0.18, 0.12],
        offset: [0, 5.5, 0],
        rotation: [0, 0, 0],
        availableAt: ['Spain', 'Brazil'],
    },
    12: {
        id: 12,
        image: '<img src="./assets/img/royal_fortune.png" style="height: 35px">',
        name: 'Royal Fortune',
        hp: 1000,
        turnspeed: 0.5,
        price: 70000,
        maxKrewCapacity: 15,
        cargoSize: 1200,
        baseheight: 4,
        width: 10,
        depth: 26,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 15,
        speed: 6,
        labelHeight: 12,
        regeneration: 1,
        body: 'schooner',
        sail: 'schooner',
        mast: 'schooner',
        scale: [0.15, 0.15, 0.15],
        offset: [2, 11.6, 3],
        rotation: [0, Math.PI / 2, 0],
        availableAt: ['Labrador', 'Spain'],
    },
    13: {
        id: 13,
        image: '<img src="./assets/img/calm_spirit.png" style="height: 35px">',
        name: 'Calm Spirit',
        hp: 1800,
        turnspeed: 0.7,
        price: 120000,
        maxKrewCapacity: 18,
        cargoSize: 2000,
        baseheight: 4,
        width: 10,
        depth: 30,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 16,
        speed: 5.9,
        labelHeight: 12,
        regeneration: 1,
        body: 'vessel',
        sail: 'vessel',
        mast: 'vessel',
        scale: [0.1, 0.1, 0.1],
        offset: [1, 10, 5],
        rotation: [0, Math.PI / 2, 0],
        availableAt: ['Spain', 'Guinea'],
    },
    14: {
        id: 14,
        image: '<img src="./assets/img/QBJ.png" style="height: 45px">',
        name: "Queen Barb's Justice",
        hp: 3000,
        turnspeed: 0.7,
        price: 200000,
        maxKrewCapacity: 20,
        cargoSize: 3000,
        baseheight: 5,
        width: 8,
        depth: 38,
        arcFront: 0.1,
        inertia: 1.0,
        radius: 20,
        speed: 5.9,
        labelHeight: 21,
        regeneration: 1,
        body: 'bigship',
        sail: 'bigship',
        mast: 'bigship',
        scale: [0.1, 0.1, 0.1],
        offset: [1, 13.4, 1],
        rotation: [0, Math.PI / 2, 0],
        availableAt: ['Spain'],
    },

    15: {
        id: 15,
        image: '<img src="./assets/img/trader.png" style="height: 35px">',
        name: 'Trader 2',
        hp: 500,
        turnspeed: 0.5,
        price: 11000,
        maxKrewCapacity: 6,
        cargoSize: 4000,
        baseheight: 3,
        width: 7,
        depth: 12.5,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 10,
        speed: 5.5,
        labelHeight: 12,
        regeneration: 1,
        body: 'ship1',
        sail: 'ship1',
        scale: [5.5, 5.5, 5.5],
        offset: [0, -4.5, 1],
        rotation: [0, 0, 0],
        availableAt: ['Jamaica'],
    },
    16: {
        id: 16,
        image: '<img src="./assets/img/trader.png" style="height: 40px">',
        name: 'Trader 3',
        hp: 750,
        turnspeed: 0.5,
        price: 30000,
        maxKrewCapacity: 6,
        cargoSize: 6000,
        baseheight: 3,
        width: 7,
        depth: 12.5,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 10,
        speed: 5.5,
        labelHeight: 12,
        regeneration: 1,
        body: 'ship1',
        sail: 'ship1',
        scale: [5.5, 5.5, 5.5],
        offset: [0, -4.5, 1],
        rotation: [0, 0, 0],
        availableAt: ['Jamaica'],
    },
    17: {
        id: 17,
        image: '<img src="./assets/img/baby_fancy.png" style="height: 40px">',
        name: 'Baby Fancy 2',
        hp: 500,
        turnspeed: 1,
        price: 40000,
        maxKrewCapacity: 3,
        cargoSize: 400,
        baseheight: 1.4,
        width: 4.5,
        depth: 7,
        arcFront: 0.3,
        inertia: 0.1,
        radius: 8,
        speed: 5.8,
        labelHeight: 10,
        regeneration: 0.5,
        body: 'sloop',
        sail: 'sloop',
        mast: 'sloop',
        scale: [0.15, 0.18, 0.12],
        offset: [0, 5.5, 0],
        rotation: [0, 0, 0],
        availableAt: ['Jamaica'],
    },
    18: {
        id: 18,
        image: '<img src="./assets/img/royal_fortune.png" style="height: 40px">',
        name: 'Royal Fortune 2',
        hp: 1300,
        turnspeed: 0.6,
        price: 110000,
        maxKrewCapacity: 18,
        cargoSize: 1400,
        baseheight: 4,
        width: 10,
        depth: 26,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 15,
        speed: 5.9,
        labelHeight: 12,
        regeneration: 1,
        body: 'schooner',
        sail: 'schooner',
        mast: 'schooner',
        scale: [0.15, 0.15, 0.15],
        offset: [2, 11.6, 3],
        rotation: [0, Math.PI / 2, 0],
        availableAt: ['Jamaica'],
    },
    19: {
        id: 19,
        image: '<img src="./assets/img/calm_spirit.png" style="height: 45px">',
        name: 'Calm Spirit 2',
        hp: 2200,
        turnspeed: 0.7,
        price: 170000,
        maxKrewCapacity: 20,
        cargoSize: 2600,
        baseheight: 4,
        width: 10,
        depth: 30,
        arcFront: 0.3,
        inertia: 0.5,
        radius: 16,
        speed: 5.8,
        labelHeight: 12,
        regeneration: 1,
        body: 'vessel',
        sail: 'vessel',
        mast: 'vessel',
        scale: [0.1, 0.1, 0.1],
        offset: [1, 10, 5],
        rotation: [0, Math.PI / 2, 0],
        availableAt: ['Jamaica'],
    },
    20: {
        id: 20,
        image: '<img src="./assets/img/QBJ.png" style="height: 50px">',
        name: "Queen Barb's Justice 2",
        hp: 4000,
        turnspeed: 0.7,
        price: 350000,
        maxKrewCapacity: 25,
        cargoSize: 4000,
        baseheight: 5,
        width: 8,
        depth: 38,
        arcFront: 0.1,
        inertia: 1.0,
        radius: 20,
        speed: 5.8,
        labelHeight: 21,
        regeneration: 1,
        body: 'bigship',
        sail: 'bigship',
        mast: 'bigship',
        scale: [0.1, 0.1, 0.1],
        offset: [1, 13.4, 1],
        rotation: [0, Math.PI / 2, 0],
        availableAt: ['Jamaica'],
    },
};

// PLayers are entities, check core_entity.js for the base class
Boat.prototype = new Entity();
Boat.prototype.constructor = Boat;

function Boat(captainId, krewName, spawnBool) {
    var captainsName = '';
    var spawnIslandId = undefined;

    if (entities[captainId] !== undefined) {
        captainsName = entities[captainId].name;
        if (entities[captainId].parent !== undefined) {
            spawnIslandId = entities[captainId].parent.netType === 5 ?
                entities[captainId].parent.id :
                entities[captainId].parent.anchorIslandId;
        }
    }

    this.createProperties();

    // parse the ship values
    this.supply = 0;

    this.setShipClass(1); // start off with cheapest boat

    this.hpRegTimer = 0;
    this.hpRegInterval = 1;

    this.arcFront = 0.0;

    // info that is not sent via delta
    this.muted = ['x', 'z', 'y'];

    //krew members
    this.krewMembers = {};

    this.krewCount = 0; // Keep track of boat's krew count to update krew list window

    //this.totalWorth = 0; // Keep track of boat's total worth to update krew list window

    this.recruiting = false; // If the ship has been docked for more than 5 minutes, then it's not recruiting
    this.isLocked = false; // by default the krew is not locked
    this.departureTime = 5;
    this.lastMoved;

    // netcode type
    this.netType = 1;

    // Boats can either steer left or right. 0 = no steering
    this.steering = 0;

    // boats states, 0 = sailing/ 1 = docking..,etc
    this.shipState = {
        starting: -1,
        sailing: 0,
        docking: 1,
        finishedDocking: 2,
        anchored: 3,
        departing: 4,
    };

    this.shipState = -1;
    this.overall_kills = 0; //Number of ships the whole crew has sunk
    this.overall_cargo = 0; //Amount of cargo (worth gold) traded by the whole crew

    this.sentDockingMsg = false;

    // this.anchorIsland = undefined;
    this.anchorIslandId = spawnIslandId;

    // a timer that counts down once your hp is below zero - you are sinking
    this.sinktimer = 0;

    // boats have a captain, but we only reference it by ID (better for netcode)
    // If there is no captain, the id is: ""
    this.captainId = captainId || '';

    // Boats have a crew name, by default it's the captains name or the passed krew name,
    // this is setted on the update function, so initially is set to undefined
    captainsName = typeof captainsName === 'string' ? captainsName : '';
    this.crewName = typeof krewName === 'string'
        ? krewName
        : (
            captainsName + "'" +
            (captainsName.charAt(captainsName.length - 1) === 's' ? '' : 's') +
            ' krew'
        );

    // on death, we drop things. this is a security value so it only happens once
    this.hasDoneDeathDrops = false;

    this.steering = 1;

    // var spawnIsland = spawnIslandId ? Landmarks[spawnIslandId] :
    //     Landmarks[
    //         Object.keys(Landmarks)[
    //             Math.round(Math.random() * (Object.keys(Landmarks).length - 1))
    //         ]
    //     ];
    //
    // this.anchorIslandId = spawnIsland.id;

    if (spawnBool === true) {
        //used for respawn near the edge of the map
        var roll = Math.floor(Math.random() * Math.floor(4));
        if (roll === 0){
            this.position.x = Math.floor(Math.random() * 250);
            this.position.z = Math.floor(Math.random() * worldsize);
        }
        else if (roll === 1){
            this.position.x = Math.floor(Math.random() * worldsize);
            this.position.z = Math.floor(Math.random() * (worldsize - (worldsize - 250)) + (worldsize - 250));
        }
        else if (roll === 2){
            this.position.x = Math.floor(Math.random() * (worldsize - (worldsize - 250)) + (worldsize - 250));
            this.position.z = Math.floor(Math.random() * worldsize);
        }
        else if (roll === 3){
            this.position.x = Math.floor(Math.random() * worldsize);
            this.position.z = Math.floor(Math.random() * 250);
        }
        //used for respawn anywhere on the map
        // calculate the spawn position. If spawn position collides with an island, recalculate
        //var spawnResult = false;
        //while (spawnResult !== true) {
            //this.position.x = worldsize * 0.8 * Math.random() + worldsize * 0.1;
            //this.position.z = worldsize * 0.8 * Math.random() + worldsize * 0.1;
            //for (var l in core.config.landmarks) {
                // spawn must be at least 5 fields away from the island
                //var xCoord1 = core.config.landmarks[l]['x'] - (core.config.landmarks[l]['dockRadius'] + 5);
                //var xCoord2 = core.config.landmarks[l]['x'] + (core.config.landmarks[l]['dockRadius'] + 5);
                //var yCoord1 = core.config.landmarks[l]['y'] - (core.config.landmarks[l]['dockRadius'] + 5);
                //var yCoord2 = core.config.landmarks[l]['y'] + (core.config.landmarks[l]['dockRadius'] + 5);
                //if (this.position.x > xCoord1 && this.position.x < xCoord2 && this.position.z > yCoord1 && this.position.z < yCoord2) {
                    //spawnResult = false;
                    //break;
                //} else {
                    //spawnResult = true;
                //}
            //}
        //}
    } else if (spawnBool === false) {
        // code for spawning on islands instead of on rafts (in the sea)
        if (Landmarks[this.anchorIslandId] !== undefined) {
            var spawnIsland = Landmarks[this.anchorIslandId];
            this.position.x = spawnIsland.position.x + (Math.random() * 60) - 60;
            this.position.z = spawnIsland.position.z + (Math.random() * 60) - 60;
        }
        else
        {
            spawnIsland = Landmarks[Object.keys(core.Landmarks)[0]];
            this.position.x = spawnIsland.position.x + (Math.random() * 60) - 60;
            this.position.z = spawnIsland.position.z + (Math.random() * 60) - 60;
            this.anchorIslandId = spawnIsland.id;
        }
    }
}

Boat.prototype.updateProps = function () {

    var krewCount = 0;
    for (var id in this.children) {
        if (
            entities[id] === undefined ||
            entities[id].parent === undefined ||
            entities[id].parent.id !== this.id
        ) {
            delete this.children[id];
            continue;
        }

        var child = this.children[id];
        if (child && child.netType === 0) {
            krewCount += 1;
        }
    }

    this.krewCount = krewCount;
    if(this.krewCount == 0)
        removeEntity(this);

};

Boat.prototype.logic = function (dt) {

    // world boundaries
    var boundaryCollision = false;
    if (this.position.x > worldsize) {
        this.position.x = worldsize;
        boundaryCollision = true;
    }

    if (this.position.z > worldsize) {
        this.position.z = worldsize;
        boundaryCollision = true;
    }

    if (this.position.x < 0) {
        this.position.x = 0;
        boundaryCollision = true;
    }

    if (this.position.z < 0) {
        this.position.z = 0;
        boundaryCollision = true;
    }

    var kaptain = entities[this.captainId];

    // the boat movement is simple. it always moves forward, and rotates if the captain is steering
    if (kaptain !== undefined && this.crewName !== undefined) {
        this.speed = boatTypes[this.shipclassId].speed + parseFloat(kaptain.movementSpeedBonus / 100);
    }

    var moveVector = new THREE.Vector3(0, 0, (this.speed));

    // if boat is not anchored or not in docking state, we will move
    if (this.shipState == 0) {

        // if the steering button is pressed, the rotation changes slowly
        (kaptain !== undefined) ?
            this.rotation += this.steering * dt * 0.4 * (this.turnspeed + parseFloat(0.05 * kaptain.movementSpeedBonus / 100)) :
            this.rotation += this.steering * dt * 0.4 * this.turnspeed;

        // we rotate the movement vector depending on the current rotation
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);

    } else {
        moveVector.set(0, 0, 0);
    }

    // set the velocity to be the move vector
    this.velocity = moveVector;

    // find out who the captain is
    // if captain is not defined, assign the first crew member as a captain
    if (this.children[this.captainId] == undefined) {
        for (var playerId in this.children) {
            this.captainId = playerId;
            break;
        }
    }

    this.captain = this.children[this.captainId];

    // reset steering. important, dont remove please
    this.steering = 0;

    // do the steering, captain position is what determines it. only steer when anchored
    if (this.captain && (this.shipState != 3 || this.shipState != -1 || this.shipState != 4)) {
        if (this.captain.position.x > this.size.x * 0.25) {
            // right
            this.steering = 1;
        } else if (this.captain.position.x < -this.size.x * 0.25) {
            // left
            this.steering = -1;
        } else {
            // middle
            this.steering = 0;
        }

        // if were in a boundary, turn faster
        if (boundaryCollision) {
            this.steering *= 5;
        }
    }

    //push away from islands
    /*
    for (e in entities)
    {
        if(entities[e] != this && entities[e].netType == 5)
        {
            var dist = entityDistance(this, entities[e]) - (entities[e].collisionRadius + this.collisionRadius );

            if(dist < 10)
            {
                var local = this.toLocal(entities[e].position);
                //var power = entities[e].inertia/this.inertia;
                   // either add it to rotation, or to the steering
                this.rotation += -((local.x > 0 ? (10-local.x) : (10+local.x) )*(10-dist)*(local.z+10))*dt*0.0005;
            }
        }
    }*/

    // if our hp is low (we died)
    if (this.hp <= 0) {
        if (!this.hasDoneDeathDrops) {

            // create debris based on score of the captain and ship
            var value = 300;
            if (boatTypes[this.shipclassId] && this.captain) {
                let baseValue = boatTypes[this.shipclassId].price + this.captain.gold;
                let multiplier = baseValue < 5e5 ? 5.5 : baseValue < 7.5e5 ? 5 : 4.5;
                // base value can't be larger than 1 million gold
                baseValue = baseValue > 1e6 ? 1e6 : baseValue;
                value = baseValue / Math.log(baseValue) * multiplier;
            }

            this.hasDoneDeathDrops = true;

            if (value > 5000) {
                var specialBonus = value / 50;
                for (i = 0; i < 50; i++) {
                    var x = this.position.x - this.size.x * 1;
                    var z = this.position.z - this.size.z * 1;
                    var pickup = createPickup(4, x + Math.random() * this.size.x, z + Math.random() * this.size.z, 0, true, specialBonus);
                }
            } else {
                for (var i = 0; i < value;) {
                    x = this.position.x - this.size.x * 1;
                    z = this.position.z - this.size.z * 1;
                    pickup = createPickup(2, x + Math.random() * this.size.x, z + Math.random() * this.size.z, 0, true);
                    if (pickup) {
                        var bonus = pickup.bonus;
                        i += bonus;
                    } else {
                        break;
                    }
                }
            }
        }

        // increase the sink timer, make ship sink
        this.sinktimer += dt;

        if (this.sinktimer > 4.0) {
            // ships down, lets remove it from game

            removeEntity(this);
        }
    } else if (this.hp > 0) {
        // on server, regenerate health
        // if we are not below 0 hp
        this.hpRegTimer += dt;

        //console.log(this.hpRegTimer + " " + this.hpRegInterval + " " + this.hp)
        if (this.hpRegTimer > this.hpRegInterval) {
            this.hpRegTimer = 0;
            this.hp++;
            this.hp = Math.min(this.hp, this.maxHp);
        }
    }

    // calculate the krew members' salary based on their score
    // first, find total amount of all krew members' scores combined

    // if (this.captain)
    // {
    //     var totalScore = 0;
    //     for (id in this.children)
    //     {
    //         var krewMember = this.children[id];
    //         totalScore += krewMember.score;
    //     }

    //     var totalSalary = 0;
    //     var captainsCut = 0;
    //     if (totalScore > 0)
    //     {
    //         // then, determine the salary
    //         for (id in this.children)
    //         {

    //             var krewMember = this.children[id];
    //             var salary = (krewMember.score / totalScore) * (this.supply * .7)
    //             if (this.captainId == id)
    //             {
    //                 captainsCut = salary;
    //             }

    //             krewMember.salary = salary;
    //             totalSalary += salary;
    //         }
    //     }

    //     this.captain.salary = captainsCut + this.supply - totalSalary;
    // }

};

Boat.prototype.setShipClass = function (classId) {
    this.shipclassId = classId;

    var currentShipClass = boatTypes[classId];

    this.maxHp = currentShipClass.hp;
    this.hp = this.maxHp;
    this.turnspeed = currentShipClass.turnspeed;
    this.maxKrewCapacity = currentShipClass.maxKrewCapacity;
    this.size.set(currentShipClass.width, currentShipClass.height, currentShipClass.depth);
    this.arcFront = currentShipClass.arcFront;
    this.inertia = currentShipClass.inertia;
    this.collisionRadius = currentShipClass.radius;
    this.speed = currentShipClass.speed;
    this.shipState = 2;
};

// function that generates boat specific snapshot data
Boat.prototype.getTypeSnap = function () {
    return {
        h: this.hp,
        s: this.steering,
        c: this.shipclassId,
        u: this.supply,
        b: this.captainId,
        t: this.shipState,
        a: this.anchorIslandId,
        k: this.krewCount,
        e: this.speed,
        r: this.recruiting,
        l: this.isLocked,
        d: this.departureTime,
        cl: this.clan,
    };
};

// function that generates boat specific delta data
Boat.prototype.getTypeDelta = function () {
    var delta = {
        h: this.deltaTypeCompare('h', this.hp),
        s: this.deltaTypeCompare('s', this.steering.toFixed(4)),
        c: this.deltaTypeCompare('c', this.shipclassId),
        u: this.deltaTypeCompare('u', this.supply),
        b: this.deltaTypeCompare('b', this.captainId),
        t: this.deltaTypeCompare('t', this.shipState),
        a: this.deltaTypeCompare('a', this.anchorIslandId),
        k: this.deltaTypeCompare('k', this.krewCount),
        e: this.deltaTypeCompare('e', this.speed),
        r: this.deltaTypeCompare('r', this.recruiting),
        l: this.deltaTypeCompare('r', this.isLocked),
        d: this.deltaTypeCompare('d', this.departureTime),
    };

    if (isEmpty(delta)) {
        delta = undefined;
    }

    return delta;
};

// // function that parses a snapshot
// Boat.prototype.parseTypeSnap = function (snap) {
// };

// function that parses a snapshot
Boat.prototype.onDestroy = function () {

    // all the children - destroy them too
    for (var a in this.children) {
        // on the server, tell all the players on the boat that the show is over
        if (this.children[a].netType === 0) {
            if (this.children[a].socket !== undefined) {
                this.children[a].socket.emit('end', this.children[a].gold, this.children[a].shotsFired, this.children[a].shotsHit, this.children[a].shipsSank);
                //this.children[a].socket.disconnect();
            }
        }

        //removeEntity(this.children[a]);
        //this.children[a].socket.disconnect();
    }

    this.children = {};

    // makre sure to also call the entity ondestroy
    Entity.prototype.onDestroy.call(this);

    if (boats[this.id]) {
        delete boats[this.id];
    }
};

Boat.prototype.getHeightAboveWater = function () {
    return boatTypes[this.shipclassId].baseheight * (0.2 + 0.8 * (this.hp / this.maxHp)) - this.sinktimer; // this.hp*0.01 - 1 - this.sinktimer;
};

Boat.prototype.enterIsland = function (islandId) {
    // we only want to change the ship state to docking once.
    if (this.shipState == 0) {
        this.shipState = 1;
    }

    this.anchorIslandId = islandId;

    // pay everyone salary
    // for (id in this.children)
    // {
    //     var krewMember = this.children[id]
    //     krewMember.gold += krewMember.salary;
    //     this.children[id].salary = 0;
    //     this.children[id].score = 0;
    // }

    // this.supply = 0;
};

Boat.prototype.exitIsland = function () {

    this.shipState = 0;
    this.recruiting = false;
    this.departureTime = 5;

    if (this.anchorIslandId) {
        //set rotation away from island
        this.rotation = rotationToObject(this, entities[this.anchorIslandId]);

        // make a tiny jump so we dont instantly anchor again
        var outward = angleToVector(this.rotation);
        this.position.x = entities[this.anchorIslandId].position.x - outward.x * (entities[this.anchorIslandId].dockRadius + 5);
        this.position.z = entities[this.anchorIslandId].position.z - outward.y * (entities[this.anchorIslandId].dockRadius + 5); // <- careful. y value!
    }

    this.anchorIslandId = undefined;
};

// when ship is abandoning its mothership!
Boat.prototype.exitMotherShip = function (mothership) {

    //set rotation away from mothership
    this.rotation = rotationToObject(this, mothership);

    // make a tiny jump away from mothership
    var outward = angleToVector(this.rotation);
    this.position.x = mothership.position.x - outward.x * (mothership.collisionRadius + 5);
    this.position.z = mothership.position.z - outward.y * (mothership.collisionRadius + 5); // <- careful. y value!

};

// PLayers are entities, check core_entity.js for the base class
Impact.prototype = new Entity();
Impact.prototype.constructor = Impact;

function Impact(type, x, z) {

    this.createProperties();

    // netcode type
    this.netType = 3;

    // very little net data
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;

    // impact type, there are different impact types (in water, in ship, etc)
    this.impactType = type;

    // // size of a Impact
    this.size = new THREE.Vector3(1, 1, 1);

    // impacts have a timeout
    this.timeout = 1.0;

    // set up references to geometry and material
    this.position.y = 0;

    this.position.x = x;
    this.position.z = z;
}

Impact.prototype.logic = function (dt) {

    // tick down the timer and delete on end
    this.timeout -= dt * 0.8;
    if (this.timeout <= 0) {
        removeEntity(this);
    }

};

Impact.prototype.getTypeSnap = function () {
    var snap = {
        a: this.impactType,
    };
    return snap;
};

Impact.prototype.getTypeDelta = function () {
    if (!this.spawnPacket) {
        this.spawnPacket = true;
        return this.getTypeSnap();
    }

    return undefined;
};

// function that parses a snapshot
Impact.prototype.parseTypeSnap = function (snap) {
    if (snap.a !== undefined) {this.impactType = parseFloat(snap.a);}
};

// PLayers are entities, check core_entity.js for the base class
Pickup.prototype = new Entity();
Pickup.prototype.constructor = Pickup;

function Pickup(size, x, z, type, specialBonus) {
    this.createProperties();

    // netcode type
    this.netType = 4;
    this.bonusValues = [50, 75, 100, 10000, specialBonus]; //"specialBonus" for special bonus lul

    // Pickup type, there are different Pickup types. supplies = 0
    this.pickupSize = size;
    this.bonus = this.bonusValues[this.pickupSize] || 25;


    this.captainsCutRatio = 0.3;

    // net data
    this.sendDelta = type !== 1;
    this.sendSnap = !(type === 0 || type === 2 || type === 3);
    this.sendCreationSnapOnDelta = true;
    this.spawnPacket = false;

    // // size of a Pickup
    var scale = 1;
    if (type === 0) {
        scale = parseInt(size) + 1;
    }

    if (type === 1) {
        scale = 0.05 * size;
    }

    if (type === 3 || type === 2) {
        scale = 0.02;
    }
    
    if (type === 4) {
        scale = 2;
    }

    this.size = new THREE.Vector3(scale, scale, scale);
    this.modelscale = new THREE.Vector3(scale, scale, scale);
    this.position.x = x;
    this.position.z = z;
    this.pickerId = '';
    this.type = type;
    this.picking = type == 1? true : false;
    this.catchingFish = false;
    this.timeout = 1;
    /**
     * Type 0 = crates
     * Type 1 = sea animals
     * Type 2 = static supplies like shells
     * Type 3 = island animal
     * Type 4 = chests
     */
}

Pickup.prototype.randomTime = function (min, max) {
    return (Math.floor(Math.random() * (max - min)) + min) * 1000;
};

Pickup.prototype.randomMovementLogic = function () {
    this.randomMovementLogicTime = this.randomMovementLogicTime || Date.now();
    this.randomMovementTime = this.randomMovementTime || this.randomTime(5, 10);
    if (Date.now() - this.randomMovementLogicTime > this.randomMovementTime) {
        var move =  Math.round(Math.random());
        if (move) {
            var landmark = false;
            for (var landmarkId in core.Landmarks) {
                if (
                    core.Landmarks[landmarkId].pickups !== undefined &&
                    core.Landmarks[landmarkId].pickups[this.id] !== undefined
                ) {
                    landmark = core.Landmarks[landmarkId];
                    break;
                }
            }

            if (landmark !== false) {
                var pickupPosition = {
                    x: 0,
                    z: 0,
                };

                var distanceFromCenter = 0;
                var distanceFromPickup = 0;
                while (
                    distanceFromPickup < 2 ||
                    distanceFromCenter > landmark.dockRadius - 30 ||
                    distanceFromCenter < landmark.dockRadius - 40
                ) {
                    pickupPosition.x = Math.floor(
                            Math.random() * (
                                (this.position.x + 6) -
                                (this.position.x - 6)
                            )
                        ) + (this.position.x - 6);

                    pickupPosition.z = Math.floor(
                            Math.random() * (
                                (this.position.z + 6) -
                                (this.position.z - 6)
                            )
                        ) + (this.position.z - 6);

                    distanceFromPickup = Math.sqrt(
                        (pickupPosition.x - this.position.x) *
                        (pickupPosition.x - this.position.x) +
                        (pickupPosition.z - this.position.z) *
                        (pickupPosition.z - this.position.z)
                    );

                    distanceFromCenter = Math.sqrt(
                        (pickupPosition.x - landmark.position.x) *
                        (pickupPosition.x - landmark.position.x) +
                        (pickupPosition.z - landmark.position.z) *
                        (pickupPosition.z - landmark.position.z)
                    );
                }

                this.position.x = pickupPosition.x;
                this.position.z = pickupPosition.z;
            }
        }

        this.randomMovementLogicTime = Date.now();
        this.randomMovementTime = this.randomTime(5, 10);
    }
};

Pickup.prototype.logic = function (dt) {

    if (this.picking)
    {
        this.timeout -= dt * 0.5;
        if(this.timeout <= 0 || this.timeout === 1)
            removeEntity(this);
    }

    // if pickup should be picked but the picker player is undefined, delete it
    if (this.picking === true && this.pickerId !== '' && entities[this.pickerId] === undefined) {
        removeEntity(this);
    }

    /*if (this.picking == true && (this.type == 2 || this.type == 3))
    {
        removeEntity(this);
    }*/


    if (this.type === 0 || this.type === 4 && (this.picking !== true)) {
        // check for all boats that's within pickup distance of pickups
        for (b in boats) {

            var boat = boats[b];

            // dont check against boats that have died
            if (boat.hp <= 0) {
                continue;
            }

            var loc = boat.toLocal(this.position);

            // then do a AABB && only take damage if the person who shot this projectile is from another boat (cant shoot our own boat)
            if (!isNaN(loc.x) && !(Math.abs(loc.x) > Math.abs(boat.size.x * 0.6 + 3) ||
                Math.abs(loc.z) > Math.abs(boat.size.z * 0.6 + 3))) {

                // if (
                //     boat.supply < boatTypes[boat.shipclassId].cargoSize ||
                //     boat.hp < boatTypes[boat.shipclassId].hp
                // ) {
                var bonus = this.bonusValues[this.pickupSize];

                // boat.supply = Math.min(boatTypes[boat.shipclassId].cargoSize, boat.supply + bonus);
                var totalScore = 0;
                for (id in boat.children) {
                    var player = boat.children[id];
                    totalScore += player.score;
                }

                // console.log("totalscore", totalScore)
                // distribute gold accordingly to each players' score
                var captainsCut = bonus;
                for (id in boat.children) {
                    var player = boat.children[id];
                    if (player != boat.captain) {
                        var playersCut = (player.score / totalScore) * (1 - this.captainsCutRatio) * bonus;
                        player.gold += playersCut;
                        captainsCut -= playersCut;
                    }
                }

                var captain = boat.children[boat.captainId];

                if (captain) {
                    captain.gold += captainsCut;
                }

                // this.supply = 0;

                boat.hp = Math.min(boatTypes[boat.shipclassId].hp, boat.hp + (bonus * 0.2));

                removeEntity(this);

                // }
            }
        }
    }

    if (this.type === 2 || this.type === 3) {
        for (var playerId in entities) {
            if (entities[playerId].netType === 0) {
                var player = entities[playerId];
                var playerPosition = player.worldPos();
                var distanceFromPlayer = Math.sqrt(
                    (this.position.x - playerPosition.x) *
                    (this.position.x - playerPosition.x) +
                    (this.position.z - playerPosition.z) *
                    (this.position.z - playerPosition.z)
                );

                if (distanceFromPlayer < 2) {
                    if (distanceFromPlayer < 1.6)
                        removeEntity(this);
                    this.picking = true;
                    this.pickerId = player.id;
                    player.gold += this.bonusValues[this.pickupSize] / 3 * 2;
                    player.updateExperience(Math.round(this.bonusValues[this.pickupSize] / 20));
                }
            }
        }
    }

    //if (this.type === 3) {
    //    this.randomMovementLogic();
    //}
};

Pickup.prototype.getTypeSnap = function () {
    var snap = {
        s: this.pickupSize,
        p: this.picking,
        i: this.pickerId,
        t: this.type,

    };
    return snap;
};

Pickup.prototype.getTypeDelta = function () {

    if (this.type == 1)
    {
        if (!this.spawnPacket) {
            this.spawnPacket = true;
            return this.getTypeSnap();
        }

        return undefined;
    }
    else
    {
        var delta = {
            s: this.deltaTypeCompare('s', this.pickupSize),
            p: this.deltaTypeCompare('p', this.picking),
            i: this.deltaTypeCompare('i', this.pickerId),
            t: this.deltaTypeCompare('t', this.type),
        };
        if (isEmpty(delta)) {delta = undefined;}

        return delta;
    }

};

// function that parses a snapshot
Pickup.prototype.parseTypeSnap = function (snap) {
    if (snap.s !== undefined && snap.s != this.pickupSize) {this.pickupSize = parseInt(snap.s);}

    if (snap.p !== undefined && snap.p != this.picking) {this.picking = parseBool(snap.p);}

    if (snap.i !== undefined && snap.i != this.pickerId) {this.pickerId = snap.i;}

    if (snap.t !== undefined && snap.t != this.type) {this.type = parseInt(snap.t);}

};

// function that parses a snapshot
Pickup.prototype.onDestroy = function () {

    // makre sure to also call the entity ondestroy
    Entity.prototype.onDestroy.call(this);

    if (pickups[this.id]) {
        delete pickups[this.id];
    }
};

// PLayers are entities, check core_entity.js for the base class
Landmark.prototype = new Entity();
Landmark.prototype.constructor = Landmark;

function Landmark(type, x, z, config) {

    this.createProperties();

    this.name = config.name || '';

    this.goodsPrice = config.goodsPrice;

    // netcode type
    this.netType = 5;

    // landmark type
    this.landmarkType = type;

    // docking / anchoring ?
    this.dockType = 1;
    this.dockRadius = config.dockRadius;
    this.spawnPlayers = config.spawnPlayers;
    this.onlySellOwnShips = config.onlySellOwnShips;

    // net data
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;

    // // size of a Landmark
    this.size = new THREE.Vector3(this.dockRadius, 20, this.dockRadius);

    this.position.x = x;
    this.position.z = z;

    this.collisionRadius = 30;
}

Landmark.prototype.getTypeSnap = function () {
    var snap = {
        t: this.landmarkType,
        name: this.name,
        dockRadius: this.dockRadius,
    };
    return snap;
};

// function that parses a snapshot
Landmark.prototype.parseTypeSnap = function (snap) {
    if (snap.t !== undefined) {this.pickupSize = parseInt(snap.t);}
};

Landmark.prototype.logic = function (dt) {

    for (c in this.children)
    {
        var child = this.children[c];
        if (child.netType !== 0)
            continue;
        else
        {
            if (child.parent !== this)
            {
                this.children[child.id] = undefined;
                delete this.children[child.id];
            }

        }
    }

    // if this landmark is a dockable thing (rocks etc dont have docks)
    if (this.dockType > 0) {

        // check for nearby boats. anchor them automatically if they just entered
        // check against all boats
        for (b in boats) {

            var boat = boats[b];

            // dont check against boats that have died
            if (boat.hp <= 0 || boat.shipState == 3) {continue;}

            if (this.isWithinDockingRadius(boat.position.x, boat.position.z)) {
                boat.enterIsland(this.id);

                //boat.anchorIsland = this;

                boat.updateProps();

                if (boat.shipState === 2) {
                    boat.shipState = 3;
                    boat.recruiting = boat.isLocked !== true;
                    boat.lastMoved = new Date();
                    for (let c in boat.children) {
                        var child = boat.children[c];
                        if (child && child.netType === 0) {
                            if (child.socket && child.id !== boat.captainId) {
                                child.socket.emit('showIslandMenu');
                            }
                        }
                    }
                }

                // socket emit to crew
                for (let c in boat.children) {
                    child = boat.children[c];

                    // see if child is a player and has a socket
                    if (child && child.netType === 0 && child.socket) {
                        if (!child.sentDockingMsg) {
                            child.socket.emit('enterIsland', { gold: child.gold, captainId: boat.captainId });
                            child.sentDockingMsg = true;
                        }
                    }
                }
            }
        }
    }

};

Landmark.prototype.isWithinDockingRadius = function (x, z) {
    return distance({ x: x, z: z }, this.position) < this.dockRadius - 2;
};

// function for creating timestamp (for logging)
function get_timestamp() {
    return (new Date()).toUTCString() + " | ";
}

// PLayers are entities, check core_entity.js for the base class
Projectile.prototype = new Entity();
Projectile.prototype.constructor = Projectile;

function Projectile(shooter) {
    this.createProperties();

    // netcode type
    this.netType = 2;

    // size of a Projectile

    this.size = new THREE.Vector3(0.3, 0.3, 0.3);

    // projectiles dont send a lot of delta data
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;
    this.muted = ['x', 'z'];
    this.shooterid = '';
    this.shooterStartPos = new THREE.Vector3(); //initial world position of shooter
    this.reel = false;
    this.impact = undefined;

    this.type = -1; // 0 = cannon ball, 1 = fishing hook

    // duration of projectile being airbourne
    this.airtime = 0;

    // this is a flag that is used to amke sure the info is sent insantly once the ball spawns
    this.spawnPacket = false;

    this.setProjectileModel = true;

    // set up references to geometry and material

    /* If player doesn't exist, has no active weapon, on island with cannon active, player's ship is destroyed,
        player is on boat and just logged, player's ship is docked -> remove the projectile */
    if (
        !shooter || shooter.activeWeapon === -1 || shooter.activeWeapon === 2 ||
        (shooter.parent.netType === 5 && shooter.activeWeapon === 0) ||
        shooter.parent.hp <= 0 ||
        (
            shooter.activeWeapon === 0 &&
            (
                shooter.parent.shipState === -1 ||
                shooter.parent.shipState === 4 ||
                shooter.parent.shipState === 3
            )
        )
    ) {
        if(this.impact) this.impact.destroy = true;
        removeEntity(this);
        return;
    }

    this.shooterid = shooter.id;
    this.shooter = shooter;
    var pos = shooter.worldPos();
    this.position.x = pos.x;
    this.position.z = pos.z;
    if (shooter.parent.netType === 1) {
        this.position.y = this.shooter.parent.getHeightAboveWater() + 0.5;
    } else {
        this.position.y = 2.4;
    }
    //this.position.y = shooter.parent.netType == 5 ? 2.4 : this.shooter.parent.getHeightAboveWater() + 0.5;
    this.rotation = shooter.rotation + (shooter.parent ? shooter.parent.rotation : 0);
    this.shooterStartPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    var moveVector = new THREE.Vector3(0, 0, -1);
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
    this.velocity = moveVector;

    if (this.shooter && this.shooter.activeWeapon === 1) {
        var vertspeed = Math.cos(shooter.pitch * 0.75) * (40 + (Math.min(10000, parseFloat(shooter.score)) / 2000));
        var upspeed = Math.sin(shooter.pitch * 0.75) * (40 + (Math.min(10000, parseFloat(shooter.score)) / 2000));
        this.velocity.x *= vertspeed;
        this.velocity.z *= vertspeed;
        this.velocity.y = upspeed;
        this.type = 1;
    } else if (this.shooter && this.shooter.activeWeapon === 0) {
        var attackDistanceBonus = (1 + (parseFloat(shooter.attackDistanceBonus) + shooter.pointsFormula.getDistance()) / 100);
        vertspeed = Math.cos(shooter.pitch * attackDistanceBonus) * (40 + (Math.min(10000, parseFloat(shooter.score)) / 2000));
        upspeed = Math.sin(shooter.pitch * attackDistanceBonus) * (40 + (Math.min(10000, parseFloat(shooter.score)) / 2000));
        this.velocity.x *= vertspeed * attackDistanceBonus;
        this.velocity.z *= vertspeed * attackDistanceBonus;
        this.velocity.y = upspeed * attackDistanceBonus;
        this.shooter.shotsFired += 1;
        this.type = 0;
    }
}

Projectile.prototype.logic = function (dt) {

    // Remove if the soooter does not exists
    if (
        this.shooterid === '' ||
        entities[this.shooterid] === undefined ||
        (entities[this.shooterid] !== undefined &&
        this.type != -1 && this.type != entities[this.shooterid].activeWeapon)
    ) {
        if(this.impact) this.impact.destroy = true;
        removeEntity(this);
        return;
    }


    if (entities[this.shooterid] !== undefined && entities[this.shooterid].use == false)
    {
        entities[this.shooterid].isFishing = false;
    }

    if (this.position.y >= 0) {
        // gravity is acting on the velocity
        this.velocity.y -= 25.0 * dt;
        this.position.y += this.velocity.y * dt;
    }

    if (entities[this.shooterid] !== undefined) {
        var playerPos = entities[this.shooterid].worldPos();

        // If the player is on a boat, don't destroy the fishing rod if they are moving unless it's far from player
        if (entities[this.shooterid].parent !== undefined &&
            entities[this.shooterid].parent.netType == 5)
        {
            if (playerPos.z.toFixed(2) != this.shooterStartPos.z.toFixed(2) &&
                playerPos.x.toFixed(2) != this.shooterStartPos.x.toFixed(2)) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        }
        else
        {
            var fromPlayertoRod = playerPos.distanceTo(this.shooterStartPos);
            //var fromPlayertoRod = distance(playerPos,this.shooterStartPos)
            if (fromPlayertoRod >= 40) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        }

    }

    if (this.position.y < 10) {// if the cannon ball is below surface level, remove it
        var hasHitBoat = false;

        // on the server, we will spawn an impact
        if (this.shooter && this.shooter.parent.captain) {

            // if player's active weapon is cannon
            if (this.shooter.activeWeapon === 0) {
                // counter for hits done "per shot"
                this.shooter.overall_hits = 0;
                // check against all boats
                for (b in boats) {

                    var boat = boats[b];

                    // dont check against boats that have died or are docked
                    if (boat.hp <= 0 || boat.shipState === 3 || boat.shipState === -1 || boat.shipState === 4) {
                        continue;
                    }

                    var loc = boat.toLocal(this.position);

                    // then do a AABB && only take damage if the person who shot this projectile is from another boat (cant shoot our own boat)
                    if (
                        this.shooter.parent !== boat &&
                        !(Math.abs(loc.x) > Math.abs(boat.size.x * 0.5) || Math.abs(loc.z) > Math.abs(boat.size.z * 0.5)) &&
                        this.position.y < boat.getHeightAboveWater() + 3 && boat.captain &&
                        // check if captains are in the same clan
                        (!this.shooter.parent.captain.clan || this.shooter.parent.captain.clan === "" || this.shooter.parent.captain.clan !== boat.captain.clan)
                    ) {

                        hasHitBoat = true;
                        // count the amount of boats the player hit at the same time
                        this.shooter.overall_hits += 1;
                        // count the amount of shots hit
                        this.shooter.shotsHit += 1;

                        // sum up all allocated points
                        var countAllocatedPoints = 0;
                        for (var i in this.shooter.points) {
                            countAllocatedPoints += this.shooter.points[i];
                        }

                        // check if player has too many allocated points --> kick
                        if (countAllocatedPoints > 52){
                            console.log(get_timestamp() + "Exploit (stats hacking), allocated stats: " + countAllocatedPoints + " | IP " + this.shooter.socket.handshake.address);
                            this.shooter.socket.disconnect()
                        }

                        var attackDamageBonus = parseInt(this.shooter.attackDamageBonus + this.shooter.pointsFormula.getDamage());
                        var attackSpeedBonus = parseFloat((this.shooter.attackSpeedBonus + this.shooter.pointsFormula.getFireRate()) / 100);
                        var attackDistanceBonus = (this.airtime * this.airtime / 2) *
                            (1 + ((this.shooter.attackDistanceBonus + this.shooter.pointsFormula.getDistance()) / 8));

                        var damage = 8 + attackDamageBonus + attackDistanceBonus;
                        if (entities[boat.captainId]) {
                            damage = damage + (damage * attackSpeedBonus) - (damage * entities[boat.captainId].armorBonus)/100;
                        }

                        if (this.shooter.parent.crewName !== undefined){
                                this.shooter.socket.emit('showDamageMessage', '+ ' + parseFloat(damage).toFixed(1) + ' hit', 2);
                                this.shooter.addScore(damage);
                        }

                        // Update the player experience based on the damage dealt
                        this.shooter.updateExperience(damage);

                        boat.hp -= damage;

                        for (var s in boat.children){
                          boat.children[s].socket.emit('showDamageMessage', '- ' + parseFloat(damage).toFixed(1) + ' hit', 1);
                        }

                        if (boat.hp <= 0) {
                            // if player destroyed a boat, increase the score
                            this.shooter.shipsSank += 1;
                            // levels for pirate quests
                            if (this.shooter.shipsSank === 1){
                                this.shooter.socket.emit('showCenterMessage', "Achievement ship teaser: +1,000 gold +100 XP" , 3);
                                this.shooter.gold += 1000;
                                this.shooter.experience += 100;
                            }
                            if (this.shooter.shipsSank === 5){
                                this.shooter.socket.emit('showCenterMessage', "Achievement ship sinker: +5,000 gold +500 XP" , 3);
                                this.shooter.gold += 5000;
                                this.shooter.experience += 500;
                            }
                            if (this.shooter.shipsSank === 10){
                                this.shooter.socket.emit('showCenterMessage', "Achievement ship killer: +10,000 gold +1,000 XP" , 3);
                                this.shooter.gold += 10000;
                                this.shooter.experience += 1000;
                            }
                            if (this.shooter.shipsSank === 20){
                                this.shooter.socket.emit('showCenterMessage', "Achievement ship slayer: +20,000 gold +1,000 XP" , 3);
                                this.shooter.gold += 20000;
                                this.shooter.experience += 1000;
                            }

                            // calculate amount of killed ships (by all crew members)
                            var crew_kill_count = 0;
                            for (y in core.players) {
                                var otherPlayer = core.players[y];
                                if (otherPlayer.parent !== undefined && this.shooter.parent.id === otherPlayer.parent.id){
                                    crew_kill_count += otherPlayer.shipsSank;
                                }
                            }
                            this.shooter.parent.overall_kills = crew_kill_count;

                            // add death to entity of all players on boat which was sunk
                            for (p in boat.children){
                                boat.children[p].deaths = (boat.children[p].deaths === undefined ? 0 : boat.children[p].deaths);
                                boat.children[p].deaths += 1;

                                // update death count in mongo DB
                                if (boat.children[p].isLoggedIn === true) {
                                    let deathQuery = { playerName: boat.children[p].name };
                                    let deathObj = { $inc: { deaths: 1 } };
                                    core.UpdateOneWithQuery('players', deathQuery, deathObj, false, function (res) {
                                        if (res['modifiedCount'] !== 1) {
                                            console.log(get_timestamp() + "Mongo Error: Increase player's deaths FAILED")
                                        }
                                    })
                                }
                            }

                            // emit + log kill chain
                            var whoKilledWho = this.shooter.name + " sunk " + boat.crewName;
                            io.emit('showKillMessage', whoKilledWho);
                            let victimGold = 0;
                            for (let p in boat.children) {
                                victimGold += boat.children[p].gold
                            }
                            console.log(get_timestamp() + whoKilledWho + " | Kill count boat: " + this.shooter.parent.overall_kills, "| Shooter gold:", this.shooter.gold, "| Victim gold:", victimGold);
                            
                            // update kill count and player highscore in mongo db
                            if (this.shooter.isLoggedIn === true && this.shooter.serverNumber === 1){
                                if (this.shooter.gold > this.shooter.highscore) {
                                    this.shooter.highscore = this.shooter.gold;
                                    var myobj = { $set: { highscore: Math.round(this.shooter.highscore) }, $inc: { overall_kills: 1 } };
                                    console.log(get_timestamp() + "Update highscore for player:", this.shooter.name, "| Old highscore:", this.shooter.highscore, "| New highscore:", + this.shooter.gold, "| IP:", this.shooter.socket.handshake.address);
                                }
                                else {
                                    myobj = { $inc: { overall_kills: 1 } };
                                }
                                var query = { playerName: this.shooter.name };

                                core.UpdateOneWithQuery('players', query, myobj, false, function (res) {
                                    if (res['modifiedCount'] !== 1) {
                                        console.log(get_timestamp() + "Mongo Error: Increase player's kill count FAILED")
                                    }
                                })
                            }
                        }
                    }
                }
                // Check for "Sea-is-lava-hack". If detected, kick the shooter
                if (this.shooter.overall_hits >= 10){
                    console.log(get_timestamp() + "Exploit detected: Sea-is-lava-hack | Player: " + this.shooter.name + " | Adding IP " + this.shooter.socket.handshake.address + " to bannedIPs");
                    // kick the hacker
                    this.shooter.socket.disconnect();
                }
            }

            // if player's active weapon is fishing rod
            else if (this.shooter.activeWeapon === 1) {
                // check against all pickups
                var pickupCount = 0;
                for (let p in pickups) {

                    var pickup = pickups[p];
                    if (pickup.type === 0 || pickup.type === 1 || pickup.type === 4 && (pickup.picking !== true)) {
                        var pickLoc = pickup.toLocal(this.position);

                        if (!(Math.abs(pickLoc.x) > Math.abs(pickup.size.x * 2) || Math.abs(pickLoc.z) > Math.abs(pickup.size.z * 2))) {
                            pickup.picking = true;
                            pickup.pickerId = this.shooterid;
                            var bonus = pickup.bonusValues[pickup.pickupSize];
                            let pickupReward = 0;
                            if (pickup.type === 1) {
                                this.shooter.isFishing = false;
                                bonus = bonus * 3;
                            }
                            if (pickup.type === 4){
                                pickupReward = bonus;
                            } else {
                                pickupReward = Math.floor(Math.random() * bonus) + 20;
                            }

                            this.shooter.gold += pickupReward;
                            this.shooter.updateExperience(Math.round(bonus / 10));
                            this.reel = true;
                            pickupCount++;
                            if (pickupCount > 2) {
                                break;
                            }
                        }
                    }
                }
            }
        }

        // if boat was hit or we fall in water, remove
        if (this.position.y < 0 || hasHitBoat) {
            if (this.impact !== undefined) removeEntity(this.impact);
            this.impact = new Impact(hasHitBoat ? 1 : 0, this.position.x, this.position.z);

            // give the impact some random id
            var id;
            while (!id || entities[id] !== undefined) { id = 'i' + Math.round(Math.random() * 5000); }
            entities[id] = this.impact;
            this.impact.id = id;

            //if boat was hit or
            if (
                this.reel ||
                this.shooterid === '' ||
                entities[this.shooterid] === undefined ||
                entities[this.shooterid].use == true ||
                entities[this.shooterid].activeWeapon === 0 ||
                this.position.x > worldsize ||
                this.position.z > worldsize ||
                this.position.x < 0 ||
                this.position.z < 0
            ) {
                if(this.impact) this.impact.destroy = true;
                removeEntity(this);
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
                entities[this.shooterid].isFishing = true;
                // if player is sailing, increase probability of them catching a fish
                var fishProb = (entities[this.shooterid].parent && entities[this.shooterid].parent.netType === 1 &&
                    entities[this.shooterid].parent.shipState !== 3) ? Math.random() - 0.04 : Math.random();
                if (fishProb <= 0.01) {
                    var biggerFish = Math.floor(Math.random() * 2) + 1;
                    var fish = createPickup(biggerFish, this.position.x, this.position.z, 1, false);
                    fish.picking = true;
                    fish.pickerId = this.shooterid;
                }
            }
        }
    }
    this.airtime += dt;
};

Projectile.prototype.getTypeSnap = function () {
    var snap = {
        x: this.position.x.toFixed(2), // x and z position relative to parent
        z: this.position.z.toFixed(2),
        y: this.position.y.toFixed(2),
        vx: this.velocity.x.toFixed(2),
        vy: this.velocity.y.toFixed(2),
        vz: this.velocity.z.toFixed(2),
        i: this.shooterid,
        r: this.reel,
        sx: this.shooterStartPos.x.toFixed(2),
        sz: this.shooterStartPos.z.toFixed(2),
    };

    return snap;
};

var Config = {
    startingItems: {
        gold: 0,

        // Only the items in here can be traded by the player
        goods: {
            rum: 0,
            coffee: 0,
            spice: 0,
            silk: 0,

            // water: 50,
            // food: 50
        },
    },
    drainers: {
        // water: { rate: 1, time: 10 },
        // food: { rate: 1, time: 10 },
        // wood: { rate: 1, time: undefined },
        // gunpowder: { rate: 1, time: undefined },
    },

    landmarks: [
        {
            type: 0, x: 350, y: 350, name: 'Guinea', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 38, coffee: 22, spice: 22, silk: 310, water: 1, food: 1 },
            goodsPrice: { rum: 38, coffee: 22, spice: 22, silk: 310 },
        },
        {
            type: 0, x: 1350, y: 350, name: 'Spain', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 52, coffee: 65, spice: 35, silk: 180, water: 1, food: 1 },
            goodsPrice: { rum: 52, coffee: 65, spice: 35, silk: 180 },
        },
        {
            type: 0, x: 350, y: 1350, name: 'Labrador', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 22, coffee: 40, spice: 25, silk: 230, water: 1, food: 1 },
            goodsPrice: { rum: 48, coffee: 40, spice: 14, silk: 230 },
        },
        {
            type: 0, x: 1350, y: 1350, name: 'Brazil', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 28, coffee: 26, spice: 14, silk: 150, water: 1, food: 1 },
            goodsPrice: { rum: 60, coffee: 26, spice: 25, silk: 150 },
        },
        {
            type: 0, x: 850, y: 850, name: 'Jamaica', dockRadius: 100, spawnPlayers: false, onlySellOwnShips: true,
            // goodsPrice: { rum: 56, coffee: 70, spice: 40, silk: 240, water: 1, food: 1 },
            goodsPrice: { rum: 32, coffee: 70, spice: 40, silk: 240 },
        },

    ],
};

// ultimately, restructure files into this structure

// core_goods.js
// var goods_types = {
//     water: {
//         drainRate: 1, // every day, how fast is it draining while saling?
//         cargoSpace: 1 // how much cargo space does this good use per unit?
//     },
//     food: {

//     },
//     gunpowder: {

//     },
//     silk: {

//     }
// }

// core_landmarks_types.js
// var landmarks = [
//     {
//         name: 'Labrador',
//         type: 0,
//         x: 200,
//         y: 200,
//         goods: {
//             water {

//             }
//             rum: 3, coffee: 3, spice: 2, silk: 1, water: 200, food: 200
//         }
//     },
//     {
//         name: 'Brazil',
//         type: 0,
//         x: 800,
//         y: 700,
//         goodsPrice: { rum: 2, coffee: 2, spice: 2, silk: 2, water: 200, food: 200 }
//     },
//     {
//         type: 0, x: 700, y: 300, name: 'Spain',
//         goodsPrice: { rum: 1, coffee: 1, spice: 2, silk: 2, water: 200, food: 200 }
//     },
//     {
//         type: 0, x: 200, y: 800, name: 'Guinea',
//         goodsPrice: { rum: 2, coffee: 1, spice: 2, silk: 3, water: 200, food: 200 }
//     }
// ]

global.entities = entities;
var compressor = require('../compressor/compressor.js');

var createPlayer = function (data) {
    data = data || {};
    data.startingItems = Object.assign({}, Config.startingItems);
    data.disableSnapAndDelta = true;

    var player = new Player(data);

    // real player
    if (TEST_ENV) {
        //if (data && players[player.id] === undefined) {
        if (data) {
            player.id = data.socketId;
        } else {
            player.id = randomid();
        }
    } else {
        player.id = data.socketId;
    }

    // add player to global array variables
    players[player.id] = player;
    entities[player.id] = player;
    return player;
};

var createPickup = function (size, x, z, type, collisionIsland, specialBonus) {

    var x = Math.min(Math.max(0, x), worldsize);
    var z = Math.min(Math.max(0, z), worldsize);
    // check if it is in island position
    if (!collisionIsland){
        for (l in entities) {
            if (entities[l].netType == 5 && (type == 0 || type == 4)) {
                if (entities[l].isWithinDockingRadius(x, z)) {
                    //console.log("stopped pickup from spawning in docking radius")
                    return;
                }
            }
        }
    }

    //core.createPickup
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    var p = new Pickup(size, x, z, type, specialBonus);
    p.id = id;

    pickups[id] = p;
    entities[id] = p;

    return p;
};

var createBoat = function (captainId, krewName, spawnBool) {
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    let err = new Error();

    var b = new Boat(captainId, krewName, spawnBool);
    b.id = id;

    boats[id] = b;
    entities[id] = b;
    return b;
};

var createLandmark = function (type, x, z, name) {
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    var l = new Landmark(type, x, z, name);
    l.id = id;
    Landmarks[id] = l;
    entities[id] = l;
    return l;
};

var createBot = function () {
    var id;
    while (!id || entities[id] !== undefined) { id = randomid(); }

    var b = new Bot();
    b.id = id;
    bots[id] = b;
    entities[id] = b;
    return b;
};

var removeEntity = function (entity) {

    // remove it from entities object
    if (entity && entities.hasOwnProperty(entity.id)) {
        entity.onDestroy();
        compressor.events[entity.id] = { del: true };
        var id = entity.id;
        delete entities[id];
    }

};

var randomid = function () {
    return Math.random().toString(36).substring(6, 10);
};

exports.iterateEntities = iterateEntities;
exports.entities = entities;

exports.worldsize = worldsize;

exports.boats = boats;
exports.players = players;
exports.pickups = pickups;
exports.bots = bots;
exports.Landmarks = Landmarks;

exports.createPlayer = createPlayer;
exports.createBoat = createBoat;
exports.createLandmark = createLandmark;
exports.createBot = createBot;

exports.createPickup = createPickup;
exports.removeEntity = removeEntity;
exports.entityDistance = entityDistance;
exports.boatTypes = boatTypes;
exports.itemTypes = itemTypes;
exports.goodsTypes = goodsTypes;
exports.config = Config;
exports.compressor = compressor;

// PLayers are entities, check core_entity.js for the base class
Player.prototype = new Entity();
Player.prototype.constructor = Player;

function Player (data) {
    this.isLoggedIn = true;
    this.name = data !== undefined
        ? (data.name || ``)
        : ``;

    if (this.name.trim() === ``) {
        this.name = `seadog${Math.floor(Math.random() * 900) + 100}`;
        this.isLoggedIn = false;
    }

    this.createProperties();

    this.disableSnapAndDelta = !!data.disableSnapAndDelta;

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
    this.last_island = ``; // last island the seadog bought goods on
    this.gold = (data.startingItems || {}).gold || 0; // player gold

    this.islandBoundary = {
        x: 0,
        z: 0
    }; // to limit  boundaries around island
    this.shipsSank = 0; // Number of ships player has sunk
    this.shotsFired = 0; // Number of projectiles player has used
    this.shotsHit = 0; // Number of projectiles that hit other ships

    this.sentDockingMsg = false; // Used to stop server from emitting enterIsland message before docking.
    // Keep track of player state.
    this.state = {
        alive: 0,
        dead: 1,
        respawning: 2
    };
    this.state = 0;

    this.activeWeapon = {
        nothing: -1,
        cannon: 0,
        fishingRod: 1,
        spyglass: 2
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

    // this.items = [];
    this.itemId;

    this.ownsCannon = true;
    this.ownsFishingRod = true;

    this.attackSpeedBonus = 0;
    this.attackDamageBonus = 0;
    this.attackDistanceBonus = 0;
    this.movementSpeedBonus = 0;
    this.armorBonus = 0;
    this.regenBonus = 0;

    // Leveling system
    this.level = 0;
    this.experience = 0;
    this.experienceBase = 100;
    this.experienceMaxLevel = 50;
    this.experienceNeedsUpdate = true;
    // Bank and casino
    this.bank = {
        deposit: 0
    };
    this.casino = {};
    this.markerMapCount = new Date();

    // Build an object with the levels from 0 to max level for future references
    this.experienceNeededForLevels = (function (entity) {
        let levels = {
            0: {
                amount: 0,
                total: 0
            },
            1: {
                amount: entity.experienceBase,
                total: entity.experienceBase
            }
        };

        for (let i = 1; i < entity.experienceMaxLevel + 1; i++) {
            levels[i + 1] = {};
            levels[i + 1].amount = Math.ceil(levels[i].amount * 1.07);
            levels[i + 1].total = levels[i + 1].amount + levels[i].total;
        }

        return levels;
    })(this);

    this.points = {
        fireRate: 0,
        distance: 0,
        damage: 0
    };
    let _this = this;
    this.pointsFormula = {
        getFireRate: () => (_this.points.fireRate >= 50 ? 50 : _this.points.fireRate) * 1.4,

        getDistance: () => (_this.points.distance >= 50 ? 50 : _this.points.distance) / 2,

        getDamage: () => (_this.points.damage >= 50 ? 50 : _this.points.damage) / 2,

        getExperience: (damage) => parseInt(damage * 2.4)
    };

    this.usedPoints = 0;
    this.availablePoints = 0;
    this.updateExperience();
}

Player.prototype.updateExperience = function (damage) {
    let experience = this.experience;
    let level = 0;
    let i;

    if (typeof damage === `number`) {
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
            this.socket.emit(`levelUpdate`, {
                id: this.id,
                level: level
            });
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
    let moveVector = new THREE.Vector3(0, 0, 0);
    moveVector.z = -this.walkForward;
    moveVector.x = this.walkSideward;

    // this.changeWeapon();
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
            if (this.position.x > this.parent.size.x / 2) {
                this.position.x = this.parent.size.x / 2;
            }

            if (this.position.z > this.parent.size.z / 2) {
                this.position.z = this.parent.size.z / 2;
            }

            if (this.position.x < -this.parent.size.x / 2) {
                this.position.x = -this.parent.size.x / 2;
            }

            if (this.position.z < -this.parent.size.z / 2) {
                this.position.z = -this.parent.size.z / 2;
            }

            // oval boat shape collision
            if (this.parent.arcFront > 0 && this.position.z > 0) {
                let bound = this.parent.size.x / 2 - this.position.z * this.parent.arcFront;
                if (this.position.x > 0) {
                    if (this.position.x > bound) {
                        this.position.x = bound;
                    }
                } else {
                    if (this.position.x < -bound) {
                        this.position.x = -bound;
                    }
                }
            }
            if (this.parent.arcBack > 0 && this.position.z < 0) {
                let bound = this.parent.size.x / 2 + this.position.z * this.parent.arcBack;
                if (this.position.x > 0) {
                    if (this.position.x > bound) {
                        this.position.x = bound;
                    }
                } else {
                    if (this.position.x < -bound) {
                        this.position.x = -bound;
                    }
                }
            }
        }
    }

    // use active thing (e.g. cannonbann fire)
    if (this.cooldown > 0) {
        this.cooldown -= dt;
    }

    if (this.use === true && this.cooldown <= 0) {
        let attackSpeedBonus = parseFloat((this.attackSpeedBonus + this.pointsFormula.getFireRate()) / 100);
        this.cooldown = this.activeWeapon === 1 ? 1.1 : (1.5 - attackSpeedBonus).toFixed(2);

        // If we are not in an island or the active weapon is the fishingrod
        // Here we prevent the creation of an empty cannon projectile that does not ment to exist
        if ((this.parent && this.parent.netType !== 5) || this.activeWeapon === 1) {
            ++this.useid;
            let projectile = new Projectile(this);
            entities[`${this.id}${this.useid}`] = projectile;
            projectile.id = `${this.id}${this.useid}`;
            if (this.activeWeapon === 1) {
                this.isFishing = true;
                if (entities[`${this.id}${this.useid - 1}`] !== undefined)
                    removeEntity(entities[`${this.id}${this.useid - 1}`]);
            }
        }
    }
};

// function that generates boat specific snapshot data
Player.prototype.getTypeSnap = function () {
    let obj = {
        f: this.walkForward,
        s: this.walkSideward,
        u: this.use,
        p: this.pitch,
        j: this.jumping,
        m: this.movementSpeedBonus,
        g: this.armorBonus,
        rb: this.regenBonus,
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
                dm: this.damage
            },
            l: this.level
        }
    };

    return obj;
};

// function that generates boat specific snapshot data
Player.prototype.getTypeDelta = function () {
    let delta = {
        f: this.deltaTypeCompare(`f`, this.walkForward),
        s: this.deltaTypeCompare(`s`, this.walkSideward),
        u: this.deltaTypeCompare(`u`, this.use),
        p: this.deltaTypeCompare(`p`, this.pitch.toFixed(2)),
        j: this.deltaTypeCompare(`j`, this.jumping),
        w: this.deltaTypeCompare(`w`, this.activeWeapon),
        c: this.deltaTypeCompare(`c`, this.checkedItemsList),
        d: this.deltaTypeCompare(`d`, this.itemId),
        o: this.deltaTypeCompare(`o`, this.ownsCannon),
        r: this.deltaTypeCompare(`r`, this.ownsFishingRod),
        v: this.deltaTypeCompare(`v`, this.availablePoints)
    };
    if (isEmpty(delta)) {
        delta = undefined;
    }

    return delta;
};

// function that parses a snapshot
Player.prototype.parseTypeSnap = function (snap) {
    if (snap.f !== undefined) {
        this.walkForward = parseInt(snap.f);
    }

    if (snap.s !== undefined) {
        this.walkSideward = parseInt(snap.s);
    }

    if (snap.u !== undefined) {
        this.use = parseBool(snap.u);
    }

    if (snap.p !== undefined) {
        this.pitch = parseFloat(snap.p);
    }

    if (snap.j !== undefined) {
        this.jumping = parseInt(snap.j);
    }

    // if (snap.m !== undefined) {this.movementSpeedBonus = parseInt(snap.m);}

    if (snap.v !== undefined && snap.v !== this.availablePoints) {
        this.availablePoints = parseInt(snap.v);
    }

    if (snap.o !== undefined && snap.o !== this.ownsCannon) {
        this.ownsCannon = parseBool(snap.o);
    }

    if (snap.r !== undefined && snap.r !== this.ownsFishingRod) {
        this.ownsFishingRod = parseBool(snap.r);
    }

    if (snap.c !== undefined && snap.c !== this.checkedItemsList) {
        this.checkedItemsList = parseBool(snap.c);
    }

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
    // this.items.push(item);

    // reset player stats
    this.attackSpeedBonus = 0;
    this.attackDistanceBonus = 0;
    this.movementSpeedBonus = 0;
    this.armorBonus = 0;
    this.regenBonus = 0;
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

    if (item.attributes.regen !== undefined) {
        this.regenBonus += parseInt(item.attributes.regen);
    }

    if (item.attributes.attackDamage !== undefined) {
        this.attackDamageBonus += parseInt(item.attributes.attackDamage);
    }
};

Player.prototype.dequip = function () {
    // this.items = [];

    // reset player stats
    this.attackSpeedBonus = 0;
    this.attackDistanceBonus = 0;
    this.movementSpeedBonus = 0;
    this.attackDamageBonus = 0;
    this.armorBonus = 0;
    this.regenBonus = 0;
};

Player.prototype.purchaseItem = function (itemId) {
    let item = null;
    for (i in itemTypes) {
        if (itemTypes[i].id === parseInt(itemId)) {
            item = itemTypes[i];
        }
    }

    // if player can afford the ship/item
    if (item && this.gold >= item.price) {
        this.gold -= item.price;

        if (itemId !== `16`) {
            this.equip(item);
            this.itemId = itemId;
        }
    }
};

Player.prototype.purchaseShip = function (itemId, krewName) {
    let item;
    for (i in boatTypes) {
        if (i === itemId) {
            item = boatTypes[i];
            break;
        }
    }

    // check if crewCount is larger than maxKrewCapacity and if player is captain
    if (item && this.parent.krewCount > item.maxKrewCapacity && this.isCaptain) {
        this.socket.emit(`showCenterMessage`, `This boat doesn't have enough space for your krew!`, 1);
    }

    // if player can afford the ship
    else if (item && this.gold >= item.price) {
        this.gold -= item.price;
        let oldParent = this.parent;
        let previousState = oldParent.netType === 1 ? oldParent.shipState : 3;

        // if the player is a krewMember (not captain), create a new boat for him
        if ((oldParent.netType === 1 && oldParent.captainId !== this.id) || oldParent.netType === 5) {
            delete oldParent.children[this.id]; // delete him from the previous krew
            oldParent.updateProps && oldParent.updateProps();

            let boat = core.createBoat(this.id, krewName, false);
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
    let item;
    for (i in boatTypes) {
        if (i === itemId) {
            item = boatTypes[i];
            break;
        }
    }
    let boat = core.createBoat(this.id, krewName, true);
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
        if (this.parent.netType === 1) {
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

let parseBool = (b) => b === true || b === `true`;

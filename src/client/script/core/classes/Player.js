/* Player class */

class Player extends Entity {
    /* Constructor */
    constructor(data) {
        // Inherit parent class methods
        super();

        // Set netType
        this.netType = 0;

        // Set player name
        this.name = data !== undefined ? (data.name || ``) : ``;
        this.setName(this.name);

        // Set player state
        this.state = 0;

        // Set login status
        this.isLoggedIn = data.t.l;

        // Set position
        this.position.y = 0.0;

        // Set pitch (Looking up/down)
        this.pitch = 0;

        // Set player size
        this.size = vectors.sizePlayer;

        // Set motion (1 = forward, 0 = no motion, -1 = backwards)
        this.walkForward = 0;
        this.walkSideward = 0;
        this.isFishing = false;

        // Set tools variables
        this.activeWeapon = 0;
        this.use = false;
        this.cooldown = 0;
        this.ownsCannon = true;
        this.ownsFishingRod = true;
        this.rodRotationSpeed = Math.random() * 0.25 + 0.25;

        // Set score variables
        this.score = 50;
        this.overall_cargo = 0;
        this.gold = (data.startingItems || {}).gold || 0;
        this.shipsSank = 0;

        // If the player has checked the items list on an island
        this.checkedItemsList = false;

        // Ship captain variables
        this.isCaptain = false;
        this.oldCaptainState = false;

        // Jumping variables
        this.jumping = 0;
        this.jump_count = 0;
        this.jump = 0.0;
        this.jumpVel = 0.0;

        // Item variables
        this.itemId;
        this.attackSpeedBonus = 0;
        this.movementSpeedBonus = 0;

        // Leveling system variables
        this.level = 0;
        this.experience = 0;
        this.experienceBase = 100;
        this.experienceMaxLevel = 50;
        this.experienceNeedsUpdate = true;
        this.points = {
            fireRate: 0,
            distance: 0,
            damage: 0
        };

        // Bank variables
        this.bank = {
            deposit: 0
        };

        // Clan variables
        this.clan = data.t.cl === `` ? undefined : data.t.cl;
        this.clanLeader = data.t.cll;
        this.clanOwner = data.t.clo;
        this.clanRequest = data.t.cr;

        // Add player to playernames
        if (!playerNames[data.id]) playerNames[data.id] = this.name;

        // Object for notifications
        this.notifiscationHeap = {};

        // Add crosshair
        this.crossHair();



        // Utilities for points
        this.pointsFormula = {
            getFireRate: () => (this.points.fireRate >= 50 ? 50 : this.points.fireRate) * 1.2,

            getDistance: () => (this.points.distance >= 50 ? 50 : this.points.distance) / 2,

            getDamage: () => (this.points.damage >= 50 ? 50 : this.points.damage) / 2,

            getExperience: (damage) => parseInt(damage * 2.4)
        };

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
    }
};

Player.prototype.notifiscation = function () {
    for (let z in this.notifiscationHeap) {
        if (this.notifiscationHeap[z].isNew) {
            this.notifiscationHeap[z].sprite = new THREE.TextSprite({
                textSize: (this.notifiscationHeap[z].type) === 1 ? 0.6 : 0.9,
                redrawInterval: 10,
                texture: {
                    text: this.notifiscationHeap[z].text,
                    fontFamily: config.Labels.fontFamily
                },
                material: {
                    color: (this.notifiscationHeap[z].type) === 1 ? 0xFFD700 : 0x62ff00,
                    fog: false,
                    opacity: 0.0
                }
            });
            this.notifiscationHeap[z].sprite.position.set(3, 1, 0);
            this.geometry.add(this.notifiscationHeap[z].sprite);
            this.notifiscationHeap[z].isNew = false;
        } else {
            this.notifiscationHeap[z].sprite.position.y += 0.05;
            if (this.notifiscationHeap[z].sprite.position.y > 6) {
                this.geometry.remove(this.notifiscationHeap[z].sprite);
                delete this.notifiscationHeap[z];
            } else if (this.notifiscationHeap[z].sprite.position.y < 3) {
                this.notifiscationHeap[z].sprite.material.opacity += 0.025;
            }
        }
    }
};

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

    this.level = level;
    this.experience = experience;

    if (ui !== undefined && this.experienceNeedsUpdate) {
        ui.updateUiExperience();
        this.experienceNeedsUpdate = false;
    }
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

    // collisions (movement restriction when on boat and not anchored/docked yet)
    if (this.parent) {
        if (this.parent.netType === 5 || this.parent.shipState === 3 || this.parent.shipState === -1) {
            this.velocity.x *= 2;
            this.velocity.z *= 2;
        }

        if (this.parent.netType !== 5 && this.parent.shipState !== 3 && this.parent.shipState !== 2 && this.parent.shipState !== -1 && this.parent.shipState !== 4) {
            if (this.position.x > this.parent.size.x / 2) {
                this.position.x = this.parent.size.x / 2;
                if (this.isPlayer)
                    ui.playAudioFile(false, `turning`);
            }

            if (this.position.z > this.parent.size.z / 2) {
                this.position.z = this.parent.size.z / 2;
                if (this.isPlayer)
                    ui.playAudioFile(false, `turning`);
            }

            if (this.position.x < -this.parent.size.x / 2) {
                this.position.x = -this.parent.size.x / 2;
                if (this.isPlayer)
                    ui.playAudioFile(false, `turning`);
            }

            if (this.position.z < -this.parent.size.z / 2) {
                this.position.z = -this.parent.size.z / 2;
                if (this.isPlayer)
                    ui.playAudioFile(false, `turning`);
            }

            // oval boat shape collision
            if (this.parent.arcFront > 0 && this.position.z > 0) {
                var bound = this.parent.size.x / 2 - this.position.z * this.parent.arcFront;
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
                var bound = this.parent.size.x / 2 + this.position.z * this.parent.arcBack;
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
        this.cooldown = this.activeWeapon === 1 ? 2 : (1.5 - attackSpeedBonus).toFixed(2);

        if (this.activeWeapon === 0 && this.isPlayer && this.parent && this.parent.shipState !== 3 && this.parent.shipState !== 4)
            ui.playAudioFile(false, `cannon`);

        else if (this.isPlayer && this.activeWeapon === 1)
            ui.playAudioFile(false, `cast-rod`);
    }
    if (!this.isPlayer) {
        this.geometry.rotation.x = this.pitch + this.rotationOffset;
    }
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

Player.prototype.setName = function (name) {
    let clan = ``;
    if (this.clan !== undefined && this.clan !== ``) {
        clan = `[${this.clan}] `;
    }
    if (this.geometry !== undefined) {
        if (this.label === undefined) {
            // Set the name
            this.label = new THREE.TextSprite({
                textSize: 0.7,
                redrawInterval: config.Labels.redrawInterval,
                texture: {
                    text: `${clan + (config.Admins.includes(this.name) ? `[Admin] ` : config.Mods.includes(this.name) ? `[Staff] ` : config.Devs.includes(this.name) ? `[Dev] ` : ``) + name} (lvl ${this.level})`,
                    fontFamily: config.Labels.fontFamily
                },
                material: {
                    color: config.Admins.includes(this.name) || config.Mods.includes(this.name) || config.Devs.includes(this.name) ?
                        labelcolors.staff : this.isPlayer ?
                        labelcolors.myself : this.isCaptain ?
                        labelcolors.captain : labelcolors.player,
                    fog: false
                }
            });

            this.label.name = `label`;
            this.label.position.set(0, 2.2, 1.5);
            this.geometry.add(this.label);
        }
        this.label.material.map.text = `${clan + (config.Admins.includes(this.name) ? `[Admin] ` : config.Mods.includes(this.name) ? `[Staff] ` : config.Devs.includes(this.name) ? `[Dev] ` : ``) + name} (lvl ${this.level})`;
        this.label.visible = myPlayer && myPlayer.parent && this.inRange && this.parent !== undefined &&
            (this.parent.netType === 5 || this.parent.inRange);
    }
    this.name = name;
};

Player.prototype.getName = function () {
    return this.name;
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

    if (snap.m !== undefined) {
        this.movementSpeedBonus = parseInt(snap.m);
    }

    if (snap.v !== undefined && snap.v !== this.availablePoints) {
        this.availablePoints = parseInt(snap.v);
    }

    if (snap.o !== undefined && snap.o !== this.ownsCannon) {
        this.ownsCannon = parseBool(snap.o);
        if (ui !== undefined)
            ui.updateStore($(`.btn-shopping-modal.active`));
    }

    if (snap.r !== undefined && snap.r !== this.ownsFishingRod) {
        this.ownsFishingRod = parseBool(snap.r);
        if (ui !== undefined)
            ui.updateStore($(`.btn-shopping-modal.active`));
    }

    if (snap.c !== undefined && snap.c !== this.checkedItemsList) {
        this.checkedItemsList = parseBool(snap.c);
    }

    if (snap.d !== undefined && snap.d !== this.itemId) {
        this.itemId = parseInt(snap.d);
        if (ui !== undefined)
            ui.updateStore($(`.btn-shopping-modal.active`));
    }

    if (snap.w !== undefined && snap.w !== this.activeWeapon) {
        this.activeWeapon = parseInt(snap.w);
        this.changeWeapon();
    }
};

Player.prototype.onDestroy = function () {
    Entity.prototype.onDestroy.call(this);

    if (this === myPlayer) {
        myPlayer = undefined;
    }

    if (this.parent) {
        delete this.parent.children[this.id];
        if (this.parent.netType === 1) {
            this.parent.updateProps();
            if (Object.keys(this.parent.children).length === 0) {
                removeEntity(this.parent);
            }
        }
    }

    if (players[this.id]) {
        delete players[this.id];
    }
};

Player.prototype.setPlayerBody = function (idx) {
    idx = idx || 0;
    let bodyModel = playerModels[idx];
    this.playerBody = bodyModel.body.clone();
    this.playerBody.scale.set(bodyModel.scale.x, bodyModel.scale.y, bodyModel.scale.z);
    this.playerBody.position.set(bodyModel.offset.x, bodyModel.offset.y, bodyModel.offset.z);
    this.playerBody.rotation.set(bodyModel.rotation.x, bodyModel.rotation.y, bodyModel.rotation.z);
    this.geometry.add(this.playerBody);
    this.geometry.castShadow = true;
    this.geometry.receiveShadow = true;

    this.weapon = models.cannon.clone();
    this.weapon.scale.set(0.05, 0.05, 0.05);
    this.weapon.position.set(0, 0, -0.4);
    this.weapon.rotation.set(0, 0, 0);
    this.weapon.name = `body`;
    this.geometry.add(this.weapon);

    this.captainHat = models.hat_pirate.clone();
    this.captainHat.scale.set(0.4, 0.4, 0.4);
    this.captainHat.position.set(0, 25, 0);
    this.captainHat.name = `captainHat`;
};

Player.prototype.crossHair = function () {
    this.crosshair = new THREE.TextSprite({
        textSize: 0.0365,
        redrawInterval: 10,
        texture: {
            text: `+`,
            fontFamily: config.Labels.fontFamily
        },
        material: {
            color: 0x00ff00,
            fog: false
        }
    });
};

Player.prototype.changeWeapon = function () {
    if (this.weapon && this.activeWeapon === 0) {
        this.geometry.remove(this.weapon);
        this.weapon = models.cannon.clone();
        if (this.isPlayer)
            ui.playAudioFile(false, `switch-rod-cannon`);

        this.weapon.scale.set(0.05, 0.05, 0.05);
        this.weapon.position.set(0, 0.1, -0.4);
        this.weapon.rotation.set(0, 0, 0);
        this.weapon.name = `body`;
        this.geometry.add(this.weapon);
    } else if (this.weapon && this.activeWeapon === 1) {
        this.geometry.remove(this.weapon);
        let fishingModel = new THREE.Mesh(geometry.fishingrod, materials.fishingrod);
        fishingModel.castShadow = true;
        fishingModel.receiveShadow = true;
        if (this.isPlayer)
            ui.playAudioFile(false, `switch-rod-cannon`);
        this.weapon = fishingModel.clone();
        this.weapon.scale.set(0.03, 0.03, 0.03);
        this.weapon.position.set(0, 0.1, -0.2);
        this.weapon.rotation.set(0, Math.PI, 0);
        this.weapon.name = `body`;
        this.weapon.castShadow = true;
        this.weapon.receiveShadow = true;
        this.geometry.add(this.weapon);
    } else if (this.weapon && this.activeWeapon === 2) {
        this.geometry.remove(this.weapon);
        this.weapon = models.spyglass.clone();
        this.weapon.scale.set(0.7, 0.7, 0.7);
        this.weapon.position.set(0, 0.5, 0.3);
        this.weapon.rotation.set(0.5, Math.PI / 2 + 0.07, 0.5);
        this.weapon.name = `body`;
        this.geometry.add(this.weapon);
    }
};

var parseBool = (b) => b === true || b === `true`;
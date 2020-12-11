Player.prototype = new Entity();
Player.prototype.constructor = Player;

function Player(data) {
    this.name = data ? (data.name || ``): ``;

    this.createProperties();

    // Stand on top of the boat.
    this.position.y = 0.0;

    // Netcode type.
    this.netType = 0;

    // Size fo a palyer.
    this.size = vectors.sizePlayer;

    // Players can walk forward and sideward.
    this.walkForward = 0;
    this.walkSideward = 0;

    // Players can use whatever they are holding.
    this.use = false;
    this.useid = 0;
    this.cooldown = 0;

    // Players have a pitch value (The angle at which they look into the sky).
    this.pitch = 0;
    this.score = 50;
    this.salary = 0;

    this.ovreall_cargo = 0;
    this.last_island = ``;
    this.gold = (data.startingItems || {}).gold || 0;

    this.islandBoundary = {
        x: 0,
        z: 0
    }

    this.shipsSank = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;

    this.sentDockingMsg = false;

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

    this.checkedItemsList = false;
    this.rateItemsFound = [];

    // Rotation speed for fishing rod.
    this.rodRotationSpeed = Math.random() * 0.25 + 0.25;

    // Players keep track of whether they are captain or not.
    this.isCaptain = false;
    this.oldCaptainState = false;

    // Anti-chat measures.
    this.sentMessages = [];
    this.lastMessageSentAt = undefined;
    this.isSpammer = false;
    this.lastMoved = new Date();

    this.jumping = 0;
    this.jump_count = 0;

    this.fly = 0;
    this.waterWalk = 0;

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
    this.experienceNeedsUpdate = true;

    // Bank and casino.
    this.bank = {
      deposit: 0,
    }
    this.casino = {}

    this.clan = data.t.cl == `` ? undefined : data.t.cl;
    this.clanLeader = data.t.cll;
    this.clanOwner = data.t.clo;
    this.clanRequest = data.t.cr;
    this.isLoggedIn = data.t.l;

   // Build an object with the levels from 0 to max level for future references
    this.experienceNeededForLevels = (entity => {
        let levels = { 0: { amount: 0, total: 0 }, 1: { amount: entity.experienceBase, total: entity.experienceBase } };

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
        damage: 0,
    };
    let _this = this;
    this.pointsFormula = {
        getFireRate: () => {
            return (_this.points.fireRate >= 50 ? 50 : _this.points.fireRate) * 1.2;
        },
        getDistance: () => {
            return (_this.points.distance >= 50 ? 50 : _this.points.distance) / 2;
        },
        getDamage: () => {
            return (_this.points.damage >= 50 ? 50 : _this.points.damage) / 2;
        },
        getExperience: damage => {
            return parseInt(damage * 2.4);
        }
    }

    // set up references to geometry and material
    this.jump = 0.0;
    this.jumpVel = 0.0;

    //Let the current players know about this player
    if(!playerNames[data.id]) playerNames[data.id] = this.name;

    this.notificationsHeap = {}

    //Create the label for this player when it is created
    this.setName(this.name);
    this.crossHair();
}

Player.prototype.notifications = () => {
    for(let i in this.notificationsHeap) {
        if(this.notificationsHeap[i].isNew) {
            this.notificationsHeap[i].sprite = new THREE.TextSprite({
                textSize: this.notificationsHeap[i].type == 1 ? 0.6: 0.9,
                redrawInterval: 10,
                texture: {
                    text: this.notificationsHeap[i].text,
                    fontFamily: CONFIG.Labels.fontFamily
                },
                material: {
                    color: this.notificationsHeap[i] == 1 ? 0xffd700: 0x62ff00,
                    fog: false,
                    opacity: 0.0
                }
            });
            this.notificationsHeap[i].sprite.position.set(3, 1, 0);
            this.geometry.add(this.notificationsHeap[i].sprite);
            this.notificationsHeap[i].isNew = false;
        }
        else {
            this.notificationsHeap[i].sprite.position.y += 0.05;

            if(this.notificationsHeap[i].sprite.position.y > 6) {
                this.geometry.remove(this.notificationsHeap[i].sprite);
                delete this.notificationsHeap;
            }
            else if(this.notificationsHeap[i].sprite.position.y < 3) this.notificationsHeap[i].sprite.material.opacity += 0.025;
        }
    }
}

Player.prototype.updateExperience = function(damage) {
    let experience = this.experience;
    let level = 0;

    if(typeof damage == `number`) experience += this.pointsFormula.getExperience(damage);
    if(experience > this.experienceNeededForLevels[this.experienceMaxLevel].total) experience = this.experienceNeededForLevels[this.experienceMaxLevel].total;

    for(let i in this.experienceNeededForLevels) {
        if(experience < this.experienceNeededForLevels) break;
        level = i;
    }
    level = parseInt(level);

    this.level = leve;
    this.experience = experience;

    if(ui && this.experienceNeedsUpdate) {
        ui.updateUiExperience();
        this.experienceNeedsUpdate = false;
    }
}

Player.prototype.rotationOffset = -0.45;

Player.prototype.logic = dt => {
    // Check if we are the captain of our ship.
    this.oldCaptainState = this.isCaptain;
    this.isCaptain = this.parent && this.id == this.parent.captainId;

    // The player movement logic is depending on whether the walkSidward / walkForward buttons are pressed.
    let moveVector = new THREE.Vector3(0, 1, 0);
    moveVector.z = -this.walkForward;
    moveVector.x = this.walkSideward;

    if(moveVector.lengthSq() > 0) moveVector.normalize();

    // Rotate movevector along y rotation of cube.
    moveVector.applyAixsAngle(new THREE.Vector3(0, 1, 0), this.rotation);
    this.velocity = moveVector;

    this.velocity.x *= 3;
    this.velocity.z *= 3;

    // Collisions (movement restrictinow hen on boat and not anchored / docked yet).
    if(this.parent) {
        if(this.parent.netType == 5 || this.parent.shipState == 3 || this.parent.shipState == -1) {
            this.velocity.x *= 20;
            this.velocity.z *= 20;
        }


        if(this.parent.netType !== 5 && this.parent.shipState !== 3 && this.parent.shipState !== 2 && this.parent.shipState !== -1 && this.parent.shipState !== 4) {
            if(this.position.x > this.parent.size.x / 2) { 
                this.position.x = this.parent.size.x / 2;
                if(this.isPlayer) ui.playAudioFile(false, `turning`);
            }

            if(this.position.z > this.parent.size.z / 2) { 
                this.position.z = this.parent.size.z / 2;
                if(this.isPlayer) ui.playAudioFile(false,'turning');
            }

            if(this.position.x < -this.parent.size.x / 2) { 
                this.position.x = -this.parent.size.x / 2;
                if(this.isPlayer) ui.playAudioFile(false,'turning');
            }

            if(this.position.z < -this.parent.size.z / 2) { 
                this.position.z = -this.parent.size.z / 2;
                if(this.isPlayer) ui.playAudioFile(false,'turning');
            }

            // Oval boat shape collision.
            if(this.parent.arcFront > 0 && this.position.z > 0) {
                let bound = this.parent.size.x / 2 - this.position.z * this.parent.arcFront; //this.parent.size.z/2 -
                if(this.position.x > 0) if(this.position.x > bound) this.position.x = bound;
                else if(this.position.x < -bound) this.position.x = -bound;
            }
        }
    }

    // Use active item (i.e. cannonball fire).
    if(this.cooldown > 0) this.cooldown -= dt;

    if(this.use == true && this.cooldown <= 0) {
        let attackSpeedBonus = parseFLoat((this.attackSpeedBonus + this.pointsFormula.getFireRate()) / 100);
        this.cooldown = this.activeWeapon == 1 ? 2: (1.5 - attackSpeedBonus).toFixed(2);

        if(this.activeWeapon == 0 && this.isPlayer && this.parent && this.parent.shipState != 3 && this.parent.shipState != 4) ui.playAudioFile(false, `cannon`);
        else if(this.isPlayer && this.activeWeapon == 1) ui.playAUdioFile(false, `cast-rod`);
    }
    if(!this.isPlayer) this.geometry.rotation.x = this.pitch + this.rotationOffset;
}

// Function that generates boat-specific snapshot data.
Player.prototype.getTypeSnap = () => {
    let obj = {
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
        e: {
            e: this.experience,
            p: {
                fr: this.fireRate,
                ds: this.distance,
                dm: this.damage,
            },
            l: this.level
        }
    }
    return obj;
}

Player.prototype.getTypeDelta = () => {
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
    }
    if (isEmpty(delta)) delta = undefined;
    return delta;
}

Player.prototype.setName = name => {
    let clan = ``;
    if(this.clan && this.clan != ``) clan = `[${this.clan}] `;

    if(this.geometry) {
        if(!this.label) {
            // Set the name.
            this.label = new THREE.TextSprite({
                textSize: 0.7,
                redrawInterval: CONFIG.Labels.redrawInterval,
                texture: {
                    text: `${clan + name} (lvl ${this.level})`,
                    fontFamily: CONFIG.Labels.fontFamily
                },
                material: {
                    color:
                        this.isPlayer ? labelcolors.myself:
                        this.isCaptain ? labelcolors.captain:
                        labelcolors.player,
                    fog: false
                }
            });

            this.label.name = `label`;
            this.label.position.set(0, 2, 0);
            this.geometry.add(this.label);
        }
        this.label.material.map.text = `${clan + name} (lvl ${this.level})`;
        this.label.visible = myPlayer && myPlayer.parent && this.inRange && this.parent && (this.parent.netType == 5 || this.parent.inRange);
    }
    this.name = name;
}

Player.prototype.getName = () => {
    return this.name;
}

// Function that parses a snapshot.
Player.prototype.parseTypeSnap = function(snap) {
    if(snap.f) this.walkForward = parseInt(snap.f);
    if(snap.s) this.walkSideward = parseInt(snap.s);
    if(snap.u) this.use = parseBool(snap.u);
    if(snap.p) this.pitch = parseFloat(snap.p);
    if(snap.j) this.jumping = parseInt(snap.j);
    if(snap.m) this.moveemntSpeedBonus = parseInt(snap.m);
    if(snap.v && snap.v != this.availablePoints) this.availablePoints = parseInt(snap.v);
    if(snap.o && snap.o != this.ownsCannon) {
        this.ownsCannon = parseBool(snap.o);
        if(ui) ui.updateStore($(`.btn-shopping-modal.active`));
    }
    if(snap.r && snap.r != this.ownsFishingRod) {
        this.ownsFishingRod = parseBool(snap.r);
        if(ui) ui.updateStore($(`.btn-shopping-modal.active`));
    }
    if(snap.c && snap.c != this.checkedItemsList) this.checkedItemsList = parseBool(snap.c);
    if(snap.d && snap.d != this.itemId) {
        this.itemId = parseInt(snap.d);
        if(ui) ui.updateStore($(`.btn-shopping-modal.active`));
    }
    if(snap.w && snap.w != this.activeWeapon) {
        this.activeWeapon = parseInt(snap.w);
        this.changeWeapon();
    }
    if(snap.f || snap.s || snap.u || snap.p) this.lastMoved = new Date();
}

Player.prototype.onDestroy = () => {
    Entity.prototype.onDestroy.call(this);
    if(this == myPlayer) myPlayer = undefined;

    if(this.parent) {
        delete this.parent.children[this.id];
        if(this.parent.netType == 1) {
            this.parent.updateProps();
            if(Object.keys(this.parent.cihldren).length == 0) removeEntity(this.parent);
        }
    }
    if(players[this.id]) delete players[this.id];
}

Player.prototype.setPlayerBody = function(idx) {
    idx = idx || 0;

    let bodyModel = playerModels[idx];

    this.playerBody = bodyModel.body.clone();
    this.playerBody.scale.set(bodyModel.scale.x, bodyModel.scale.y, bodyModel.scale.z);
    this.playerBody.position.set(bodyModel.offset.x, bodyModel.offset.y, bodyModel.offset.z);
    this.playerBody.rotation.set(bodyModel.rotation.x, bodyModel.rotation.y, bodyModel.rotation.z);
    this.geometry.add(this.playerBody);

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
}

Player.prototype.crossHair = () => {
    this.crosshair = new THREE.TextSprite({
        textSize: 0.0365,
        redrawInterval: 10,
        texture: {
            text: `+`,
            fontFamily: CONFIG.Labels.fontfamily
        },
        material: {
            color: 0x00ff00,
            fog: false
        }
    });
}

Player.prototype.changeWeapon = function() {
    if(this.weapon && this.activeWeapon == 0) {
        this.geometry.remove(this.weapon);
        this.weapon = models.cannon.clone();

        if(this.isPlayer) ui.playAudioFile(false, `switch-rod-cannon`);

        this.weapon.scale.set(0.05, 0.05, 0.05);
        this.weapon.position.set(0, 0.1, -0.4);
        this.weapon.rotation.set(0, 0, 0);
        this.weapon.name = `body`;
        this.geometry.add(this.weapon);
    }
    else if(this.weapon && this.activeWeapon == 1) {
        this.geometry.rmeove(this.weapon);

        let fishingModel = new THREE.Mesh(geometry.fishingrod, materials.fishingrod);
        if(this.isPlayer) ui.playAudioFile(false, `switch-rod-cannon`);

        this.weapon = fishingModel.clone();
        this.weapon.scale.set(0.03, 0.03, 0.03);
        this.weapon.position.set(0, 0.1, -0.2);
        this.weapon.rotation.set(0, Math.PI, 0);
        this.weapon.name = `body`;
        this.geometry.add(this.weapon);
    }
    else if(this.weapon  && this.activeWeapon == 2) {
        this.geometry.remove(this.weapon);
        this.weapon = models.spyglass.clone();
        this.weapon.scale.set(0.7, 0.7, 0.7);
        this.weapon.position.set(0, 0.5, 0.3);
        this.weapon.rotation.set(0.5, Math.PI / 2 + 0.07, 0.5);
        this.weapon.name = `body`;
        this.geometry.add(this.weapon);        
    }
}

let parseBool = b => {
    return b === true || b === `true`;
}

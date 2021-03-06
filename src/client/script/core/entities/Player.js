/**
 * Player class
 *
 * @class
 * @extends Entity
 */
class Player extends Entity {
    /**
     * Player constructor
     *
     * @param {object} data Player data
     */
    constructor (data) {
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
        this.itemId = undefined;
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
        this.crosshair = new THREE.TextSprite({
            textSize: 0.0365,
            redrawInterval: 10,
            texture: {
                text: `+`,
                fontFamily: config.Labels.fontFamily
            },
            material: {
                color: labelcolors.crosshair,
                fog: false
            }
        });

        // Utilities for points
        this.pointsFormula = {
            getFireRate: () => (this.points.fireRate >= 50 ? 50 : this.points.fireRate) * 1.4,

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

    /**
     * Set a player's name
     *
     * @param {string} name New player name
     */
    setName (name) {
        if (this.geometry !== undefined) {
            // Get clan
            let clan = ``;
            if (this.clan !== undefined && this.clan !== ``) {
                clan = `[${this.clan}] `;
            }

            // Check if myPlayer has a boat
            let hasBoat = myPlayer.parent !== undefined && myPlayer.parent.netType === 1;

            // Check if player is staff
            let isAdmin = config.Admins.includes(this.name);
            let isMod = config.Mods.includes(this.name);
            let isHelper = config.Helpers.includes(this.name);
            let isDesigner = config.Designers.includes(this.name);

            // Get color
            let playerColor;
            if (isAdmin) playerColor = labelcolors.admin;
            else if (isMod) playerColor = labelcolors.mod;
            else if (isHelper) playerColor = labelcolors.helper;
            else if (isDesigner) playerColor = labelcolors.designer;
            else if (this.isPlayer) playerColor = labelcolors.myself;
            else if (myPlayer !== undefined && myPlayer.clan !== undefined && myPlayer.clan !== `` && myPlayer.clan === entities[this.id].clan) playerColor = labelcolors.clan;
            else if (myPlayer !== undefined && hasBoat && entities[this.id].parent !== undefined && myPlayer.parent.id === entities[this.id].parent.id && entities[myPlayer.parent.id] !== undefined && entities[myPlayer.parent.id].captainId === this.id) playerColor = labelcolors.captain;
            else if (myPlayer !== undefined && hasBoat && entities[this.id].parent !== undefined && myPlayer.parent.id === entities[this.id].parent.id) playerColor = labelcolors.krewmate;
            else playerColor = labelcolors.player;

            // Create label if geometry needed
            if (this.label === undefined) {
                this.label = new THREE.TextSprite({
                    textSize: 0.7,
                    redrawInterval: config.Labels.redrawInterval,
                    texture: {
                        text: `${clan + (isAdmin ? `[Admin] ` : isMod ? `[Mod] ` : isHelper ? `[Helper] ` : isDesigner ? `[Designer] ` : ``) + name} (lvl ${this.level})`,
                        fontFamily: config.Labels.fontFamily
                    },
                    material: {
                        color: playerColor,
                        fog: false
                    }
                });

                this.label.name = `label`;
                this.label.position.set(0, 2.2, 1.5);
                this.geometry.add(this.label);
            } else {
                // Set color and text if already defined
                this.label.material.color = playerColor;
                this.label.material.map.text = `${clan + (isAdmin ? `[Admin] ` : isMod ? `[Mod] ` : isHelper ? `[Helper] ` : isDesigner ? `[Designer] ` : ``) + name} (lvl ${this.level})`;
            }

            this.label.visible = myPlayer && myPlayer.parent && this.inRange && this.parent !== undefined && (this.parent.netType === 5 || this.parent.inRange);
        }

        this.name = name;
    }

    /**
     * Set the player body (model)
     *
     * @param {number} dog Index of dogModels array
     * @param {number} hat Index of the hatModels array
     */
    setPlayerBody (dog, hat) {
        dog = dog || 0;
        let bodyModel = dog < 0 ? staffDogModels[(-1 * dog) - 1] : dogModels[dog];
        this.playerBody = bodyModel.body.clone();
        this.playerBody.scale.set(bodyModel.scale.x, bodyModel.scale.y, bodyModel.scale.z);
        this.playerBody.position.set(bodyModel.offset.x, bodyModel.offset.y, bodyModel.offset.z);
        this.playerBody.rotation.set(bodyModel.rotation.x, bodyModel.rotation.y, bodyModel.rotation.z);
        this.geometry.add(this.playerBody);
        this.geometry.receiveShadow = true;

        this.weapon = models.cannon.clone();
        this.weapon.scale.set(0.05, 0.05, 0.05);
        this.weapon.position.set(0, 0, -0.4);
        this.weapon.rotation.set(0, 0, 0);
        this.weapon.name = `body`;
        this.geometry.add(this.weapon);

        hat = hat || 0;
        this.captainHat = hatModels[hat].clone();
        this.captainHat.scale.set(0.4, 0.4, 0.4);
        this.captainHat.position.set(0, hat === 1 ? 26.5 : 25, hat === 1 ? 4 : hat === 2 ? 1 : 0);
        this.captainHat.name = `captainHat`;
    }

    /**
     * Notifiscation Method
     */
    notifiscation () {
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
                        color: (this.notifiscationHeap[z].type) === 1 ? 0xffd700 : 0x62ff00,
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
    }

    /**
     * Update player experience
     *
     * @param {number} damage Amount of damage a player did
     */
    updateExperience (damage) {
        let experience = this.experience;
        let level = 0;
        let i;

        if (typeof damage === `number`) {
            experience += this.pointsFormula.getExperience(damage);
        }

        if (experience > this.experienceNeededForLevels[this.experienceMaxLevel].total) {
            experience = this.experienceNeededForLevels[this.experienceMaxLevel].total;
        }

        for (let i in this.experienceNeededForLevels) {
            if (experience < this.experienceNeededForLevels[i].total) {
                break;
            }

            level = i;
        }

        level = parseInt(level);

        this.level = level;
        this.experience = experience;

        if (ui !== undefined && this.experienceNeedsUpdate) {
            experienceBarUpdate();
            this.experienceNeedsUpdate = false;
        }
    }

    /**
     * Change a player's weapon (tool)
     */
    changeWeapon () {
        if (this.weapon && this.activeWeapon === 0) {
            this.geometry.remove(this.weapon);
            this.weapon = models.cannon.clone();
            if (this.isPlayer)
                audio.playAudioFile(false, true, 1, `switch-rod-cannon`);

            this.weapon.scale.set(0.05, 0.05, 0.05);
            this.weapon.position.set(0, 0.1, -0.4);
            this.weapon.rotation.set(0, 0, 0);
            this.weapon.name = `body`;
            this.geometry.add(this.weapon);
        } else if (this.weapon && this.activeWeapon === 1) {
            this.geometry.remove(this.weapon);
            let fishingModel = new THREE.Mesh(geometry.fishingrod, materials.fishingrod);
            fishingModel.receiveShadow = true;
            if (this.isPlayer)
                audio.playAudioFile(false, true, 1, `switch-rod-cannon`);
            this.weapon = fishingModel.clone();
            this.weapon.scale.set(0.03, 0.03, 0.03);
            this.weapon.position.set(0, 0.1, -0.2);
            this.weapon.rotation.set(0, Math.PI, 0);
            this.weapon.name = `body`;
            this.geometry.add(this.weapon);
        } else if (this.weapon && this.activeWeapon === 2) {
            this.geometry.remove(this.weapon);
            if (this.isPlayer)
                audio.playAudioFile(false, true, 1, `switch-rod-cannon`);
            this.weapon = models.spyglass.clone();
            this.weapon.scale.set(0.7, 0.7, 0.7);
            this.weapon.position.set(0, 0.5, 0.3);
            this.weapon.rotation.set(0.5, Math.PI / 2 + 0.07, 0.5);
            this.weapon.name = `body`;
            this.geometry.add(this.weapon);
        }
    }

    /**
     * Make a player jump
     */
    tryJump () {
        if (this.jumpVel > 0.0 || this.jump > 0) return;
        this.jumpVel = 16;
    }

    /**
     * Get a player's delta type
     */
    getTypeDelta () {
        return PlayerDelta.getTypeDelta(this);
    }

    /**
     * Player logic method
     *
     * @param {number} dt DT
     */
    logic (dt) {
        PlayerLogic.logic(dt, this);
    }

    /**
     * Player client logic method
     *
     * @param {number} dt DT
     */
    clientlogic (dt) {
        PlayerLogic.clientlogic(dt, this);
    }

    /**
     * Player names logic method
     */
    namesLogic () {
        PlayerLogic.namesLogic(this);
    }

    /**
     * Player docked logic
     */
    dockedLogic () {
        PlayerLogic.dockedLogic(this);
    }

    /**
     * Method to parse a player type snap
     *
     * @param {object} snap Snap to be parsed
     */
    parseTypeSnap (snap) {
        PlayerSnap.parseTypeSnap(snap, this);
    }

    /**
     * Destroy a player
     */
    onDestroy () {
        Entity.prototype.onDestroy.call(this);

        if (this === myPlayer) {
            myPlayer = undefined;
        }

        if (this.parent) {
            delete this.parent.children[this.id];
            if (this.parent.netType === 1) {
                this.parent.updateProps();
                if (Object.keys(this.parent.children).length === 0) {
                    EntityModels.removeEntity(this.parent);
                }
            }
        }

        if (players[this.id]) {
            delete players[this.id];
        }
    }
}

Player.prototype.rotationOffset = -0.45;
Player.prototype.timeCounters = {};

/* Boat class */

class Boat extends Entity {
    /* Constructor */
    constructor(captainId, krewName) {
        // Get parent class (Entity) methods and create properties
        super();

        // Set netType
        this.netType = 1;

        // Mute variables to not be sent via delta
        this.muted = [`x`, `z`, `y`];

        // Get krew name and spawn island
        let spawnIslandId;
        let captainsName = ``;
        if (entities[captainId] !== undefined) {
            captainsName = entities[captainId].name;
            if (entities[captainId].parent !== undefined) {
                spawnIslandId = entities[captainId].parent.netType === 5 ?
                    entities[captainId].parent.id :
                    entities[captainId].parent.anchorIslandId;
            }
        }
        captainsName = typeof captainsName === `string` ? captainsName : ``;

        // Set krew name and spawn island
        this.crewName = typeof krewName === `string` ? krewName : `${captainsName}'${captainsName.charAt(captainsName.length - 1) === `s` ? `` : `s`} krew`;
        this.anchorIslandId = spawnIslandId;

        // Set captain ID and clan
        if (captainId && entities[captainId]) {
            this.captainId = captainId;
            this.clan = entities[captainId].clan;
        } else {
            this.captainId = ``;
            this.clan = ``;
        }

        // Set ship to a raft 1
        this.setShipClass(1);

        // Set arc front and arc back
        this.arcFront = 0;
        this.arcBack = 0;

        // Create krew members object
        this.krewMembers = {};

        // Create krew members count (Used in krew info modal)
        this.krewCount = 0;

        // Set variables for allowing others to join a krew
        this.recruiting = false;
        this.isLocked = false;

        // Set default departure time
        this.departureTime = 5;

        // Set steering (0 represents no motion)
        this.steering = 0;

        // Set Ship State to starting
        this.shipState = -1;

        // Set number of ships the whole crew has sunk
        this.overall_kills = 0;

        // Set amount of cargo (worth gold) that has been traded by the whole crew
        this.overall_cargo = 0;

        // Timer that counts down once your hp is below zero
        this.sinktimer = 0;

        // Set up geometry for client
        this.rottimer = Math.random() * 5;

        // Value that makes the ship lean towards one side
        this.leanvalue = 0;

        // Set boat name
        this.setName(this.crewName);
    }

    /* Function for updating boat children */
    updateProps() {
        let krewCount = 0;
        for (let id in this.children) {
            if (
                entities[id] === undefined ||
                entities[id].parent === undefined ||
                entities[id].parent.id !== this.id
            ) {
                delete this.children[id];
                continue;
            }

            let child = this.children[id];
            if (child && child.netType === 0) {
                krewCount += 1;
            }
        }

        this.krewCount = krewCount;
        if (this.krewCount === 0) removeEntity(this);
    }

    /* Set krew name */
    setName(crewName) {
        let clan = ``;
        if (this.clan !== undefined && this.clan !== ``) {
            clan = `[${this.clan}] `;
        }
        if (this.geometry !== undefined) {
            if (this.label === undefined) {
                // Set the crews name
                this.label = new THREE.TextSprite({
                    textSize: 4,
                    redrawInterval: config.Labels.redrawInterval,
                    texture: {
                        text: clan + crewName,
                        fontFamily: config.Labels.fontFamily
                    },
                    material: {
                        color: 0xc5a37c,
                        fog: false
                    }
                });
                this.label.name = `label`;
                this.label.position.set(0, boatTypes[this.shipclassId].labelHeight, 0);

                for (let l = this.geometry.children.length; l--;) {
                    if (
                        this.geometry.children[l].isTextSprite &&
                        this.geometry.children[l].name === `label`
                    ) {
                        this.geometry.remove(this.geometry.children[l]);
                    }
                }
                this.geometry.add(this.label);
            }
            this.label.material.map.text = clan + crewName;
            this.label.visible = myPlayer &&
                myPlayer.parent &&
                this.id !== myPlayer.parent.id &&
                this[config.Labels.boats.useMethod];
        }
        this.crewName = crewName;
    }

    /* Run boat logic */
    logic(dt) {
        BoatLogic.logic(dt, this);
    }

    /* Run client boat logic */
    clientlogic() {
        BoatLogic.clientLogic(this);
    }

    /* Set boat class based on boat type */
    setShipClass(classId) {
        this.shipclassId = classId;

        let currentShipClass = boatTypes[classId];

        this.maxHp = currentShipClass.hp;
        this.hp = this.maxHp;
        this.turnspeed = currentShipClass.turnspeed;
        this.maxKrewCapacity = currentShipClass.maxKrewCapacity;
        this.size.set(currentShipClass.width, currentShipClass.height, currentShipClass.depth);
        this.arcFront = currentShipClass.arcFront;
        this.arcBack = currentShipClass.arcBack;
        this.inertia = currentShipClass.inertia;
        this.collisionRadius = currentShipClass.radius;
        this.speed = currentShipClass.speed;
        this.shipState = 2;

        // console.log("changing boat model");
        this.changeBoatModel(this.shipclassId);
        if (myPlayer !== undefined) {
            if (this === myPlayer.parent) {
                ui.showCenterMessage(`Ship upgraded to ${boatTypes[this.shipclassId].name}`, 3);
                ui.updateStore($(`.btn-shopping-modal.active`));
            }
        }
    }

    /* Teleport krew members to a boat (Used when undocking) */
    getKrewOnBoard() {
        for (let i in this.children) {
            if (this.children[i].parent && this.children[i].parent.id === this.id) {
                this.geometry.add(this.children[i].geometry);
                this.children[i].position.x = 0;
                this.children[i].position.y = 0;
                this.children[i].position.z = 0;
            }

            if (this.children[i].parent === undefined || this.children[i].parent.id !== this.id) {
                delete this.children[i];
            }
        }
    }

    /* Parse type snap */
    parseTypeSnap(snap) {
        BoatSnap.parseTypeSnap(snap, this);
    }

    /* Get type snap */
    getTypeSnap() {
        BoatSnap.getTypeSnap(this);
    }

    /* Get delta type */
    getTypeDelta() {
        let delta = {
            h: this.deltaTypeCompare(`h`, this.hp),
            s: this.deltaTypeCompare(`s`, this.steering.toFixed(4)),
            c: this.deltaTypeCompare(`c`, this.shipclassId),
            b: this.deltaTypeCompare(`b`, this.captainId),
            t: this.deltaTypeCompare(`t`, this.shipState),
            a: this.deltaTypeCompare(`a`, this.anchorIslandId),
            k: this.deltaTypeCompare(`k`, this.krewCount),
            e: this.deltaTypeCompare(`e`, this.speed),
            r: this.deltaTypeCompare(`r`, this.recruiting),
            l: this.deltaTypeCompare(`l`, this.isLocked),
            d: this.deltaTypeCompare(`d`, this.departureTime)
        };

        if (isEmpty(delta)) {
            delta = undefined;
        }

        return delta;
    }

    /* Destroy the entity */
    onDestroy() {
        this.children = {};

        // makre sure to also call the entity ondestroy
        Entity.prototype.onDestroy.call(this);

        if (boats[this.id]) {
            delete boats[this.id];
        }
    }

    /* Get boat height based on baseheight and boat health */
    getHeightAboveWater() {
        return boatTypes[this.shipclassId].baseheight * (0.2 + 0.8 * (this.hp / this.maxHp)) - this.sinktimer;
    }

    /* Set ship state when a boat docks */
    enterIsland(islandId) {
        if (this.shipState === 0) {
            this.shipState = 1;
        }

        this.anchorIslandId = islandId;
    }

    /* When the boat undocks */
    exitIsland() {
        this.shipState = 0;
        this.recruiting = false;
        this.departureTime = 5;

        if (this.anchorIslandId) {
            // set rotation away from island
            this.rotation = rotationToObject(this, entities[this.anchorIslandId]);

            // make a tiny jump so we dont instantly anchor again
            let outward = angleToVector(this.rotation);
            this.position.x = entities[this.anchorIslandId].position.x - outward.x * (entities[this.anchorIslandId].dockRadius + 5);
            this.position.z = entities[this.anchorIslandId].position.z - outward.y * (entities[this.anchorIslandId].dockRadius + 5); // <- careful. y value!
        }

        this.anchorIslandId = undefined;
    }

    /* When a player abandons ship */
    exitMotherShip() {
        // set rotation away from mothership
        this.rotation = rotationToObject(this, mothership);

        // make a tiny jump away from mothership
        let outward = angleToVector(this.rotation);
        this.position.x = mothership.position.x - outward.x * (mothership.collisionRadius + 5);
        this.position.z = mothership.position.z - outward.y * (mothership.collisionRadius + 5); // <- careful. y value!
    }
};
// PLayers are entities, check core_entity.js for the base class
Pickup.prototype = new Entity();
Pickup.prototype.constructor = Pickup;

function Pickup (size, x, z, type, specialBonus) {
    this.createProperties();

    // netcode type
    this.netType = 4;
    this.bonusValues = [50, 75, 100, 10000, specialBonus]; // "specialBonus" for special bonus lul

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
    let scale = 1;
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
    this.pickerId = ``;
    this.type = type;
    this.picking = type === 1;
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

Pickup.prototype.randomTime = (min, max) => (Math.floor(Math.random() * (max - min)) + min) * 1000;

Pickup.prototype.randomMovementLogic = function () {
    this.randomMovementLogicTime = this.randomMovementLogicTime || Date.now();
    this.randomMovementTime = this.randomMovementTime || this.randomTime(5, 10);
    if (Date.now() - this.randomMovementLogicTime > this.randomMovementTime) {
        let move = Math.round(Math.random());
        if (move) {
            let landmark = false;
            for (let landmarkId in core.Landmarks) {
                if (
                    core.Landmarks[landmarkId].pickups !== undefined &&
                    core.Landmarks[landmarkId].pickups[this.id] !== undefined
                ) {
                    landmark = core.Landmarks[landmarkId];
                    break;
                }
            }

            if (landmark !== false) {
                let pickupPosition = {
                    x: 0,
                    z: 0
                };

                let distanceFromCenter = 0;
                let distanceFromPickup = 0;
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
    if (this.picking) {
        this.timeout -= dt * 0.5;
        if (this.timeout <= 0 || this.timeout === 1)
            removeEntity(this);
    }

    // if pickup should be picked but the picker player is undefined, delete it
    if (this.picking === true && this.pickerId !== `` && entities[this.pickerId] === undefined) {
        removeEntity(this);
    }

    /* if (this.picking === true && (this.type === 2 || this.type === 3))
    {
        removeEntity(this);
    } */

    if (this.type === 0 || this.type === 4 && (this.picking !== true)) {
        // check for all boats that's within pickup distance of pickups
        for (b in boats) {
            let boat = boats[b];

            if (boat == undefined) continue;

            // dont check against boats that have died
            if (boat.hp < 1) {
                continue;
            }

            let loc = boat.toLocal(this.position);

            // then do a AABB && only take damage if the person who shot this projectile is from another boat (cant shoot our own boat)
            if (!isNaN(loc.x) && !(Math.abs(loc.x) > Math.abs(boat.size.x * 0.6 + 3) ||
                    Math.abs(loc.z) > Math.abs(boat.size.z * 0.6 + 3))) {
                // if (
                //     boat.supply < boatTypes[boat.shipclassId].cargoSize ||
                //     boat.hp < boatTypes[boat.shipclassId].hp
                // ) {
                let bonus = this.bonusValues[this.pickupSize];

                // boat.supply = Math.min(boatTypes[boat.shipclassId].cargoSize, boat.supply + bonus);
                let totalScore = 0;
                for (id in boat.children) {
                    let player = boat.children[id];
                    totalScore += player.score;
                }

                // console.log("totalscore", totalScore)
                // distribute gold accordingly to each players' score
                let captainsCut = bonus;
                for (id in boat.children) {
                    let player = boat.children[id];
                    if (player !== boat.captain) {
                        let playersCut = (player.score / totalScore) * (1 - this.captainsCutRatio) * bonus;
                        player.gold += playersCut;
                        captainsCut -= playersCut;
                    }
                }

                let captain = boat.children[boat.captainId];

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
        for (let playerId in entities) {
            if (entities[playerId].netType === 0) {
                let player = entities[playerId];
                let playerPosition = player.worldPos();
                let distanceFromPlayer = Math.sqrt(
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

    // if (this.type === 3) {
    //    this.randomMovementLogic();
    // }
};

Pickup.prototype.getTypeSnap = function () {
    let snap = {
        s: this.pickupSize,
        p: this.picking,
        i: this.pickerId,
        t: this.type

    };
    return snap;
};

Pickup.prototype.getTypeDelta = function () {
    if (this.type === 1) {
        if (!this.spawnPacket) {
            this.spawnPacket = true;
            return this.getTypeSnap();
        }

        return undefined;
    } else {
        let delta = {
            s: this.deltaTypeCompare(`s`, this.pickupSize),
            p: this.deltaTypeCompare(`p`, this.picking),
            i: this.deltaTypeCompare(`i`, this.pickerId),
            t: this.deltaTypeCompare(`t`, this.type)
        };
        if (isEmpty(delta)) {
            delta = undefined;
        }

        return delta;
    }
};

// function that parses a snapshot
Pickup.prototype.parseTypeSnap = function (snap) {
    if (snap.s !== undefined && snap.s !== this.pickupSize) {
        this.pickupSize = parseInt(snap.s);
    }

    if (snap.p !== undefined && snap.p !== this.picking) {
        this.picking = parseBool(snap.p);
    }

    if (snap.i !== undefined && snap.i !== this.pickerId) {
        this.pickerId = snap.i;
    }

    if (snap.t !== undefined && snap.t !== this.type) {
        this.type = parseInt(snap.t);
    }
};

// function that parses a snapshot
Pickup.prototype.onDestroy = function () {
    // makre sure to also call the entity ondestroy
    Entity.prototype.onDestroy.call(this);

    if (pickups[this.id]) {
        delete pickups[this.id];
    }
};

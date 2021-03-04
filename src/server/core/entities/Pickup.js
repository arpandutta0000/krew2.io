const THREE = require(`../../../client/libs/js/three.min.js`);

const Entity = require(`./Entity.js`);
const utils = require(`../utils.js`);

class Pickup extends Entity {
    constructor (type, x, z, size) {
        super(x, 0, z);

        // Network type.
        this.netType = 4;

        // Pickup size and type.
        this.pickupType = type;
        this.pickupSize = size;

        // Bonus values.
        this.bonusValues = [50, 75, 100, 1e5];
        this.bonus = this.bonusValues[size] || 25;

        // Pickup scaling.
        let scale = 1;
        if (type === 0) scale = parseInt(size) + 1;
        else if (type === 1) scale = size * 0.05;
        else if (type === 2 || type === 3) scale = 0.02;
        else if (type === 4) scale = 2;

        // Scaled pickup size.
        this.size = new THREE.Vector3(scale, scale, scale);

        this.timeout = 1;
        this.catchingFish = false;

        this.picking = type === 1;
    }

    randomMovementLogic = () => {
        this.randomMovementLogicTime = this.randomMovementLogicTime || new Date();
        this.randomMovementTime = this.randomMovementTime || utils.randomInt(5, 10);

        if (new Date() - this.randomMovementLogicTime > this.randomMovementTime) {
            const move = Math.round(Math.random());

            if (move === 0) {
                const landmark = core.entities.find(entity => entity.netType === 5 && entity.pickups && entity.pickups.includes(this.id));
                if (landmark) {
                    let pickupPos = {
                        x: 0,
                        y: 0
                    };

                    let distanceFromCenter = 0;
                    while (distanceFromCenter > landmark.dockRadius - 30 || distanceFromCenter < landmark.dockRadius - 40) {
                        pickupPos.x = utils.randomInt(-6, 6) + this.position.x;
                        pickupPos.z = utils.randomInt(-6, 6) + this.position.z;

                        distanceFromCenter = utils.distance(pickupPos.x, this.position.x, pickupPos.z, this.position.z);
                    }
                    this.position.x = pickupPos.x;
                    this.position.z = pickupPos.z;
                }
            }

            this.randomMovementLogicTime = new Date();
            this.randomMovementTime = utils.randomInt(5, 10);
        }
    }
}

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

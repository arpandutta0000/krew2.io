const THREE = require(`../../../client/libs/js/three.min.js`);
const Entity = require(`./Entity.js`);

const { entities } = require(`../core.js`);
const utils = require(`../utils.js`);

class Boat extends Entity {
    constructor (captainId, name, spawnOnSea) {
        const captain = entities.find(entity => entity.id === captainId);
        const captainParent = entities.find(entity => entity.id === captain.parent);

        let spawnIslandId = captainParent.netType === 5 ? captainParent.id : captainParent.anchorIslandId;

        let boatPos = {
            x: 0,
            z: 0
        };

        if (spawnOnSea) {
            const roll = utils.randomInt(0, 4);

            switch (roll) {
                case 0:
                    boatPos.x = utils.randomInt(0, 150);
                    boatPos.z = utils.randomInt(0, config.worldsize);
                    break;
                case 1:
                    boatPos.x = utils.randomInt(0, config.worldsize);
                    boatPos.z = utils.randomInt(0, config.worldsize - 300);
                    break;
                case 2:
                    boatPos.x = utils.randomInt(0, config.worldsize - 300);
                    boatPos.z = utils.randomInt(0, config.worldsize);
                    break;
                default:
                    boatPos.x = utils.randomInt(0, config.worldsize);
                    boatPos.z = utils.randomInt(0, 150);
                    break;
            }
        }
        else {
            const landmark = entities.find(entity => entity.id === this.anchorIslandId);
            let spawnIsland = landmark || entities.find(entity => entity.netType === 5);

            boatPos.x = spawnIsland.position.x + utils.randomInt(-60, 60);
            boatPos.z = spawnIsland.position.z + utils.randomInt(-60, 60);
        }

        // Call the parent constructor and set the network type.
        super(boatPos.x, 0, boatPos.z);
        this.netType = 1;

        // Health regeneration intervals.
        this.hpRegTimer = 0;
        this.hpRegInterval = 1;

        // If krew is locked (cannot recruit).
        this.isLocked = false;

        // Departure and last time of boat movement.
        this.departureTime = 5;
        this.lastMoved = new Date();

        // Steering and ship state.
        this.steering = 0;
        this.shipState = -1;

        // Security values.
        this.sentDockingMsg = false;
        this.hasDoneDeathDrops = false;

        this.anchorIslandId = spawnIslandId;

        // A timer that counts down once hp is below 0.
        this.sinkTimer = 0;

        this.captain = captainId;

        // Set krew name.
        this.name = name || `${captain.name}'${captain.name.charAt(captain.name.length - 1) === `s` ? `` : `s`} krew`;

        // Start with a raft 1.
        this.setShipClass(1);
    }

    updateProps = () => {
        // Remove any children that are no longer on the boat.
        for (const childID of this.children) {
            const child = entities.find(entity => entity.id === childID);
            if (!child || child.parent !== this.id) this.removeChild(childID);
        }

        // Set the first krew member as captain if the old captain is no longer on the boat.
        const captain = entities.find(entity => entity.id === captainId);
        if (!captain) this.captain = this.children[0];

        // Remove the boat if there are no people on it.
        if (this.children.length === 0) this.destroy();
    }

    logic = dt => {
        let boundaryCollision = true;

        if (this.position.x > config.worldsize) this.position.x = worldsize;
        else if (this.position.z > config.worldsize) this.position.z = worldsize;
        else if (this.position.x < 0) this.position.x = 0;
        else if (this.position.z < 0) this.position.z = 0;
        else boundaryCollision = false;

        const captain = entities.find(entity => entity.id === captainId);

        if (!captain) boat.updateProps();
        else this.speed = boatTypes[this.shipClass].speed + captain.bonus.movement;
    }
}

Boat.prototype.logic = function (dt) {
    let kaptain = entities[this.captainId];

    // the boat movement is simple. it always moves forward, and rotates if the captain is steering
    if (kaptain !== undefined && this.crewName !== undefined) {
        this.speed = boatTypes[this.shipclassId].speed + parseFloat(kaptain.movementSpeedBonus / 100);
    }

    let moveVector = new THREE.Vector3(0, 0, (this.speed));

    // if boat is not anchored or not in docking state, we will move
    if (this.shipState === 0) {
        // if the steering button is pressed, the rotation changes slowly
        (kaptain !== undefined)
            ? this.rotation += this.steering * dt * 0.4 * (this.turnspeed + parseFloat(0.05 * kaptain.movementSpeedBonus / 100))
            : this.rotation += this.steering * dt * 0.4 * this.turnspeed;

        // we rotate the movement vector depending on the current rotation
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
    } else {
        moveVector.set(0, 0, 0);
    }

    // set the velocity to be the move vector
    this.velocity = moveVector;

    // find out who the captain is
    // if captain is not defined, assign the first crew member as a captain
    if (this.children[this.captainId] === undefined) {
        for (let playerId in this.children) {
            this.captainId = playerId;
            break;
        }
    }

    this.captain = this.children[this.captainId];

    // reset steering. important, dont remove please
    this.steering = 0;

    // do the steering, captain position is what determines it. only steer when anchored
    if (this.captain && (this.shipState !== 3 || this.shipState !== -1 || this.shipState !== 4)) {
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

    // push away from islands
    /*
    for (e in entities)
    {
        if(entities[e] !== this && entities[e].netType === 5)
        {
            let dist = entityDistance(this, entities[e]) - (entities[e].collisionRadius + this.collisionRadius );

            if(dist < 10)
            {
                let local = this.toLocal(entities[e].position);
                //let power = entities[e].inertia/this.inertia;
                   // either add it to rotation, or to the steering
                this.rotation += -((local.x > 0 ? (10-local.x) : (10+local.x) )*(10-dist)*(local.z+10))*dt*0.0005;
            }
        }
    } */

    // if our hp is low (we died)
    if (this.hp < 1) {
        if (!this.hasDoneDeathDrops) {
            // create debris based on score of the captain and ship
            let value = 300;
            if (boatTypes[this.shipclassId] && this.captain) {
                let baseValue = boatTypes[this.shipclassId].price + this.captain.gold;
                value = Math.round(baseValue * (1 / 2));
            }

            this.hasDoneDeathDrops = true;

            if (value > 5000) {
                let specialBonus = value / 50;
                for (i = 0; i < 50; i++) {
                    let x = this.position.x - this.size.x * 1;
                    let z = this.position.z - this.size.z * 1;
                    let pickup = createPickup(4, x + Math.random() * this.size.x, z + Math.random() * this.size.z, 0, true, specialBonus);
                }
            } else {
                for (let i = 0; i < value;) {
                    x = this.position.x - this.size.x * 1;
                    z = this.position.z - this.size.z * 1;
                    pickup = createPickup(2, x + Math.random() * this.size.x, z + Math.random() * this.size.z, 0, true);
                    if (pickup) {
                        let bonus = pickup.bonus;
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

        // console.log(this.hpRegTimer + " " + this.hpRegInterval + " " + this.hp)
        if (this.hpRegTimer > this.hpRegInterval) {
            this.hpRegTimer = 0;
            this.hp += boatTypes[this.shipclassId].regeneration;
            if (entities[this.captainId] && entities[this.captainId].regenBonus) this.hp += entities[this.captainId].regenBonus;
            this.hp = Math.min(this.hp, this.maxHp);
        }
    }
};

Boat.prototype.setShipClass = function (classId) {
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
        cl: this.clan
    };
};

// function that generates boat specific delta data
Boat.prototype.getTypeDelta = function () {
    let delta = {
        h: this.deltaTypeCompare(`h`, this.hp),
        s: this.deltaTypeCompare(`s`, this.steering.toFixed(4)),
        c: this.deltaTypeCompare(`c`, this.shipclassId),
        u: this.deltaTypeCompare(`u`, this.supply),
        b: this.deltaTypeCompare(`b`, this.captainId),
        t: this.deltaTypeCompare(`t`, this.shipState),
        a: this.deltaTypeCompare(`a`, this.anchorIslandId),
        k: this.deltaTypeCompare(`k`, this.krewCount),
        e: this.deltaTypeCompare(`e`, this.speed),
        r: this.deltaTypeCompare(`r`, this.recruiting),
        l: this.deltaTypeCompare(`r`, this.isLocked),
        d: this.deltaTypeCompare(`d`, this.departureTime)
    };

    if (isEmpty(delta)) {
        delta = undefined;
    }

    return delta;
};

// function that parses a snapshot
Boat.prototype.onDestroy = function () {
    // all the children - destroy them too
    for (let a in this.children) {
        // on the server, tell all the players on the boat that the show is over
        if (this.children[a].netType === 0) {
            if (this.children[a].socket !== undefined) {
                this.children[a].socket.emit(`end`, this.children[a].gold);
                // this.children[a].socket.disconnect();
            }
        }

        // removeEntity(this.children[a]);
        // this.children[a].socket.disconnect();
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
    if (this.shipState === 0) {
        this.shipState = 1;
    }

    this.anchorIslandId = islandId;
};

Boat.prototype.exitIsland = function () {
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
};

// when ship is abandoning its mothership!
Boat.prototype.exitMotherShip = function (mothership) {
    // set rotation away from mothership
    this.rotation = rotationToObject(this, mothership);

    // make a tiny jump away from mothership
    let outward = angleToVector(this.rotation);
    this.position.x = mothership.position.x - outward.x * (mothership.collisionRadius + 5);
    this.position.z = mothership.position.z - outward.y * (mothership.collisionRadius + 5); // <- careful. y value!
};

module.exports = Boat;

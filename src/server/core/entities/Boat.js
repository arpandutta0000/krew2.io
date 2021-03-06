const THREE = require(`../../../client/libs/js/three.min.js`);
const { entities } = require(`../core.js`);

const Entity = require(`./Entity.js`);
const Pickup = require(`./Pickup.js`);

const boatTypes = require(`../config/boats.js`);
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
        } else {
            const landmark = entities.find(entity => entity.id === this.anchorIsland);
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

        this.anchorIsland = spawnIslandId;

        // A timer that counts down once hp is below 0.
        this.sinkTimer = 0;

        this.captain = captainId;

        // Set krew name.
        this.name = name || `${captain.name}'${captain.name.charAt(captain.name.length - 1) === `s` ? `` : `s`} krew`;

        // Start with a raft 1.
        this.setShipClass(1);
    }

    getTypeSnap = () => ({
        h: this.hp,
        s: this.steering,
        c: this.shipClass,
        b: this.captain,
        t: this.shipState,
        a: this.anchorIsland,
        e: this.speed,
        l: this.isLocked,
        d: this.departureTime,
        cl: this.clan
    })

    logic = dt => {
        let boundaryCollision = true;

        if (this.position.x > config.worldsize) this.position.x = worldsize;
        else if (this.position.z > config.worldsize) this.position.z = worldsize;
        else if (this.position.x < 0) this.position.x = 0;
        else if (this.position.z < 0) this.position.z = 0;
        else boundaryCollision = false;

        const captain = entities.find(entity => entity.id === captainId);
        if (!captain) return boat.updateProps();

        this.speed = boatTypes[this.shipClass].speed + captain.bonus.movement;

        const moveVector = new THREE.Vector3(0, 0, this.speed);

        if (this.shipState === 0) {
            this.rotation += this.steering * dt * 0.4 * (this.turnspeed + (captain.movementSpeedBonus / 100));
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        } else moveVector.set(0, 0, 0);

        // Set the velocity as the move vector.
        this.velocity = moveVector;

        // Do steering.
        if (this.captain && (this.shipState === 0 || this.shipState === 1 || this.shipState === 2)) {
            if (this.captain.toLocal(this.position.x) > this.size.x * 0.25) this.steering = 1;
            else if (this.captain.toLocal(this.position.x) < this.size.x * -0.25) this.steering = -1;
            else this.steering = 0;
        } else this.steering = 0;

        // If in a boundary, turn faster.
        if (boundaryCollision) this.steering *= 5;

        if (this.hp < 1) {
            if (!this.hasDoneDeathDrops) {
                let value = 300;
                if (boatTypes[this.shipClass]) {
                    let baseValue = boatTypes[this.shipClass].price + this.captain.gold;
                    value = Math.round(baseValue * 0.5);
                }
                this.hasDoneDeathDrops = true;

                const pickupPos = {
                    x: this.position.x - this.size.x,
                    y: this.position.z - this.size.z
                };

                const specialBonus = value / 50;
                for (let i = 0; i < ((value > 5e3) ? 50 : value); i++) {
                    const pickup = new Pickup((value > 5e3) ? 4 : 2, pickupPos.x + (utils.randomInt(0, this.size.x), pickupPos.z + utils.randomInt(0, this.size.z)), (value > 5e3) ? specialBonus : 0);
                }
            }

            // Increase the sink timer and make the ship sink.
            this.sinkTimer += dt;

            // If the boat has sunk completely, remove it from the game.
            if (this.sinkTimer > 4) this.destroySelf();
        } else {
            this.hpRegTimer += dt;

            if (this.hpRegTimer > this.hpRegInterval && this.hp < this.maxHP) {
                this.hpRegTimer = 0;
                this.hp += boatTypes[this.shipClass].regeneration;

                if (captain.regenBonus) this.hp += captain.regenBonus;
            }
        }
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
        if (this.children.length === 0) this.destroySelf();
    }

    setShipClass = id => {
        this.shipClass = id;

        const ship = boatTypes[id];

        this.hp = this.maxHP;
        this.maxHP = ship.hp;

        this.turnSpeed = ship.turnspeed;

        this.maxKrewCapacity = ship.maxKrewCapacity;

        this.size.set(ship.width, ship.height, ship.depth);

        this.arcFront = ship.arcFront;
        this.arcBack = ship.arcBack;

        this.inertia = ship.inertia;
        this.collisionRadius = ship.radius;

        this.speed = ship.speed;

        this.shipState = 2;
    }

    getHeight = () => boatTypes[this.shipClass].baseheight * (0.2 + (0.8 * (this.hp / this.maxHP))) - this.sinkTimer;

    enterIsland = id => {
        if (this.shipState === 0) this.shipState = 1;
        this.anchorIsland = id;
    }

    exitIsland = () => {
        this.shipState = 0;
        this.departureTime = 5;

        if (this.anchorIsland) {
            const island = entities.find(entity => entity.id === this.anchorIsland);

            // Set the rotation of the boat away from the island.
            this.rotation = utils.rotationToObject(this, island);

            // Make a jump so that the boat does not instantly anchor again.
            const outward = utils.angleToVector(this.rotation);

            this.position.x = island.position.x - outward.x * (island.dockRadius + 5);
            this.position.z = island.position.z - outward.y * (island.dockRadius + 5);

            this.anchorIsland = undefined;
        }
    }

    exitMotherShip = id => {
        const motherShip = entities.find(entity => entity.id === id);
        if (!motherShip) return;

        // Set the rotation away from the mothership.
        this.rotation = utils.rotationToObject(this, ship);

        // Make a tiny jump away from the mothership.
        const outward = utils.angleToVector(this.rotation);

        this.position.x = motherShip.position.x - outward.x * (motherShip.collisionRadius + 5);
        this.position.x = motherShip.position.z - outward.y * (motherShip.collisionRadius + 5);
    }

    destroySelf = () => {
        // All the children - destroy them too.
        for (const childID of this.children) {
            const child = entities.find(entity => entity.id === childID);
            child.socket.emit(`end`, child.gold);

            this.children.splice(this.children.indexOf(child), 1);
        }

        // Destroy the entire entity.
        this.destroy();
    }
}

module.exports = Boat;

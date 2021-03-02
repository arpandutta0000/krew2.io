const THREE = require(`../../../client/libs/js/three.min.js`);

const Entity = require(`./Entity.js`);
const utils = require(`../utils.js`);

class Landmark extends Entity {
    constructor (config) {
        super(config.x, 0, config.z);

        // Network type.
        this.netType = 5;

        // Landmark type and size.
        this.landmarkType = config.type;
        this.size = new THREE.Vector3(this.dockRadius, 20, this.dockRadius);

        // Name and pricing.
        this.name = config.name;
        this.goodsPrice = config.goodsPrice;

        // Dock configuration.
        this.dockRadius = config.dockRadius;

        // Spawn / ship configuration.
        this.spawnPlayers = config.spawnPlayers;
        this.onlySellOwnShips = config.onlySellOwnShips;
    }

    getTypeSnap = () => {
        const snap = {
            t: this.landmarkType,
            n: this.name,
            d: this.dockRadius
        };

        return snap;
    }

    logic = () => {
        for (const childID of this.children) {
            const child = entities.find(entity => entity.id === childID);

            if (child.netType === 0 && child.parent !== this.id) this.removeChild(child.id);
        }

        const boats = entities.find(entity => entity.netType === 1 && entity.hp > 0 && entity.shipState !== 3);
        for (const boat of boats) {
            if (this.isWithinDockingRadius(boat.position.x, boat.position.z)) {
                boat.enterIsland(this.id);
                boat.updateProps();

                if (boat.shipState === 2) {
                    boat.shipState = 3;
                    boat.recruiting = !boat.isLocked;

                    boat.lastMoved = new Date();

                    for (const childID of boat.children) {
                        const child = entities.find(entity => entity.id === childID);
                        if (childID !== boat.captainId) child.socket.emit(`showIslandMenu`);
                    }
                }

                for (const childID of boat.children) {
                    const child = entities.find(entity => entity.id === childID);

                    if (child.netType === 0 && !child.sentDockingMsg) {
                        child.socket.emit(`enterIsland`, {
                            gold: child.gold,
                            captainId: boat.captainId
                        });
                        child.sentDockingMsg = true;
                    }
                }
            }
        }
    }

    isWithinDockingRadius = (x, z) => utils.distance({ x, z }, this.position) < this.dockRadius - 2;
}

module.exports = Landmark;

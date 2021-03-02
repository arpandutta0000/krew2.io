const THREE = require(`../../../client/libs/js/three.min.js`);
const Entity = require(`./entity.js`);

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

        this.dockType = 1;
        this.dockRadius = config.dockRadius;

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

    logic = dt => {
        for (const childID of this.children) {
            const child = entities.find(entity => entity.id === childID);

            if (child.netType === 0 && child.parent !== this.id) this.removeChild(child.id);
        }
    }
}

Landmark.prototype.logic = function (dt) {
    for (c in this.children) {
        let child = this.children[c];
        if (child.netType !== 0)
            continue;
        else {
            if (child.parent !== this) {
                this.children[child.id] = undefined;
                delete this.children[child.id];
            }
        }
    }

    // if this landmark is a dockable thing (rocks etc dont have docks)
    if (this.dockType > 0) {
        // check for nearby boats. anchor them automatically if they just entered
        // check against all boats
        for (b in boats) {
            let boat = boats[b];

            // dont check against boats that have died
            if (boat.hp < 1 || boat.shipState === 3) {
                continue;
            }

            if (this.isWithinDockingRadius(boat.position.x, boat.position.z)) {
                boat.enterIsland(this.id);

                // boat.anchorIsland = this;

                boat.updateProps();

                if (boat.shipState === 2) {
                    boat.shipState = 3;
                    boat.recruiting = boat.isLocked !== true;
                    boat.lastMoved = new Date();
                    for (let c in boat.children) {
                        let child = boat.children[c];
                        if (child && child.netType === 0) {
                            if (child.socket && child.id !== boat.captainId) {
                                child.socket.emit(`showIslandMenu`);
                            }
                        }
                    }
                }

                // socket emit to crew
                for (let c in boat.children) {
                    child = boat.children[c];

                    // see if child is a player and has a socket
                    if (child && child.netType === 0 && child.socket) {
                        if (!child.sentDockingMsg) {
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
    }
};

Landmark.prototype.isWithinDockingRadius = function (x, z) {
    return distance({
        x: x,
        z: z
    }, this.position) < this.dockRadius - 2;
};

// PLayers are entities, check core_entity.js for the base class
Landmark.prototype = new Entity();
Landmark.prototype.constructor = Landmark;

function Landmark (type, x, z, config) {
    this.createProperties();

    this.name = config.name || ``;

    this.goodsPrice = config.goodsPrice;

    // netcode type
    this.netType = 5;

    // landmark type
    this.landmarkType = type;

    // docking / anchoring ?
    this.dockType = 1;
    this.dockRadius = config.dockRadius;
    this.spawnPlayers = config.spawnPlayers;
    this.onlySellOwnShips = config.onlySellOwnShips;

    // net data
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;

    // // size of a Landmark
    this.size = new THREE.Vector3(this.dockRadius, 20, this.dockRadius);

    this.position.x = x;
    this.position.z = z;

    this.collisionRadius = 30;
}

Landmark.prototype.getTypeSnap = function () {
    let snap = {
        t: this.landmarkType,
        name: this.name,
        dockRadius: this.dockRadius
    };
    return snap;
};

// function that parses a snapshot
Landmark.prototype.parseTypeSnap = function (snap) {
    if (snap.t !== undefined) {
        this.pickupSize = parseInt(snap.t);
    }
};

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

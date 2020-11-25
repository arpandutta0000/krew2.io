Landmark.prototype = new Entity();
Landmark.prototype.constructor = Landmark;

function Landmark(type, x, z, config) {

    this.createProperties();

    this.name = config.name || ``;

    this.goodsPrice = config.goodsPrice;

    // Netcode type.
    this.netType = 5;

    // Landmark type.
    this.landmarkType = type;
    
    // Docking / anchoring
    this.dockType = 1;
    this.dockRadius = config.dockRadius;
    this.spawnPlayers = config.spawnPlayers;
    this.onlySellOwnShips = config.onlySellOwnShips;

    // Net data.
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;

    // Size of a Landmark.
    this.size = new THREE.Vector3(this.dockRadius, 20, this.dockRadius);

    this.position = { x, z }
    this.collisionRadius = 30;
}

Landmark.prototype.getTypeSnap = () => {
    let snap = {
        t: this.landmarkType,
        name: this.name,
        dockRadius: this.dockRadius
    }
    return snap;
}

// Function that parses a snapshot.
Landmark.prototype.parseTypeSnap = snap => {
    if(snap.t != undefined) this.pickupSize = parseInt(snap.t);
}

Landmark.prototype.logic = dt => {
    for(let i in this.children) {
        let child = this.children[i];
        if(child.netType == 0 && child.parent != this) {
            this.children[child.id] = undefined;
            delete this.children[child.id];
        }
    }

    // If this landmark is a dockable thing.
    if(this.dockType > 0) {
        // Check for nearby boats. Anchor them automatically if they just entered.
        for(let i in boats) {
            let boat = boats[i];
            // Don't check against boats that have died.
            if(boat.hp > 1 && boat.shipState != 3) {
                if(this.isWithinDockingRadius(boat.position.x, boat.position.z)) {
                    boat.enterIsland(this.id)
                    boat.updateProps();

                    if(boat.shipState == 2) {
                        boat.shipState = 3;
                        boat.recruiting = boat.isLocked != true;
                        boat.lastMoved = new Date();

                        children.forEach(child => {
                            if(child && child.netType == 0 && child.socket && child.id != boat.captainId) child.socket.emit(`showIslandMenu`); 
                        });
                    }

                    // Socket emit to crew.
                    children.forEach(child => {
                        // See if child is a player and has a socket.
                        if(child && child.netType == 0 && child.socket) {
                            if(!child.sentDockingMsg) {
                                child.socket.emit(`enterIsland`, {
                                    gold: child.gold,
                                    captainId: boat.captainId
                                });
                                child.sentDockingMsg = true;
                            }
                        }
                    });
                }
            }
        }
    }
}

Landmark.prototype.isWithinDockingRadius = (x, z) => {
    return distance({ x, z }, this.position) < this.dockRadius - 2;
}

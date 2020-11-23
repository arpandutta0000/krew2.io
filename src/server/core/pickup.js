/** Pickup types:
 * 0 = Crates.
 * 1 = Sea animals.
 * 2 = Static supplies like shells.
 * 3 = Island animals.
 * 4 = Chests.
*/

Pickup.prototype = new Entity();
Pickup.prototype.constructor = Pickup;

function Pickup(size, x, z, type, specialBonus) {
    this.createProperties();

    // Netcode type.
    this.netType = 4;
    this.bonusValues = [50, 75, 100, 1e4, specialBonus];

    // Pickup type.
    this.pickupSize = size;
    this.bonus = this.bonusValues[this.pickupSize] || 25;
    this.captainsCutRatio = 0.3;

    // Net data.
    this.sendDelta = type != 1;
    this.sendSNap = !(type == 0 || type == 2 || type == 3);
    this.sendCreationSnapOnDelta = true;
    this.spawnPacket = false;

    // Size of a pickup.
    let scale = 1;
    if(type == 0) scale = parseInt(size) + 1;
    else if(type == 1) scale = 0.05 * size;
    else if(type == 2 || type == 3) scale = 0.02;  
    else if(type == 4) scale = 2;

    this.size = new THREE.Vector3(scale, scale, scale);
    this.modelscale = new THREE.Vector3(scale, scale, scale);

    this.position.x = x;
    this.position.z = z;

    this.pickerId = ``;
    this.type = type;

    this.picking = type == 1 ? true: false;
    this.catchingFish = false;

    this.timeout = 1;
}

Pickup.prototype.randomTime = (min, max) => {
    return (Math.floor(Math.random() * (max - min)) + min) * 1e3;
}

Pickup.prototype.randomMovementLogic = () => {
    this.randomMovementLogicTime = this.randomMovementLogicTime || Date.now();
    this.randomMovementTIme = this.randomMovementTime || this.randomTime(5, 10);

    if(Date.now() - this.randomMovementLogicTime > this.randomMovementTime) {
        let move = Math.round(Math.random());
        if(move) {
            let landmark = false;
            for(let i in core.Landmarks) {
                if(core.Landmarks[i].pickups != undefined && core.Landmarks[i].pickups[this.id] != undefined) {
                    landmark = core.Landmarks[i];
                    break;
                }
            }
            if(landmark != false) {
                let pickupPosition = {
                    x: 0,
                    z: 0
                }

                let distanceFromCenter = 0;
                let distanceFromPickup = 0;

                while(distanceFromPickup < 2 || distanceFromCenter > landmark.dockRadius - 30 || distanceFromCenter < landmark.dockRadius - 40) {
                    pickupPosition.x = Math.floor(Math.random() * ((this.position.x + 6) - (this.position.x - 6)) + (this.position.x - 6));
                    pickupPosition.z = Math.floor(Math.random() * ((this.position.z + 6) - (this.position.z - 6)) + (this.position.z - 6));

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
}

Pickup.prototype.logic = dt => {
    if(this.picking) {
        this.timeout -= dt * 0.5;
        if(this.timeout <= 0 || this.timeout == 1) removeEntity(this);
    }

    // If pickup should be picked but the picker player is undefined, delete it.
    if(this.picking == true && this.pickerId != `` && entities[this.pickerId] == undefined) {
        // Check for all boats that are within picking distance of pickups.
        boats.forEach(boat => {
            // Don't check against boats that have died.
            if(boat.hp < 1) return;
            let loc = boat.toLocal(this.position);

            // Then do an AABB and only take damage if the person who shot this projectile is from another boat (can't shoot our own boat).
            if(!isNaN(loc.x)
            && !(Math.abs(loc.x) > Math.abs(boat.size.x * 0.6 + 3)
            || Math.abs(loc.z) > Math.abs(boat.size.z * 0.6 + 3))) {
                let bonus = this.bonusValues[this.pickupSize];

                let totalScore = 0;
                boat.children.forEach(player => totalScore += player.score);

                let captainsCut = bonus;
                boat.children.forEach(player => {
                    if(player != boat.captain) {
                        let playersCut = (player.score / totalScore ) * (1 - this.captainsCutRatio) * bonus;
                        player.gold += playersCut;
                        captainsCut -= playersCut;
                    }
                });

                let captain = boat.children[boat.captainId];
                if(captain) captain.gold += captainsCut;

                boat.hp = Math.min(boatTypes[boat.shipclassId].hp, boat.hp + (bonus * 0.2));
                removeEntity(this);
            }
        });
    }

    if(this.type == 2 || this.type == 3) {
        entities.forEach(entity => {
            if(entity.netType == 0) {
                let playerPosition = entity.worldPos();
                let distanceFromPlayer = Math.sqrt(
                    (this.position.x - playerPosition.x) *
                    (this.position.x - playerPosition.x) +
                    (this.position.z - playerPosition.z) *
                    (this.position.z - playerPosition.z)
                );

                if(distanceFromPlayer < 2) {
                    if(distanceFromPlayer < 1.6) removeEntity(this);
                    this.picking = true;
                    this.pcikerId = player.id;

                    player.gold += this.bonusValues[this.pickupSize] / 3 * 2;
                    player.updateExperience(Math.round(this.bonusValues[this.pickupSize] / 20));
                }
            }
        });
    }
}

Pickup.prototype.getTypeSnap = () => {
    let snap = {
        s: this.pickingSize,
        p: this.picking,
        i: this.picker,
        t: this.type
    }
    return snap;
}

Pickup.prototype.getTypeDelta = () => {
    if(this.type == 1) {
        if(!this.spawnPacket) {
            this.spawnPacket = true;
            return this.getTypeSnap();
        }
        return undefined;
    }
    else {
        let delta = {
            s: this.deltaTypeCompare(`s`, this.pickupSize),
            p: this.deltaTypeCompare(`p`, this.picking),
            i: this.deltaTypeCompare(`i`, this.pickerId),
            t: this.deltaTypeCompare(`t`, this.type)
        }
        if(isEmpty(delta)) delta = undefined;
        return delta;
    }
}

// Function that parses a snapshot.
Pickup.prototype.parseTypeSnap = snap => {
    if(snap.s != undefined && snap.s != this.pickupSize) this.pickupSize = parseInt(snap.s);
    if(snap.p != undefined && snap.p != this.picking) this.picking = parseInt(snap.p);
    if(snap.i != undefined && snap.i != this.pickerId) this.pickerId = parseInt(snap.i);
    if(snap.t != undefined && snap.t != this.type) this.type = parseInt(snap.t);
}

// Function that parses a snapshot.
Pickup.prototype.onDestroy = () => {
    // Make sure to also call the entity ondestroy.
    Entity.prototype.onDestroy.call(this);
    if(pickups[this.id]) delete pickups[this.id];
}
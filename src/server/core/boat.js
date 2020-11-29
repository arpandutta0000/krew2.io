Boat.prototype = new Entity();
Boat.prototype.constructor = Boat;

function Boat(captainId, krewName, spawnBool) {
    let captainName = ``;
    let spawnIslandId = undefined;

    if(entities[captainId] != undefined) {
        captainName =  entities[captainId].name;
        if(entities[captainId].parent != undefined) {
            spawnIslandId = entities[captainId].parent.netType == 5 ?
                entities[captainId].parent.id:
                entities[captainId].parent.anchorIslandId;
        }
    }

    this.createProperties();

    // Parse the ship values.
    this.supply = 0;

    // Start off with cheapest boat.
    this.setShipClass(1);
    
    this.hpRegTimer = 0;
    this.hpRegInterval = 1;

    this.arcFront = 0.0;

    // Info that is nto sent via delta.
    this.muted = [`x`, `z`, `y`];

    // Krew members & count.
    this.krewMembers = {}
    this.krewCount = 0;

    this.recruiting = false;
    this.isLocked = false;
    this.departureTime = 5;
    this.lastMoved;

    // Netcode type.
    this.netType = 1;

    // Boats can either steer left or right. 0 = no steering.
    this.steering = 0;

    // Boat states.
    this.shipState = {
        starting: -1,
        sailing: 0,
        docking: 1,
        finishedDocking: 2,
        anchored: 3,
        departing: 4
    }

    this.shipState = -1;

    // Number of ships the whole crew has sunk & amount of cargo (in gold) traded by the whole crew.
    this.overallKills = 0;
    this.overallCargo = 0;

    this.sentDockingMsg = false;
    this.anchorIsland = spawnIslandId;

    // A timer that counts down once your HP is below zero - you are sinking.
    this.sinkTimer = 0;

    // Boats have a captain, but we only reference it by ID (better for netCode). If there is no captain, the id is ``.
    this.captainId = captainId || ``;

    // Boats have a crew name, by default it is the captain's name or the passed krew name, this is set on the update function, initially undefined.
    captainName = typeof captainName == `string` ? captainName: ``;
    this.crewName = typeof krewname == `string` ? krewName: (`${captainName}'${captainName.charAt(captainName.length - 1) == `s` ? ``: `s`} krew`);

    // On death, we drop things. This is a secruity value so it only happens once.
    this.hasDoneDeathDrops = false;

    this.steering = 1;

    // Used for respawning near the edge of the map.
    if(spawnBool == true) {
        let roll = Math.floor(Math.random() * Math.floor(4));
        if(roll == 0) {
            this.position.x = Math.floor(Math.random() * 250);
            this.position.z = Math.floor(Math.random() * worldsize);
        }
        else if(roll == 1) {
            this.position.x = Math.floor(Math.random() * worldsize);
            this.position.z = Math.floor(Math.random() * (worldsize - (worldsize - 250) ) + (worldsize - 250));
        }
        else if(roll == 2) {
            this.position.x = Math.floor(Math.random() * (worldsize - (worldsize - 250) ) + (worldsize - 250));
            this.position.z = Math.floor(Math.random() * worldsize);
        }
        else if(roll == 3) {
            this.position.x = Math.floor(Math.random() * worldsize);
            this.position.z = Math.floor(Math.random() * 250);
        }
    }
    else {
        // Spawn on island instead of on rafts (in the sea).
        let spawnIsland;
        if(Landmarks[this.anchorIslandId] != undefined) {
            spawnIsland = Landmarks[this.anchorIslandId];
            this.position.x = spawnIsland.position.x + (Math.random() * 60) - 60;
            this.position.z = spawnIsland.position.z + (Math.random() * 60) - 60;
        }
        else {
            spawnIsland = Landmarks[Object.keys(core.Landmarks)[0]];
            this.position.x = spawnIsland.position.x + (Math.random() * 60) - 60;
            this.position.z = spawnIsland.position.z + (Math.random() * 60) - 60;
            this.anchorIslandId = spawnIsland.id;
        }
    }
}

Boat.prototype.updateProps = () => {
    let krewCount = 0;
    this.children.forEach((player, id) => {
        if(player == undefined || player.parent == undefined || player.parent != this.id) delete this.children[id];

        let child = this.children[id];
        if(child && child.netType == 0) krewCount++;

        this.krewCount = krewCount;
        if(this.krewCount == 0) removeEntity(this);
    });
}

Boat.prototype.logic = dt => {
    // World boundaries.
    let boundaryCollision = false;
    if(this.position.x > worldsize) this.position.x = worldsize;
    if(this.position.z > worldsize) this.position.z = worldsize;
    if(this.position.x < 0) this.position.x = 0;
    if(this.position.z < 0) this.position.z = 0;

    if(this.position.x > worldsize
    || this.position.z > worldsize
    || this.position.x < 0
    || this.position.z) boundaryCollision = true;

    let kaptain = entities[this.captainId];

    // The boat movement is simple. It always moves forward, and rotates if the captain is steering.
    if(kaptain != undefined && this.crewName != undefined) this.speed = boatTypes[this.shipclassId].speed + parseFloat(kaptain.movementSpeedBonus / 100);

    let moveVector = new THREE.Vector3(0, 0, this.speed);

    // If boat is not anchored or not in dockign staet, we will move.
    if(this.shipState == 0) {
        // If the player moves to the side of the boat, the rotation changes slowly.
        kaptain != undefined ?
            this.rotation += this.steering * dt * 0.4 * (this.turnspeed + parseFloat(0.05 * kaptain.movementSpeeBonus / 100)):
            this.rotation += this.steering * dt * 0.4 * this.turnspeed;
        
        // We rotate the movement vector depending on the current rotation.
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0). this.rotation);
    }
    else moveVector.set(0, 0, 0);

    // Set the velocity to be the move vector.
    this.velocity = moveVector;

    // Find out who the captain is, and if the captain is not defined, assign the first crew member as a captain.
    if(this.children[this.captainId] == undefined) this.captainId = this.children[0].playerId
    this.captain = this.children[this.captainId];

    // Reset steering. This is important, removal will result in ships turning into the dock when they sail.
    this.steering = 0;

    // Do the steering, captain psoition is what determines it. Only steer when not anchored.
    if(this.captain && (this.shipStaet != 3 || this.shipState != -1 || this.shipState != 4)) {
        // Right, left, and middle, in their respective order.
        if(this.captain.position.x > this.size.x * 0.25) this.steering = 1;
        else if(this.captain.position.x < -this.size.x * 0.25) this.steering = -1;
        else this.steering = 0;

        // If we're in a boundary, turn faster.
        if(boundaryCollision) this.steering *= 5;
    }

    // If we died.
    if(this.hp <= 0) {
        if(!this.hasDoneDeathDrops) {
            // Create debris based ons core fot he captain and ship.
            let value = 300;
            if(boatTypes[this.shipclassId] && this.captain) {
                let baseValue = boatTypes[this.shipclassId].price + this.captain.gold;
                let multiplier = baseValue < 5e5 ? 5.5: baseValue < 7.5e5 ? 5: 4.5;

                // Base value can't be larger than 1 million gold.
                baseValue = baseVaule > 1e6 ? 1e6: baseValue;
                value = baseValue / Math.log(baseValue) & multiplier;
            }
            this.hasDoneDeathDrops = true;

            let pickup;
            let bonus;
            let specialBonus = value / 50;

            let x = this.position.x - this.size.x * 1;
            let z = this.position.z - this.size.z * 1;

            // Formulae for crate drops on death, has a cap so that feeding gold is discouraged.
            if(value > 5e3) {
                for(let i = 0; i < 50; i++) pickup = createPickup(4, x + Math.random() * this.size.x, z + Math.random() * this.size.z, 0, true, specialBonus);
            }
            else {
                for(let i = 0; i < value; i++) pickup = createPickup(4, x + Math.random() * this.size.x, z + Math.random() * this.size.z, 0, true, specialBonus);
                if(pickup) bonus = pickup.bonus + value + 1;
            }
        }

        // Increase the ship timer, make ship sink.
        this.sinktimer += dt;

        if(this.sinktimer > 4.0) {
            // Ship has sunk, so remove it from the game.
            removeEntity(this);
        }
    }
    else {
        // Regenerate health if we are not below 1 hp.
        this.hpRegTimer += dt;

        if(this.hpRegTimer > this.hpRegInterval) {
            this.hpRegTimer = 0;
            this.hp++;
            this.hp = Math.min(this.hp, this.maxHp);
        }
    }
}

Boat.prototype.setShipClass = classId => {
    this.shipclassId = classId;
    
    let currentShipClass = boatTypes[classId];

    this.maxHp = currentShipClass.hp;
    this.hp = this.maxHp;
    this.turnspeed= currentShipClass.turnspeed;
    this.maxKrewCapacity = currentShipClass.maxKrewCapacity;
    this.size.set(currentShipClass)
    this.arcFront = currentShipClsas.arcFront;
    this.inertia = currentShipClass.inertia;
    this.collisionRadius - currentShipClass.radius;
    this.speed = currentShipClass.speed;
    this.shipState = 2;
}

Boat.prototype.getTypeSnap = () => {
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
    }
}

Boat.prototype.getTypeDelta = () => {
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
    }
    if(isEmpty(delta)) delta = undefined;
    return delta;
}

// Function to parse a snapshot.
Boat.prototype.onDestroy = () => {
    // Destroy all the children.
    this.children.forEach(player => {
        if(player.netType == 0) if(player.socket != undefined) player.socket.emit(`end`, player.gold, player.shotsFired, player.shotsHit, player.shipsSank);
    });
    this.children = {}

    // Make sure to also destroy the entity.
    Entity.prototype.onDestroy.call(this);
    if(boats[this.id]) delete boats[this.id];
}

Boat.prototype.getHeightAboveWater = () => {
    return boatTypes[this.shipclassId].baseheight * (0.2 + 0.8 * (this.hp / this.maxHp)) - this.sinktimer;
}

Boat.prototype.enterIsland = islandId => {
    // We only want to change the ship state to docking once.
    if(this.shipState == 0) this.shipState = 1;
    this.anchorIslandId = islandId;
}

Boat.prototype.exitIsland = () => {
    this.shipState = 0;
    this.recruiting = false;
    this.departureTime = 5;

    if(this.anchorIslandId) {
        // Set rotation away from island.
        this.rotation = rotationToObject(this, entities[this.anchorIslandId]);
        
        // Make a tiny jump so we don't instantly anchor again.
        let outward = angleToVector(this.rotation);
        
        this.position.x = entities[this.anchorIslandId].position.x - outward.x * (entities[this.anchorIslandId].dockRadius + 5);
        this.position.z = entities[this.anchorIslandId].position.z - outward.y * (entities[this.anchorIslandId].dockRadius + 5);
    }
    this.anchorIslandId = undefined;
}

// When player is abandoning ship.
Boat.prototype.exitMotherShip = mothership => {
    // Set rotation away from mothership.
    this.rotation = rotationToObject(this, mothership);

    // Make a tiny jump away from mothership.
    let outwards = angleToVector(this.rotation);
    this.position.x = mothership.x - outward.x * (mothership.collisionRadius + 5);
    this.position.z = mothership.z - outward.y * (mothership.collisionRadius + 5);
}

// PLayers are entities, check core_entity.js for the base class
Boat.prototype = new Entity();
Boat.prototype.constructor = Boat;

function Boat (captainId, krewName, spawnBool) {
    let captainsName = ``;
    let spawnIslandId;

    if (entities[captainId] !== undefined) {
        captainsName = entities[captainId].name;
        if (entities[captainId].parent !== undefined) {
            spawnIslandId = entities[captainId].parent.netType === 5
                ? entities[captainId].parent.id
                : entities[captainId].parent.anchorIslandId;
        }
    }

    this.createProperties();

    // parse the ship values
    this.supply = 0;

    this.setShipClass(1); // start off with cheapest boat

    this.hpRegTimer = 0;
    this.hpRegInterval = 1;

    this.arcFront = 0.0;
    this.arcBack = 0.0;

    // info that is not sent via delta
    this.muted = [`x`, `z`, `y`];

    // krew members
    this.krewMembers = {};

    this.krewCount = 0; // Keep track of boat's krew count to update krew list window

    // this.totalWorth = 0; // Keep track of boat's total worth to update krew list window

    this.recruiting = false; // If the ship has been docked for more than 5 minutes, then it's not recruiting
    this.isLocked = false; // by default the krew is not locked
    this.departureTime = 5;
    this.lastMoved;

    // netcode type
    this.netType = 1;

    // Boats can either steer left or right. 0 = no steering
    this.steering = 0;

    // boats states, 0 = sailing/ 1 = docking..,etc
    this.shipState = {
        starting: -1,
        sailing: 0,
        docking: 1,
        finishedDocking: 2,
        anchored: 3,
        departing: 4
    };

    this.shipState = -1;
    this.overall_kills = 0; // Number of ships the whole crew has sunk
    this.overall_cargo = 0; // Amount of cargo (worth gold) traded by the whole crew

    this.sentDockingMsg = false;

    // this.anchorIsland = undefined;
    this.anchorIslandId = spawnIslandId;

    // a timer that counts down once your hp is below zero - you are sinking
    this.sinktimer = 0;

    // boats have a captain, but we only reference it by ID (better for netcode)
    // If there is no captain, the id is: ""
    this.captainId = captainId || ``;

    // Boats have a crew name, by default it's the captains name or the passed krew name,
    // this is setted on the update function, so initially is set to undefined
    captainsName = typeof captainsName === `string` ? captainsName : ``;
    this.crewName = typeof krewName === `string`
        ? krewName
        : (
            `${captainsName}'${
                captainsName.charAt(captainsName.length - 1) === `s` ? `` : `s`
            } krew`
        );

    // on death, we drop things. this is a security value so it only happens once
    this.hasDoneDeathDrops = false;

    this.steering = 1;

    // let spawnIsland = spawnIslandId ? Landmarks[spawnIslandId] :
    //     Landmarks[
    //         Object.keys(Landmarks)[
    //             Math.round(Math.random() * (Object.keys(Landmarks).length - 1))
    //         ]
    //     ];
    //
    // this.anchorIslandId = spawnIsland.id;

    if (spawnBool === true) {
        // used for respawn near the edge of the map
        let roll = Math.floor(Math.random() * Math.floor(4));
        if (roll === 0) {
            this.position.x = Math.floor(Math.random() * 150);
            this.position.z = Math.floor(Math.random() * worldsize);
        } else if (roll === 1) {
            this.position.x = Math.floor(Math.random() * worldsize);
            this.position.z = Math.floor(Math.random() * (worldsize - (worldsize - 150)) + (worldsize - 150));
        } else if (roll === 2) {
            this.position.x = Math.floor(Math.random() * (worldsize - (worldsize - 150)) + (worldsize - 150));
            this.position.z = Math.floor(Math.random() * worldsize);
        } else if (roll === 3) {
            this.position.x = Math.floor(Math.random() * worldsize);
            this.position.z = Math.floor(Math.random() * 150);
        }
        // used for respawn anywhere on the map
        // calculate the spawn position. If spawn position collides with an island, recalculate
        // let spawnResult = false;
        // while (spawnResult !== true) {
        // this.position.x = worldsize * 0.8 * Math.random() + worldsize * 0.1;
        // this.position.z = worldsize * 0.8 * Math.random() + worldsize * 0.1;
        // for (let l in core.config.landmarks) {
        // spawn must be at least 5 fields away from the island
        // let xCoord1 = core.config.landmarks[l]['x'] - (core.config.landmarks[l]['dockRadius'] + 5);
        // let xCoord2 = core.config.landmarks[l]['x'] + (core.config.landmarks[l]['dockRadius'] + 5);
        // let yCoord1 = core.config.landmarks[l]['y'] - (core.config.landmarks[l]['dockRadius'] + 5);
        // let yCoord2 = core.config.landmarks[l]['y'] + (core.config.landmarks[l]['dockRadius'] + 5);
        // if (this.position.x > xCoord1 && this.position.x < xCoord2 && this.position.z > yCoord1 && this.position.z < yCoord2) {
        // spawnResult = false;
        // break;
        // } else {
        // spawnResult = true;
        // }
        // }
        // }
    } else if (spawnBool === false) {
        // code for spawning on islands instead of on rafts (in the sea)
        if (Landmarks[this.anchorIslandId] !== undefined) {
            let spawnIsland = Landmarks[this.anchorIslandId];
            this.position.x = spawnIsland.position.x + (Math.random() * 60) - 60;
            this.position.z = spawnIsland.position.z + (Math.random() * 60) - 60;
        } else {
            spawnIsland = Landmarks[Object.keys(core.Landmarks)[0]];
            this.position.x = spawnIsland.position.x + (Math.random() * 60) - 60;
            this.position.z = spawnIsland.position.z + (Math.random() * 60) - 60;
            this.anchorIslandId = spawnIsland.id;
        }
    }
}

Boat.prototype.updateProps = function () {
    let krewCount = 0;
    for (let id in this.children) {
        if (
            entities[id] === undefined ||
            entities[id].parent === undefined ||
            entities[id].parent.id !== this.id
        ) {
            delete this.children[id];
            continue;
        }

        let child = this.children[id];
        if (child && child.netType === 0) {
            krewCount += 1;
        }
    }

    this.krewCount = krewCount;
    if (this.krewCount === 0)
        removeEntity(this);
};

Boat.prototype.logic = function (dt) {
    // world boundaries
    let boundaryCollision = false;
    if (this.position.x > worldsize) {
        this.position.x = worldsize;
        boundaryCollision = true;
    }

    if (this.position.z > worldsize) {
        this.position.z = worldsize;
        boundaryCollision = true;
    }

    if (this.position.x < 0) {
        this.position.x = 0;
        boundaryCollision = true;
    }

    if (this.position.z < 0) {
        this.position.z = 0;
        boundaryCollision = true;
    }

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

    // calculate the krew members' salary based on their score
    // first, find total amount of all krew members' scores combined

    // if (this.captain)
    // {
    //     let totalScore = 0;
    //     for (id in this.children)
    //     {
    //         let krewMember = this.children[id];
    //         totalScore += krewMember.score;
    //     }

    //     let totalSalary = 0;
    //     let captainsCut = 0;
    //     if (totalScore > 0)
    //     {
    //         // then, determine the salary
    //         for (id in this.children)
    //         {

    //             let krewMember = this.children[id];
    //             let salary = (krewMember.score / totalScore) * (this.supply * .7)
    //             if (this.captainId === id)
    //             {
    //                 captainsCut = salary;
    //             }

    //             krewMember.salary = salary;
    //             totalSalary += salary;
    //         }
    //     }

    //     this.captain.salary = captainsCut + this.supply - totalSalary;
    // }
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

// // function that parses a snapshot
// Boat.prototype.parseTypeSnap = function (snap) {
// };

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

    // pay everyone salary
    // for (id in this.children)
    // {
    //     let krewMember = this.children[id]
    //     krewMember.gold += krewMember.salary;
    //     this.children[id].salary = 0;
    //     this.children[id].score = 0;
    // }

    // this.supply = 0;
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

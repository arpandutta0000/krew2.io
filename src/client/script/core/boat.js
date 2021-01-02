// PLayers are entities, check core_entity.js for the base class
Boat.prototype = new Entity();
Boat.prototype.constructor = Boat;

function Boat (captainId, krewName, spawnBool) {
    var captainsName = '';
    var spawnIslandId = undefined;

    if (entities[captainId] !== undefined) {
        captainsName = entities[captainId].name;
        if (entities[captainId].parent !== undefined) {
            spawnIslandId = entities[captainId].parent.netType === 5 ?
                entities[captainId].parent.id :
                entities[captainId].parent.anchorIslandId;
        }
    }

    this.createProperties();

    // parse the ship values
    this.supply = 0;

    this.setShipClass(1); // start off with cheapest boat

    this.hpRegTimer = 0;
    this.hpRegInterval = 1;

    this.arcFront = 0.0;

    // info that is not sent via delta
    this.muted = ['x', 'z', 'y'];

    //krew members
    this.krewMembers = {};

    this.krewCount = 0; // Keep track of boat's krew count to update krew list window

    //this.totalWorth = 0; // Keep track of boat's total worth to update krew list window

    this.recruiting = false; // If the ship has been docked for more than 5 minutes, then it's not recruiting
    this.isLocked = false; // By default krew is not locked
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
        departing: 4,
    };

    this.shipState = -1;
    this.overall_kills = 0; //Number of ships the whole crew has sunk
    this.overall_cargo = 0; //Amount of cargo (worth gold) traded by the whole crew

    this.sentDockingMsg = false;

    // this.anchorIsland = undefined;
    this.anchorIslandId = spawnIslandId;

    // a timer that counts down once your hp is below zero - you are sinking
    this.sinktimer = 0;

    // boats have a captain, but we only reference it by ID (better for netcode)
    // If there is no captain, the id is: ""
    if (captainId && entities[captainId]) {
        this.captainId = captainId;
        this.clan = entities[captainId].clan;
    } else {
        this.captainId = "";
        this.clan = "";
    }

    // Boats have a crew name, by default it's the captains name or the passed krew name,
    // this is setted on the update function, so initially is set to undefined
    captainsName = typeof captainsName === 'string' ? captainsName : '';
    this.crewName = typeof krewName === 'string' ?
        krewName :
        (
            captainsName + "'" +
            (captainsName.charAt(captainsName.length - 1) === 's' ? '' : 's') +
            ' krew'
        );

    // on death, we drop things. this is a security value so it only happens once
    this.hasDoneDeathDrops = false;

    // set up geometry for client
    this.rottimer = Math.random() * 5;

    // value that makes the ship lean towards one side
    this.leanvalue = 0;

    this.setName(this.crewName);
}

Boat.prototype.updateProps = function () {

    var krewCount = 0;
    for (var id in this.children) {
        if (
            entities[id] === undefined ||
            entities[id].parent === undefined ||
            entities[id].parent.id !== this.id
        ) {
            delete this.children[id];
            continue;
        }

        var child = this.children[id];
        if (child && child.netType === 0) {
            krewCount += 1;
        }
    }

    this.krewCount = krewCount;
    if (this.krewCount === 0) removeEntity(this);
};

Boat.prototype.setName = function (crewName) {
    var clan = '';
    if (this.clan !== undefined && this.clan !== '') {
        clan = '[' + this.clan + '] ';
    }
    if (this.geometry !== undefined) {
        if (this.label === undefined) {
            // Set the crews name
            this.label = new THREE.TextSprite({
                textSize: 4,
                redrawInterval: CONFIG.Labels.redrawInterval,
                texture: {
                    text: clan + crewName,
                    fontFamily: CONFIG.Labels.fontFamily,
                },
                material: {
                    color: 0xc5a37c,
                    fog: false,
                },
            });
            this.label.name = 'label';
            this.label.position.set(0, boatTypes[this.shipclassId].labelHeight, 0);

            for (var l = this.geometry.children.length; l--;) {
                if (
                    this.geometry.children[l].isTextSprite &&
                    this.geometry.children[l].name === 'label'
                ) {
                    this.geometry.remove(this.geometry.children[l]);
                }
            }
            this.geometry.add(this.label);
        }
        this.label.material.map.text = clan + crewName;
        this.label.visible = myPlayer &&
            myPlayer.parent &&
            this.id !== myPlayer.parent.id &&
            this[CONFIG.Labels.boats.useMethod];
    }
    this.crewName = crewName;
};

Boat.prototype.logic = function (dt) {

    // world boundaries
    var boundaryCollision = false;
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

    var kaptain = entities[this.captainId];

    // the boat movement is simple. it always moves forward, and rotates if the captain is steering
    if (kaptain !== undefined && this.crewName !== undefined) {
        this.speed = boatTypes[this.shipclassId].speed + parseFloat(kaptain.movementSpeedBonus / 100);
    }

    var moveVector = new THREE.Vector3(0, 0, (this.speed));

    // if boat is not anchored or not in docking state, we will move
    if (this.shipState == 0) {

        // if the steering button is pressed, the rotation changes slowly
        (kaptain !== undefined) ?
        this.rotation += this.steering * dt * 0.4 * (this.turnspeed + parseFloat(0.05 * kaptain.movementSpeedBonus / 100)):
            this.rotation += this.steering * dt * 0.4 * this.turnspeed;

        // we rotate the movement vector depending on the current rotation
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);

    } else {
        moveVector.set(0, 0, 0);
    }

    // set the velocity to be the move vector
    this.velocity = moveVector;

    // client side, calculate the ship leaning
    this.leanvalue += (this.steering * 4 - this.leanvalue) * dt;
    this.rottimer += dt;

    if (myPlayer && myPlayer.parent && this.sail) {
        this.sail.material.visible = this.id === myPlayer.parent.id ? false : true;
    }

    if (myPlayer && myPlayer.parent && this.mast) {
        this.mast.material.visible = this.id === myPlayer.parent.id ? false : true;
    }

    if (this.body &&
        (
            this.shipState === 3 ||
            this.shipState === -1 ||
            this.shipState === 4
        )
    ) {
        this.rottimer = 0;
        this.leanvalue = 0;
        if (this.body.material.opacity >= 0.5) {
            this.body.material.opacity -= 0.0075;
        }

        if (this.sail && this.sail.material.opacity >= 0.5) {
            this.sail.material.opacity -= 0.0075;
        }

        if (this.mast && this.mast.material.opacity >= 0.5) {
            this.mast.material.opacity -= 0.0075;
        }
    } else {
        this.body.material.opacity = 1;
        if (this.sail) {
            this.sail.material.opacity = 0.9;
        }

        if (this.mast) {
            this.mast.material.opacity = 0.9;
        }
    }

    this.geometry.rotation.x = Math.sin(this.rottimer * 0.5 + 3) * Math.sin(this.rottimer) * 0.05;
    this.geometry.rotation.z = Math.sin(this.rottimer * 1.0) * 0.05 - this.leanvalue * 0.08;

    //push away from islands
    /*
    for (e in entities)
    {
        if(entities[e] != this && entities[e].netType == 5)
        {
            var dist = entityDistance(this, entities[e]) - (entities[e].collisionRadius + this.collisionRadius );

            if(dist < 10)
            {
                var local = this.toLocal(entities[e].position);
                //var power = entities[e].inertia/this.inertia;
                   // either add it to rotation, or to the steering
                this.rotation += -((local.x > 0 ? (10-local.x) : (10+local.x) )*(10-dist)*(local.z+10))*dt*0.0005;
            }
        }
    }*/

    // if our hp is low (we died)
    if (this.hp < 1) {

        // on client, disconnect the camera from the player
        if (myPlayer && myPlayer.parent == this) {
            ui.playAudioFile(false, 'sink-crash');
            THREE.SceneUtils.detach(camera, camera.parent, scene);
            $('#shopping-modal').hide();
            $('#show-shopping-modal-button').hide();
        }

        // increase the sink timer, make ship sink
        this.sinktimer += dt;

        if (this.sinktimer > 4.0) {
            // ships down, lets remove it from game

            removeEntity(this);
        }
    }

    // calculate the krew members' salary based on their score
    // first, find total amount of all krew members' scores combined

    // if (this.captain)
    // {
    //     var totalScore = 0;
    //     for (id in this.children)
    //     {
    //         var krewMember = this.children[id];
    //         totalScore += krewMember.score;
    //     }

    //     var totalSalary = 0;
    //     var captainsCut = 0;
    //     if (totalScore > 0)
    //     {
    //         // then, determine the salary
    //         for (id in this.children)
    //         {

    //             var krewMember = this.children[id];
    //             var salary = (krewMember.score / totalScore) * (this.supply * .7)
    //             if (this.captainId == id)
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

Boat.prototype.clientlogic = function () {

    // on client, always make the y position the height above the water (depends on how much hp the ship has)
    this.position.y = this.getHeightAboveWater();

    // rotate through water
    var geometryPosition = new THREE.Vector3(
        this.position.x,
        this.position.y,
        this.position.z
    );

    this.geometry.position.lerp(geometryPosition, 0.8);

    this.geometry.rotation.y = lerp(
        this.geometry.rotation.y,
        this.rotation,
        0.5
    );
};

Boat.prototype.setShipClass = function (classId) {
    this.shipclassId = classId;

    var currentShipClass = boatTypes[classId];

    this.maxHp = currentShipClass.hp;
    this.hp = this.maxHp;
    this.turnspeed = currentShipClass.turnspeed;
    this.maxKrewCapacity = currentShipClass.maxKrewCapacity;
    this.size.set(currentShipClass.width, currentShipClass.height, currentShipClass.depth);
    this.arcFront = currentShipClass.arcFront;
    this.inertia = currentShipClass.inertia;
    this.collisionRadius = currentShipClass.radius;
    this.speed = currentShipClass.speed;
    this.shipState = 2;

    //console.log("changing boat model");
    this.changeBoatModel(this.shipclassId);
    if (myPlayer != undefined) {
        if (this == myPlayer.parent) {
            ui.showCenterMessage('Ship upgraded to ' + boatTypes[this.shipclassId].name, 3);
            ui.updateStore($('.btn-shopping-modal.active'));
        }
    }
};

Boat.prototype.getKrewOnBoard = function () {
    for (var i in this.children) {
        if (this.children[i].parent && this.children[i].parent.id === this.id) {
            this.geometry.add(this.children[i].geometry);
            this.children[i].position.x = 0;
            this.children[i].position.y = 0;
            this.children[i].position.z = 0;
        }

        if (this.children[i].parent === undefined || this.children[i].parent.id !== this.id) {
            delete this.children[i];
        }
    }
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
    };
};

// function that generates boat specific delta data
Boat.prototype.getTypeDelta = function () {
    var delta = {
        h: this.deltaTypeCompare('h', this.hp),
        s: this.deltaTypeCompare('s', this.steering.toFixed(4)),
        c: this.deltaTypeCompare('c', this.shipclassId),
        u: this.deltaTypeCompare('u', this.supply),
        b: this.deltaTypeCompare('b', this.captainId),
        t: this.deltaTypeCompare('t', this.shipState),
        a: this.deltaTypeCompare('a', this.anchorIslandId),
        k: this.deltaTypeCompare('k', this.krewCount),
        e: this.deltaTypeCompare('e', this.speed),
        r: this.deltaTypeCompare('r', this.recruiting),
        l: this.deltaTypeCompare('l', this.isLocked),
        d: this.deltaTypeCompare('d', this.departureTime),
    };

    if (isEmpty(delta)) {
        delta = undefined;
    }

    return delta;
};

// function that parses a snapshot
Boat.prototype.parseTypeSnap = function (snap) {
    if (snap.h !== undefined && snap.h != this.hp) {
        this.hp = parseInt(snap.h);
    }

    if (snap.s !== undefined) {
        this.steering = parseFloat(snap.s);
    }

    //if (snap.d !== undefined) this.isDocking = snap.d;

    // update supply
    if (snap.u !== undefined) {
        var newSupply = parseInt(snap.u);
        if (myPlayer && this == myPlayer.parent && newSupply != this.supply) {
            var suppliesEarned = newSupply - this.supply;
            if (suppliesEarned > 1) {
                ui.showCenterMessage('+ ' + suppliesEarned + ' supplies', 2);
            }
        }

        this.supply = newSupply;
    }

    // if class has changed, change model
    if ((snap.c !== undefined && snap.c != this.shipclassId) || this.body == undefined) {
        this.setShipClass(snap.c);
    }

    // if anchorIsland changed
    if (snap.a !== undefined && snap.a != this.anchorIslandId) {
        this.anchorIslandId = snap.a;
    }

    // if krew count changed
    if (snap.k !== undefined && snap.k != this.krewCount) {
        this.krewCount = snap.k;
    }

    // if captain has changed
    if (snap.b !== undefined && this.captainId != snap.b) {
        this.captainId = snap.b;
    }

    // if speed has changed
    if (snap.e !== undefined && this.speed != snap.e) {
        this.speed = parseInt(snap.e);
    }

    // if recruiting has changed
    if (snap.r !== undefined && this.recruiting != snap.r) {
        this.recruiting = parseBool(snap.r);
    }

    // if krew lock has changed
    if (snap.l !== undefined && this.isLocked != snap.r) {
        this.isLocked = parseBool(snap.l);
    }

    // if departure time has changed
    if (snap.d !== undefined && this.departureTime != snap.d) {
        this.departureTime = parseInt(snap.d);
    }

    // If the ship's state has changed, send a snap and change its transparency if it docked
    if (snap.t !== undefined && this.shipState != snap.t) {
        this.shipState = parseInt(snap.t);
        if (this.shipState === 0) {
            this.getKrewOnBoard();
        }
        /*var dockDecision = this.shipState == 3 || this.shipState == -1 || this.shipState == 4? 1 : 0;
        this.docking(dockDecision)*/
    }
};

// function that parses a snapshot
Boat.prototype.onDestroy = function () {

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
    //     var krewMember = this.children[id]
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
        //set rotation away from island
        this.rotation = rotationToObject(this, entities[this.anchorIslandId]);

        // make a tiny jump so we dont instantly anchor again
        var outward = angleToVector(this.rotation);
        this.position.x = entities[this.anchorIslandId].position.x - outward.x * (entities[this.anchorIslandId].dockRadius + 5);
        this.position.z = entities[this.anchorIslandId].position.z - outward.y * (entities[this.anchorIslandId].dockRadius + 5); // <- careful. y value!
    }

    this.anchorIslandId = undefined;
};

// when ship is abandoning its mothership!
Boat.prototype.exitMotherShip = function (mothership) {

    //set rotation away from mothership
    this.rotation = rotationToObject(this, mothership);

    // make a tiny jump away from mothership
    var outward = angleToVector(this.rotation);
    this.position.x = mothership.position.x - outward.x * (mothership.collisionRadius + 5);
    this.position.z = mothership.position.z - outward.y * (mothership.collisionRadius + 5); // <- careful. y value!

};
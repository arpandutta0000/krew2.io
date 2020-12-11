function Entity() {}

Entity.prototype.createProperties = function() {
        // Each and every thing in the game has a position and a velocity.
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Everything has a size and rotation (y axis), and in terms of logic, everything is a box.
        this.size = new THREE.Vector3(1, 1, 1);
        this.rotation = 0;
        this.collisionRadius = 1;

        // Things can have a parent entity, for example a boat, which is a relative anchor in the world. things that dont have a parent, float freely.
        this.parent = undefined;
        this.children = {}

        this.isNew = true; // If this is a new guy entering the server.

        // Things have a netcode type.
        this.netType = -1;

        // Last snap, stores info to be able to get delta snaps.
        this.sendSnap = true; // Decide if we want to send the snapshots (full entity info) once a second
        this.sendDelta = true; // Decide if we want to send the delta information if there is a change (up to 10 times a second)

        // If this is set to true, but sendSnap isnt, then it will simply send the first delta.
        // As a full snap (good for things that only send their creation).
        this.sendCreationSnapOnDelta = true;
        this.last = {}
        this.lastType = {}

        // some entities have muted netcode parts
        this.muted = [];

        // on client, entities have a model scale and offset (multipied/added with the logical scale/position)
        // we need that because the 3d geometry model files might not actually fit the logical sizes in the game so we have to bring them up to scale
        this.modelscale = new THREE.Vector3(1, 1, 1);
        this.modeloffset = new THREE.Vector3(0, 0, 0);
        this.modelrotation = new THREE.Vector3(0, 0, 0);
        this.baseGeometry = undefined;
        this.baseMaterial = undefined;
    }

Entity.prototype.tick = function(dt) {

    // Compute the base class logic. This is set by the children classes.
    this.logic(dt);

    // move ourselves by the current speed
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    this.clientlogic(dt);
}

// function that generates a snapshot
Entity.prototype.getSnap = function(force) {
    if(!force && !this.sendSnap) {
        return undefined;
    }

    // Bots don't have a rotation so this fails.
    if(this.rotation == undefined) console.log(this);

    let snap = {
        p: this.parent ? this.parent.id : undefined,
        n: this.netType, // netcode id is for entity type (e.g. 0 player)
        x: this.position.x.toFixed(2), // x and z position relative to parent
        y: this.position.y.toFixed(2),
        z: this.position.z.toFixed(2),
        r: (this.rotation || 0).toFixed(2), // rotation
        t: this.getTypeSnap(), // type based snapshot data
    }

    // pass name letiable if we're first time creating this entity
    if(this.netType == 0 && this.isNew) {
        snap.name = this.name;
        snap.id = this.id;

        // check if there's been names queued (for names that were recieved prior to player entity creation). set names
        for (playerId in playerNames) {
            let name = playerNames[playerId];
            if(name && entities[playerId]) entities[playerId].setName(name);
        }
        this.isNew = false;
    }

    return snap;
}

// Function that generates a snapshot.
Entity.prototype.getDelta = function() {
    if(!this.sendDelta && !this.sendCreationSnapOnDelta) return undefined;

    // Send a full snapshot on the delta data, for creation?
    if(this.sendCreationSnapOnDelta) {
        let result = this.getSnap(true);
        this.sendCreationSnapOnDelta = false;
        return result;
    }

    let delta = {
        p: this.deltaCompare(`p`, this.parent ? this.parent.id : undefined),
        n: this.deltaCompare(`n`, this.netType),
        x: this.deltaCompare(`x`, Number(this.position.x.toFixed(2))),
        y: this.deltaCompare(`y`, Number(this.position.y.toFixed(2))),
        z: this.deltaCompare(`z`, Number(this.position.z.toFixed(2))),
        r: this.deltaCompare(`r`, Number(this.rotation.toFixed(2))),
        t: this.getTypeDelta()
    }

    if(isEmpty(delta)) delta = undefined;
    return delta;
}

// Function that parses a snapshot.
Entity.prototype.parseSnap = function(snap, id) {
    if(snap.p && entities[snap.p] && this.parent != entities[snap.p]) {
        let newparent = entities[snap.p];
        let oldparent = this.parent;
        if(myPlayerId == id && newparent != oldparent){
          ui.setActiveBtn(snap.p);
        }
        if(newparent.netType != 5) {
            if(
                this.geometry &&
                newparent.geometry &&
                oldparent &&
                oldparent.geometry
            ) {
                let oldPosition = newparent.geometry.worldToLocal(oldparent.geometry.localToWorld(this.geometry.position));
            } else {
                let oldPosition = newparent.toLocal(this.worldPos());
            }

            this.position.x = oldPosition.x;
            this.position.y = oldPosition.y;
            this.position.z = oldPosition.z;
        }

        newparent.addChildren(this);
        newparent.geometry.add(this.geometry);
        this.geometry.position.set(this.position.x, this.position.y, this.position.z);

        if(newparent.netType == 1) {
            newparent.krewMembers[this.id] = this.geometry.children[0];
        }
        if(myPlayer && myPlayer.isCaptain == false && myPlayer.parent.netType == 5 && newparent.netType == 5 && oldparent && oldparent.netType == 1 && oldparent.shipState == 1) {
            $('#abandon-ship-button').hide();
            showIslandMenu();
        }

        if(this.isPlayer && this.parent && !this.isCaptain && this.parent.netType == 1) {
            if(this.parent.shipState == 3) {
                $('#exit-island-button').hide();
                $('#invite-div').hide();
            }
            $('#abandon-ship-button').show();
        }
    }

    if(snap.t) this.parseTypeSnap(snap.t);

    if(!this.isPlayer) {
        if(snap.x) this.position.x = parseFloat(snap.x);
        if(snap.y) this.position.y = parseFloat(snap.y);
        if(snap.z) this.position.z = parseFloat(snap.z);
        if(snap.r) this.rotation = parseFloat(snap.r);
    }

    // Parse deletion packets.
    if(snap.del) {

        this.onDestroy();
        delete entities[this.id];
        delete playerNames[this.id];
    }

    // Update the player experience only when its needed
    if(snap.t && snap.t.e && snap.t.e != null) {
        if(snap.t.e.l && snap.t.e.l != this.level) this.level = parseInt(snap.t.e.l);

        // Only do the computation if this is the player.
        if(this.isPlayer) {
            if(snap.t.e.e && snap.t.e.e != this.experience) {
                this.experience = parseInt(snap.t.e.e);
                this.experienceNeedsUpdate = true;
                this.updateExperience();
            }

            if(snap.t.e.p.fr && snap.t.e.p.fr != this.points.fireRate) this.points.fireRate = parseInt(snap.t.e.p.fr);
            if(snap.t.e.p.ds && snap.t.e.p.ds != this.points.distance) this.points.distance = parseInt(snap.t.e.p.ds);
            if(snap.t.e.p.dm && snap.t.e.p.dm != this.points.damage) this.points.damage = parseInt(snap.t.e.p.dm);
        }
    }
}

Entity.prototype.addChildren = function(entity) {
    // Remove entity from its previous parent.
    this.children[entity.id] = entity;
    entity.parent = this;
}

Entity.prototype.hasChild = function(id) {
    for (key in this.children) if(this.children[key].id == id) return true;
    return false;
}

Entity.prototype.deltaCompare = function(old, fresh) {
    if(this.last[old] != fresh && this.muted.indexOf(old) < 0) {
        this.last[old] = fresh;
        return fresh;
    }
    return undefined;
}

Entity.prototype.deltaTypeCompare = function(old, fresh) {
    if(this.lastType[old] != fresh) {
        this.lastType[old] = fresh;
        return fresh;
    }
    return undefined;
}

Entity.prototype.worldPos = function() {
    let pos = new THREE.Vector3();
    pos.copy(this.position);
    if(this.parent) {
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.parent.rotation);
        pos.add(this.parent.worldPos());
    }
    return pos;
}

// Turns a world coordinate into our local coordinate space (subtract rotation, set relative).
Entity.prototype.toLocal = function(coord) {
    let pos = new THREE.Vector3();

    pos.copy(coord);
    pos.sub(this.position);
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.rotation);

    return pos;
}

Entity.prototype.onDestroy = function() {
    if(this.parent) {
        let parent = this.parent;
        if(parent.children[this.id]) delete parent.children[this.id];
    }

    this.onClientDestroy();
    if(sceneCanBalls[this.id]) delete sceneCanBalls[this.id];
    if(sceneLines[this.id]) delete sceneLines[this.id];
}

let isEmpty = function(obj) {
    // Check if object is completely empty.
    if(Object.keys(obj).length == 0 && obj.constructor == Object) return true;

    // Check if object is full of undefined.
    for (let i in obj) if(obj.hasOwnProperty(i) && obj[i]) return false;
    return true;
}

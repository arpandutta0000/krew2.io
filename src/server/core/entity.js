function Entity() {

}

Entity.prototype.createProperties = function() {
    // Each and every thing in the game has a position and a velocity.
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Everything has a size and rotation (y-axis), and in terms of logic, everything is a box.
    this.size = new THREE.Vector3(1, 1, 1);
    this.rotation = 0;
    this.collisionRadius = 1;

    // Things can have a parent entity, for example a boat, which is a relative anchor in the world. Things that don't have a parent float freely.
    this.parent = undefined;
    this.children = {}

    // If this is a new guy entering the server.
    this.isNew = true;

    // Things have a netcode type.
    this.netType = -1;

    // Last snap stores information to be able to get delta snaps.
    this.sendSnap = true; // Decide if we want to send the snapshots (full entity info) once a second.
    this.sendDelta = true; //Decide if we want to send the delta information if there is a change (up to 10 times a second).

    // If this is set to true, but sendSnap isn't, then it will simply send hte first delta as a full snap (good for things that only send their creation).
    this.sendCreationSnapOnDelta = true;

    // True to disable snap and delta completely.
    this.disableSnapAndDelta = false;

    this.last = {}
    this.lastType = {}

    // Some entities have muted netcode parts.
    this.muted = []
}

Entity.prototype.tick = function(dt) {
    // Compute the base class logic. This is set by the children classes.
    this.logic(dt);

    // Move ourselves by the current speed.
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
}

// Function that generates a snapshot.
Entity.prototype.getSnap = force => {
    if(!force && !this.sendSnap || this.disableSnapAndDelta) return undefined;
    if(this.rotation == undefined) console.log(this); // Bots don't have a rotation so this fails.

    let snap = {
        p: this.parent ? this.parent.id: undefined,
        n: this.netType, // netcode id is for entity type (i.e. 0 = player)
        x: this.position.x.toFixed(2), // x and z position relative to parent
        y: this.position.y.toFixed(2),
        z: this.position.z.toFixed(2),
        r: (this.rotation || 0).toFixed(2), // Rotation
        t: this.getTypeSnap() // Type-based snapshot data.
    }

    // Pass name variable if we're creating this entity for the first time.
    if(this.netType == 0 && this.isNew) {
        snap.name = this.name;
        snap.id = this.id;
        this.isNew = false;
    }
    return snap;
}

// Function that generates a snapshot.
Entity.prototype.getDelta = () => {
    if(!this.sendDelta && !this.sendCreationSnapOnDelta || this.disableSnapAndDelta) return undefined;

    // Send a full snapshot on the delta data, for creation.
    if(this.sendCreationSnapOnDelta) {
        let result = this.getSnap(true);
        this.sendCreationSnapOnDelta = false;
        return result;
    }

    let delta = {
        p: this.deltaCompare(`p`, this.parent ? this.parent.id: undefined),
        n: this.deltaCompare(`n`, this.netType),
        x: this.deltaCompare(`x`, this.position.x.toFixed(2)),
        y: this.deltaCompare(`y`, this.position.y.toFixed(2)),
        z: this.deltaCompare(`z`, this.position.z.toFixed(2)),
        r: this.deltaCompare(`r`, this.rotation.toFixed(2)),
        t: this.getTypeDelta()
    }

    if(isEmpty(delta)) delta = undefined;
    return delta;
}

// Function that parses a snapshot.
Entity.prototype.parseSnap = (snap, id) => {
    if(snap.t != undefined) this.parseTypeSnap(snap.t);

    if(!this.isPlayer) {
        if(snap.x != undefined && typeof(snap.x) == `number`) this.position.x = parseFloat(snap.x);
        if(snap.y != undefined && typeof(snap.y) == `number`) this.position.y = parseFloat(snap.y);
        if(snap.z != undefined && typeof(snap.z) == `number`) this.position.z = parseFloat(snap.z);
        if(snap.r != undefined && typeof(snap.r) == `number`) this.position.r = parseFloat(snap.r);
    }
}

Entity.prototype.addChildren = entity => {
    this.children[entity.id] = entity;
    entity.parent = this;
}

Entity.prototype.hasChild = id => {
    let child = this.children.find(child => child.id == id);
    if(child) return true;
    else return false;
}

Entity.prototype.deltaCompare = (old, fresh) => {
    if(this.last[old] != fresh && this.muted.indexOf(old) < 0) {
        this.last[old] = fresh;
        return fresh;
    }
    return undefined;
}

Entity.prototype.deltaTypeCompare = (old, fresh) => {
    if(this.lastType[old] != fresh) {
        this.lastType[old] = fresh;
        return fresh;
    }
    return undefined;
}

Entity.prototype.worldPos = () => {
    let pos = new THREE.Vector3();
    pos.copy(this.position);
    if(this.parent != undefined) {
        let parent = this.parent;
        if(parent.children[this.id] != undefined) delete parent.children[this.id];
    }
    return pos;
}

// Turns a world coordinate into our local coordinate space (sbutract rotation, set relative).
Entity.prototype.toLocal = coord => {
    let pos = new THREE.Vector3();

    pos.copy(coord);
    pos.sub(this.position);
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.rotation);

    return pos;
}

Entity.prototype.onDestroy = () => {
    if(this.parent != undefined) {
        let parent = this.parent;
        if(parent.children[this.id] != undefined) delete parent.children[this.id];
    }
}

let isEmpty = obj => {
    // Check if object is completely empty.
    if(Object.keys(obj).length == 0 && obj.constructor == Object) return true;

    // Check if object is full of undefined.
    for(let i in obj) {
        if(obj.hasOwnProperty(i) && obj[i] != undefined) return false;
    }
    return true;
}
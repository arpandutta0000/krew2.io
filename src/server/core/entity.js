function Entity () {

}

Entity.prototype.createProperties = function () {
    // Each and every thing in the game has a position and a velocity
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Everything has a size and rotation (y axis), and in terms of logic, everything is a box
    this.size = new THREE.Vector3(1, 1, 1);
    this.rotation = 0;
    this.collisionRadius = 1;

    // Things can have a parent entity, for example a boat, which is a relative anchor in the world. things that dont have a parent, float freely
    this.parent = undefined;
    this.children = {};

    this.isNew = true; // if this is a new guy entering the server

    // Things have a unique ID, which is used to identify things in the engine and via netcode
    // this.id = "";

    // things have a netcode type
    this.netType = -1;

    // last snap, stores info to be able to get delta snaps
    this.sendSnap = true; // decide if we want to send the snapshots (full entity info) once a second
    this.sendDelta = true; // decide if we want to send the delta information if there is a change (up to 10 times a second)

    // if this is set to true, but sendSnap isnt, then it will simply send the first delta
    // as a full snap (good for things that only sned their creation)
    this.sendCreationSnapOnDelta = true;
    // "true" to disable snap and delta completely
    this.disableSnapAndDelta = false;
    this.last = {};
    this.lastType = {};

    // some entities have muted netcode parts
    this.muted = [];
};

Entity.prototype.tick = function (dt) {
    // compute the base class logic. this is set by the children classes
    this.logic(dt);

    // move ourselves by the current speed
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
};

// function that generates a snapshot
Entity.prototype.getSnap = function (force) {
    if (!force && !this.sendSnap || this.disableSnapAndDelta) {
        return undefined;
    }

    if (this.rotation === undefined) {
        console.log(this); // Bots don't have a rotation so this fails
    }

    let snap = {
        p: this.parent ? this.parent.id : undefined,
        n: this.netType, // netcode id is for entity type (e.g. 0 player)
        x: this.position.x.toFixed(2), // x and z position relative to parent
        y: this.position.y.toFixed(2),
        z: this.position.z.toFixed(2),
        r: (this.rotation || 0).toFixed(2), // rotation
        t: this.getTypeSnap() // type based snapshot data
    };
    // pass name variable if we're first time creating this entity
    if (this.netType === 0 && this.isNew) {
        snap.name = this.name;
        snap.id = this.id;
        snap.playerModel = this.playerModel ? this.playerModel : 0;
        snap.hatModel = this.hatModel ? this.hatModel : 0;
    }
    return snap;
};

// function that generates a snapshot
Entity.prototype.getDelta = function () {
    if (!this.sendDelta && !this.sendCreationSnapOnDelta || this.disableSnapAndDelta) {
        return undefined;
    }

    // send a full snapshot on the delta data, for creation?
    if (this.sendCreationSnapOnDelta) {
        let result = this.getSnap(true);
        this.sendCreationSnapOnDelta = false;
        return result;
    }

    let delta = {
        p: this.deltaCompare(`p`, this.parent ? this.parent.id : undefined),
        n: this.deltaCompare(`n`, this.netType),
        x: this.deltaCompare(`x`, this.position.x.toFixed(2)),
        y: this.deltaCompare(`y`, this.position.y.toFixed(2)),
        z: this.deltaCompare(`z`, this.position.z.toFixed(2)),
        r: this.deltaCompare(`r`, this.rotation.toFixed(2)),
        t: this.getTypeDelta()
    };

    if (isEmpty(delta)) {
        delta = undefined;
    }

    return delta;
};

// function that parses a snapshot
Entity.prototype.parseSnap = function (snap, id) {
    if (snap.t !== undefined) {
        this.parseTypeSnap(snap.t);
    }

    if (!this.isPlayer) {
        if (snap.x !== undefined && typeof (snap.x) === `number`) {
            this.position.x = parseFloat(snap.x);
        }

        if (snap.y !== undefined && typeof (snap.y) === `number`) {
            this.position.y = parseFloat(snap.y);
        }

        if (snap.z !== undefined && typeof (snap.z) === `number`) {
            this.position.z = parseFloat(snap.z);
        }

        if (snap.r !== undefined && typeof (snap.r) === `number`) {
            this.rotation = parseFloat(snap.r);
        }
    }
};

Entity.prototype.addChildren = function (entity) {
    // remove entity from its previous parent
    /* if (entity !== undefined &&
        entity.parent !== undefined
     && entity.parent.children[entity.id] !== undefined)
        entity.parent.children[entity.id] = undefined; */

    this.children[entity.id] = entity;
    entity.parent = this;
};

Entity.prototype.hasChild = function (id) {
    for (key in this.children) {
        if (this.children[key].id === id) {
            return true;
        }
    }

    return false;
};

Entity.prototype.deltaCompare = function (old, fresh) {
    if (this.last[old] !== fresh && this.muted.indexOf(old) < 0) {
        this.last[old] = fresh;
        return fresh;
    }

    return undefined;
};

Entity.prototype.deltaTypeCompare = function (old, fresh) {
    if (this.lastType[old] !== fresh) {
        this.lastType[old] = fresh;
        return fresh;
    }

    return undefined;
};

Entity.prototype.worldPos = function () {
    let pos = new THREE.Vector3();
    pos.copy(this.position);
    if (this.parent !== undefined) {
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.parent.rotation);
        pos.add(this.parent.worldPos());
    }

    return pos;
};

// turns a world coordinate into our local coordinate space (subtract rotation, set relative)
Entity.prototype.toLocal = function (coord) {
    let pos = new THREE.Vector3();
    pos.copy(coord);
    pos.sub(this.position);
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.rotation);
    return pos;
};

Entity.prototype.onDestroy = function () {
    if (this.parent !== undefined) {
        let parent = this.parent;
        if (parent.children[this.id] !== undefined) {
            delete parent.children[this.id];
        }
    }
};

let isEmpty = function (obj) {
    // check if object is completely empty
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
        return true;
    }

    // check if object is full of undefined
    for (p in obj) {
        if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
            return false;
        }
    }

    return true;
};

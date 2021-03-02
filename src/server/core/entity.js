const { entities } = require(`./core.js`);

class Entity {
    constructor () {
        // Entities have a position and velocity.
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Entities have a size and rotation.
        this.size = new THREE.Vector3(1, 1, 1);
        this.rotation = 0;

        // In terms of logic, everything is a box.
        this.collisionRadius = 1;

        // Entities can have children entities.
        this.children = [];

        // Unitialized netType.
        this.netType = -1;

        entities.push(this);
    }

    tick = dt => {
        // Pass through logic.
        this.logic(dt);

        // Move the entity by current velocity.
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
    }

    getSnap = () => {
        const snap = {
            p: this.parent ? this.parent.id : undefined,
            n: this.netType,

            x: this.position.x,
            y: this.position.y,
            z: this.position.z,

            r: this.rotation,
            t: this.getTypeSnap()
        };

        if (this.isNew) {
            snap.id = this.id;
            snap.name = this.name;

            snap.playerModel = this.playerModel || 0;
            snap.hatModel = this.hatModel || 0;
        }

        return snap;
    }

    addChildren (entityId) {
        const entity = entities.find(entity => entity.id === entityId);

        if (!this.children.includes(entity)) {
            this.children.push(entity);
            entity.parent = this.id;
        }
    }

    destroy = () => {
        entities.splice(entities.indexOf(this), 1);
    }
}

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

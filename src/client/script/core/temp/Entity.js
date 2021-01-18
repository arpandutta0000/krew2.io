class Entity {
    constructor() {}

    createProperties() {
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
        this.last = {};
        this.lastType = {};

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

    addChildren(entity) {
        this.children[entity.id] = entity;
        entity.parent = this;
    }

    hasChild(id) {
        for (key in this.children) {
            if (this.children[key].id === id) {
                return true;
            }
        }

        return false;
    }

    getDelta() {
        if (!this.sendDelta && !this.sendCreationSnapOnDelta) {
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
            x: this.deltaCompare(`x`, Number(this.position.x.toFixed(2))),
            y: this.deltaCompare(`y`, Number(this.position.y.toFixed(2))),
            z: this.deltaCompare(`z`, Number(this.position.z.toFixed(2))),
            r: this.deltaCompare(`r`, Number(this.rotation.toFixed(2))),
            t: this.getTypeDelta()
        };

        if (isEmpty(delta)) {
            delta = undefined;
        }

        return delta;
    }

    deltaCompare(old, fresh) {
        if (this.last[old] !== fresh && this.muted.indexOf(old) < 0) {
            this.last[old] = fresh;
            return fresh;
        }

        return undefined;
    }

    deltaTypeCompare(old, fresh) {
        if (this.lastType[old] !== fresh) {
            this.lastType[old] = fresh;
            return fresh;
        }

        return undefined;
    }

    worldPos() {
        let pos = new THREE.Vector3();
        pos.copy(this.position);
        if (this.parent !== undefined) {
            pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.parent.rotation);
            pos.add(this.parent.worldPos());
        }

        return pos;
    }

    toLocal(coord) {
        let pos = new THREE.Vector3();
        pos.copy(coord);
        pos.sub(this.position);
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.rotation);
        return pos;
    }

    parseSnap(snap, id) {
        entitySnap.parseSnap(snap, id, this);
    }

    getSnap(force) {
        entitySnap.getSnap(force, this);
    }

    onDestroy() {
        if (this.parent !== undefined) {
            let parent = this.parent;
            if (parent.children[this.id] !== undefined) {
                delete parent.children[this.id];
            }
        }

        this.onClientDestroy();
        if (sceneCanBalls[this.id] !== undefined)
            delete sceneCanBalls[this.id];

        if (sceneLines[this.id] !== undefined)
            delete sceneLines[this.id];
    }

    tick(dt) {
        this.logic(dt);

        // move ourselves by the current speed
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;

        this.clientlogic(dt);
    }
}

var isEmpty = function (obj) {
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
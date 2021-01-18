/* Main Entity class */

class Entity {
    /* Entity Constructor */
    constructor() {
        // Assign a position and velocity
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Setn size, rotation, and collision radius
        this.size = new THREE.Vector3(1, 1, 1);
        this.rotation = 0;
        this.collisionRadius = 1;

        // Set up parent and children
        this.parent = undefined;
        this.children = {};

        // Set the entity to be a new entity
        this.isNew = true;

        // Create netType (Used for defining the type of entity)
        this.netType = -1;

        // Set sending snap and delta
        this.sendSnap = true; // Send a snapshot (full entity info) once every second
        this.sendDelta = true; // Send the delta information if there is a change (up to 10 times a second)
        this.sendCreationSnapOnDelta = true;
        this.last = {};
        this.lastType = {};

        // Create muted array
        this.muted = [];

        // Set model scales based on model geometry
        this.modelscale = new THREE.Vector3(1, 1, 1);
        this.modeloffset = new THREE.Vector3(0, 0, 0);
        this.modelrotation = new THREE.Vector3(0, 0, 0);
        this.baseGeometry = undefined;
        this.baseMaterial = undefined;
    }

    /* Function to add child entities */
    addChildren(entity) {
        this.children[entity.id] = entity;
        entity.parent = this;
    }

    /* Check if an entity has a child */
    hasChild(id) {
        for (key in this.children) {
            if (this.children[key].id === id) {
                return true;
            }
        }

        return false;
    }

    /* Get delta information */
    getDelta() {
        if (!this.sendDelta && !this.sendCreationSnapOnDelta) {
            return undefined;
        }

        // Send a full snapshot on the delta data
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

    /* Compare deltas */
    deltaCompare(old, fresh) {
        if (this.last[old] !== fresh && this.muted.indexOf(old) < 0) {
            this.last[old] = fresh;
            return fresh;
        }

        return undefined;
    }

    /* Compare delta types*/
    deltaTypeCompare(old, fresh) {
        if (this.lastType[old] !== fresh) {
            this.lastType[old] = fresh;
            return fresh;
        }

        return undefined;
    }

    /* Function to get an entity's world position */
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

    /* Call entity parseSnap function in parseSnap.js */
    parseSnap(snap, id) {
        entitySnap.parseSnap(snap, id, this);
    }

    /* Call entity getSnap function in parseSnap.js */
    getSnap(force) {
        entitySnap.getSnap(force, this);
    }

    /* Destroy the entity */
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

    /* Entity Tick */
    tick(dt) {
        this.logic(dt);

        // Move the entity by it's velocity
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;

        this.clientlogic(dt);
    }
};
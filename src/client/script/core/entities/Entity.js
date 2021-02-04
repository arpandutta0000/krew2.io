/* Main Entity class */

class Entity {
    /* Constructor */
    constructor() {
        // Set netType
        this.netType = -1;

        // Set sending snap and delta
        this.sendSnap = true; // Send a snapshot (full entity info) once every second
        this.sendDelta = true; // Send the delta information if there is a change (up to 10 times a second)
        this.sendCreationSnapOnDelta = true;
        this.last = {};
        this.lastType = {};

        // Create muted array
        this.muted = [];

        // Set up parent and children
        this.parent = undefined;
        this.children = {};

        // Set the entity to be a new entity
        this.isNew = true;

        // Set collision radius
        this.collisionRadius = 1;

        // Assign a position and velocity
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Setn size, and rotation
        this.size = new THREE.Vector3(1, 1, 1);
        this.rotation = 0;

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

    getDelta() {
        return EntityDelta.getDelta(this);
    }

    deltaCompare(old, fresh) {
        return EntityDelta.deltaCompare(old, fresh, this);
    }

    deltaTypeCompare(old, fresh) {
        return EntityDelta.deltaTypeCompare(old, fresh, this);
    }

    parseSnap(snap, id) {
        EntitySnap.parseSnap(snap, id, this);
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

    /* Entity Tick */
    tick(dt) {
        this.logic(dt);

        // Move the entity by it's velocity
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;

        this.clientlogic(dt);
    }
};
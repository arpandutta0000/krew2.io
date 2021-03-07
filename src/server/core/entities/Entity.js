const THREE = require(`../../../client/libs/js/three.min.js`);

const { entities } = require(`../core.js`);
const utils = require(`../utils.js`);

class Entity {
    constructor (x, y, z) {
        // Entities have a position and velocity.
        this.position = new THREE.Vector3(x, y, z);
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

        // Give the entity an identifier and add it to the entity array.
        this.id = utils.randomID();
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

        // If the snap is being created for the first time.
        if (this.isNew) {
            snap.id = this.id;
            snap.name = this.name;

            snap.pM = this.playerModel || 0;
            snap.hM = this.hatModel || 0;

            this.isNew = false;
        }

        return snap;
    }

    addChild = entityId => {
        const entity = entities.find(entity => entity.id === entityId);

        if (entity && !this.children.includes(entity)) {
            this.children.push(entity.id);
            entity.parent = this.id;
        }
    }

    removeChild = entityId => {
        const entity = entities.find(entity => entity.id === entityId);

        if (entity && this.children.includes(entity)) {
            this.children.splice(this.children.indexOf(entity.id), 1);
            entity.parent = undefined;
        }
    }

    localPos = coord => {
        const pos = new THREE.Vector3();

        pos.copy(coord);
        pos.sub(this.position);

        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation * -1);
        return pos;
    }

    destroy = () => {
        entities.splice(entities.indexOf(this), 1);
    }
}

module.exports = Entity;

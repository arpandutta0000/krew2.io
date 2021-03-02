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

        // If the snap is being created for the first time.
        if (this.isNew) {
            snap.id = this.id;
            snap.name = this.name;

            snap.playerModel = this.playerModel || 0;
            snap.hatModel = this.hatModel || 0;

            this.isNew = false;
        }

        return snap;
    }

    addChildren = entityId => {
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

module.exports = Entity;

const THREE = require(`../../../client/libs/js/three.min.js`);
const Entity = require(`./_Entity.js`);

class Impact extends Entity {
    constructor (type, x, z) {
        super(x, 0, z);

        // Network type.
        this.netType = 3;

        // Impacts have their own specific type.
        this.impactType = type;

        // Size of an impact.
        this.size = new THREE.Vector3(1, 1, 1);

        // Timeout.
        this.timeout = 1;
    }

    logic = dt => {
        // Tick down the timer and delete the impact on its conclusion.
        this.timeout -= 0.8 * dt;
        if (this.timeout <= 0) this.destroy();
    }

    getTypeSnap = () => {
        const snap = {
            a: this.impactType
        };

        return snap;
    }
}

module.exports = Impact;

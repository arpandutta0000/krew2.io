const THREE = require(`../../client/libs/js/three.min.js`);
const Entity = require(`./entity.js`);

class Impact extends Entity {
    constructor (type, x, z) {
        super();

        // Network type and impact type.
        this.netType = 3;
        this.impactType = type;

        // Size of an impact.
        this.size = new THREE.Vector3(x, 0, z);

        // Timeout.
        this.timeout = 1;
    }
}

Impact.prototype.logic = function (dt) {
    // tick down the timer and delete on end
    this.timeout -= dt * 0.8;
    if (this.timeout <= 0) {
        removeEntity(this);
    }
};

Impact.prototype.getTypeSnap = function () {
    let snap = {
        a: this.impactType
    };
    return snap;
};

Impact.prototype.getTypeDelta = function () {
    if (!this.spawnPacket) {
        this.spawnPacket = true;
        return this.getTypeSnap();
    }

    return undefined;
};

// function that parses a snapshot
Impact.prototype.parseTypeSnap = function (snap) {
    if (snap.a !== undefined) {
        this.impactType = parseFloat(snap.a);
    }
};

module.exports = Impact;

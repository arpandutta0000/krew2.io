// PLayers are entities, check core_entity.js for the base class
Impact.prototype = new Entity();
Impact.prototype.constructor = Impact;

function Impact (type, x, z) {
    this.createProperties();

    // netcode type
    this.netType = 3;

    // very little net data
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;

    // impact type, there are different impact types (in water, in ship, etc)
    this.impactType = type;

    // // size of a Impact
    this.size = new THREE.Vector3(1, 1, 1);

    // impacts have a timeout
    this.timeout = 1.0;

    // set up references to geometry and material
    this.position.y = 0;

    this.position.x = x;
    this.position.z = z;
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

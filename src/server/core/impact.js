Impact.prototype = new Entity();
Impact.prototype.cosntructor = Impact;

function Impact(type, x, z) {
    this.createProperties();

    // Netcode type.
    this.netType = 3;

    // Net data.
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;

    // Impact type.
    this.impactType = type;

    // Size of an impact.
    this.size = new THREE.Vector3(1, 1, 1);

    // Impacts have a timeout.
    this.timeout = 1.0;

    // Set up references to geometry and material.
    this.position.x = x;
    this.position.y = 0;
    this.position.z = z;
}

Impact.prototype.logic = dt => {
    // Tick down the timer and delet eon end.
    this.timeout -= dt * 0.8;
    if(this.timeout <= 0) removeEntity(this);
}

Impact.prototype.getTypeSnap = () => {
    let snap = { a: this.impactType }
    return snap;
}

Impact.prototype.getTypeDelta = () => {
    if(!this.spawnPacket) {
        this.spawnPacket = true;
        return this.getTypeSnap();
    }
    return undefined;
}

// Function that parses a snapshot.
Impact.prototype.parseTypeSnap = snap => {
    if(snap.a != undefined) this.impactType = parseFloat(snap.a);
}

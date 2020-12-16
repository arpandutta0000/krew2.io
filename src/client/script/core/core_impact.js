// PLayers are entities, check core_entity.js for the base class
Impact.prototype = new Entity();
Impact.prototype.constructor = Impact;

function Impact(type, x, z) {

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

    // impacts have a type (impact in water vs impact in boat)
    switch (type) {
        case 0: {// water

            this.baseGeometry = geometry.impact_water;
            this.baseMaterial = materials.impact_water;
            for (var i = 0; i < 3; ++i) {
                createParticle({
                    vx: -5 + Math.random() * 10,
                    vy: 4 + Math.random() * 2,
                    vz: -5 + Math.random() * 10,
                    x: x,
                    z: z,
                    y: 0,
                    w: 0.3,
                    h: 0.3,
                    d: 0.3,
                    gravity: 5,
                    gravity: 5,
                    rotaSpeed: Math.random() * 20,
                    duration: 5,
                    sizeSpeed: -0.6,
                    material: materials.impact_water,
                    geometry: base_geometries.box,
                });
            }

            break;
        }

        case 1: { // ship
            GameAnalytics("addDesignEvent", "Game:Session:Hit");
            for (var i = 0; i < 5; ++i) {
                createParticle({
                    vx: -10 + Math.random() * 20,
                    vy: 5 + Math.random() * 5,
                    vz: -10 + Math.random() * 20,
                    x: x,
                    z: z,
                    y: 0,
                    w: 0.2 + Math.random() * 0.5,
                    h: 0.2 + Math.random() * 0.5,
                    d: 0.2 + Math.random() * 0.5,

                    gravity: 12,
                    rotaSpeed: Math.random() * 10,
                    duration: 2,
                    sizeSpeed: -0.8,
                    material: materials.splinter,
                    geometry: base_geometries.box,

                });
            }

            break;
        }
    }

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

Impact.prototype.clientlogic = function (dt) {

    if (this.impactType == 0) {
        this.geometry.position.set(this.position.x, this.position.y, this.position.z);
        this.geometry.scale.y = (this.timeout < 0.5 ? Ease.easeOutQuad(this.timeout * 2) : 1.0 - Ease.easeInQuint((this.timeout - 0.5) * 2)) * 5;

        var quad = Ease.easeOutQuad(this.timeout);
        this.geometry.scale.x = 1.5 - quad;
        this.geometry.scale.z = 1.5 - quad;
    }

};

Impact.prototype.getTypeSnap = function () {
    var snap = {
        a: this.impactType,
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
    if (snap.a !== undefined) {this.impactType = parseFloat(snap.a);}
};

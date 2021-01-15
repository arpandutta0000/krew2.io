// PLayers are entities, check core_entity.js for the base class
Landmark.prototype = new Entity();
Landmark.prototype.constructor = Landmark;

function Landmark (type, x, z, config) {
    this.createProperties();

    this.name = config.name || ``;

    // netcode type
    this.netType = 5;

    // landmark type
    this.landmarkType = type;

    // docking / anchoring ?
    this.dockType = 1;
    this.dockRadius = config.dockRadius;
    this.spawnPlayers = config.spawnPlayers;
    this.onlySellOwnShips = config.onlySellOwnShips;

    // net data
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;

    // // size of a Landmark
    this.size = new THREE.Vector3(this.dockRadius, 20, this.dockRadius);

    this.position.x = x;
    this.position.z = z;

    this.collisionRadius = 30;

    // client side visuals
    this.baseGeometry = geometry.island;
    this.baseMaterial = materials.colorset;

    // Palm Tree (Commented out for performance lol)
    // if (this.name === 'Jamaica') {
    //     this.palm = new THREE.Mesh(geometry.palm, materials.colorset);
    //     this.palm.position.set(1250, 0, 1250);
    //     this.palm.scale.x = 8;
    //     this.palm.scale.y = 8;
    //     this.palm.scale.z = 8;
    //     this.palm.castShadow = true;
    //     this.palm.receiveShadow = true;
    //     scene.add(this.palm);
    // }

    // Christmas stuff (add snowman and christmas tree on Jamaica)
    // models.elka.position.set(1240, 2, 1240);
    // models.elka.scale.x = 0.35;
    // models.elka.scale.y = 0.35;
    // models.elka.scale.z = 0.35;
    // models.snowman.position.set(1280, 38, 1285);
    // models.snowman.rotation.set(0, -500, 0);
    // models.snowman.scale.x = 0.17;
    // models.snowman.scale.y = 0.17;
    // models.snowman.scale.z = 0.17;
    // scene.add(models.elka, models.snowman);

    let modelscale = this.dockRadius / 10 / 8 * 9;
    this.modelscale.set(modelscale, modelscale, modelscale);
    this.modeloffset.set(0, 1, 0);

    this.visualCue = new THREE.Mesh(new THREE.RingBufferGeometry(this.dockRadius - 1, this.dockRadius, 30), materials.islandradius);
    this.visualCue.rotation.x = -Math.PI / 2;
    // this.visualCue.scale.set(this.dockRadius, 1, this.dockRadius);
    this.visualCue.position.set(this.position.x, 1, this.position.z);
    this.wavetimer = 0;
    scene.add(this.visualCue);
    this.setName(this.name);
}

Landmark.prototype.setName = function (name) {
    if (this.geometry !== undefined) {
        if (this.label === undefined) {
            // Set the crews name
            this.label = new THREE.TextSprite({
                textSize: 12,
                redrawInterval: config.Labels.redrawInterval,
                texture: {
                    text: name,
                    fontFamily: config.Labels.fontFamily
                },
                material: {
                    color: 0x5e9628,
                    fog: false
                }
            });

            this.label.name = `label`;
            this.label.position.set(0, 42, 0);
            this.geometry.add(this.label);
        }

        this.label.material.map.text = name;
        this.label.visible = this.inRange;
    }

    this.name = name;
};

Landmark.prototype.getTypeSnap = () => {
    let snap = {
        t: this.landmarkType,
        name: this.name,
        dockRadius: this.dockRadius
    };
    return snap;
};

// function that parses a snapshot
Landmark.prototype.parseTypeSnap = function (snap) {
    if (snap.t !== undefined) {
        this.pickupSize = parseInt(snap.t);
    }
};

Landmark.prototype.clientlogic = function (dt) {
    this.wavetimer += dt;
    let scale = 0.5 + Math.sin(this.wavetimer) * 0.5;
    water.position.y = 0.1 + scale * 0.5;
};

Landmark.prototype.logic = function (dt) {
    // if this landmark is a dockable thing (rocks etc dont have docks)
};

Landmark.prototype.isWithinDockingRadius = function (x, z) {
    return distance({
        x: x,
        z: z
    }, this.position) < this.dockRadius - 2;
};

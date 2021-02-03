/* Landmark class */

class Landmark extends Entity {
    /* Constructor */
    constructor(type, x, z, _config) {
        // Inherit parent class methods
        super();

        // Set netType
        this.netType = 5;

        // Set sending snap and delta
        this.sendDelta = false;
        this.sendSnap = false;
        this.sendCreationSnapOnDelta = true;

        // Set landmark name
        this.name = _config.name || ``;
        this.setName(this.name);

        // Set docking radius
        this.dockRadius = _config.dockRadius;
        this.collisionRadius = 30;

        // Set landmark size and position
        this.size = new THREE.Vector3(this.dockRadius, 20, this.dockRadius);
        this.position.x = x;
        this.position.z = z;

        // Set landmark models
        this.baseGeometry = geometry.island;
        this.baseMaterial = materials.colorset;

        // Set model scale
        let modelscale = this.dockRadius / 10 / 8 * 9;
        this.modelscale.set(modelscale, modelscale, modelscale);
        this.modeloffset.set(0, 1, 0);

        // Add docking ring
        this.visualCue = new THREE.Mesh(new THREE.RingBufferGeometry(this.dockRadius - 1, this.dockRadius, 30), materials.islandradius);
        this.visualCue.rotation.x = -Math.PI / 2;
        this.visualCue.position.set(this.position.x, 1, this.position.z);
        scene.add(this.visualCue);

        // Set misc values
        this.landmarkType = type;
        this.wavetimer = 0;

        // Addd decorations
        for (const island of config.palmTree) {
            if (island === this.name) {
                this.palm = new THREE.Mesh(geometry.palm, materials.colorset);
                this.palm.position.set(this.position.x + (this.dockRadius / 4), 0, this.position.z - (this.dockRadius / 1.7));
                this.palm.scale.x = this.dockRadius / 9;
                this.palm.scale.y = this.dockRadius / 9;
                this.palm.scale.z = this.dockRadius / 9;
                scene.add(this.palm);
            }
        };
        for (const island of config.christmasTree) {
            if (island === this.name) {
                this.christmasTree = models.elka;
                this.christmasTree.position.set(this.position.x - (this.dockRadius / 10), (this.dockRadius / 50), this.position.z - (this.dockRadius / 10));
                this.christmasTree.scale.x = this.dockRadius / (100 / 0.35);
                this.christmasTree.scale.y = this.dockRadius / (100 / 0.35);
                this.christmasTree.scale.z = this.dockRadius / (100 / 0.35);
                scene.add(this.christmasTree);
            }
        };
        for (const island of config.snowman) {
            if (island === this.name) {
                this.snowman = models.snowman;
                this.snowman.position.set(this.position.x + (this.dockRadius / (10 / 3)), (this.dockRadius / (100 / 38)), this.position.z + (this.dockRadius / (100 / 35)));
                this.snowman.rotation.set(0, -500, 0);
                this.snowman.scale.x = this.dockRadius / (100 / 0.17);
                this.snowman.scale.y = this.dockRadius / (100 / 0.17);
                this.snowman.scale.z = this.dockRadius / (100 / 0.17);
                scene.add(this.snowman);
            }
        };
    }
};

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

Landmark.prototype.getTypeSnap = function () {
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
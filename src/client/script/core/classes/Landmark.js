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

        // Set landmark type
        this.landmarkType = type;

        // Set dock radius
        this.dockRadius = _config.dockRadius;

        // Set landmark size
        this.size = new THREE.Vector3(this.dockRadius, 20, this.dockRadius);

        // Set landmark position
        this.position.x = x;
        this.position.z = z;

        // Set geometry
        this.baseGeometry = geometry.island;
        this.baseMaterial = materials.colorset;

        // Add decorations
        if (this.name === 'Jamaica') {
            if (config.palmTree) {
                this.palm = new THREE.Mesh(geometry.palm, materials.colorset);
                this.palm.position.set(1250, 0, 1250);
                this.palm.scale.x = 8;
                this.palm.scale.y = 8;
                this.palm.scale.z = 8;
                this.palm.castShadow = true;
                this.palm.receiveShadow = true;
                scene.add(this.palm);
            }

            if (config.christmasTree) {
                models.elka.position.set(1240, 2, 1240);
                models.elka.scale.x = 0.35;
                models.elka.scale.y = 0.35;
                models.elka.scale.z = 0.35;
                scene.add(models.elka);
            }

            if (config.snowman) {
                models.snowman.position.set(1280, 38, 1285);
                models.snowman.rotation.set(0, -500, 0);
                models.snowman.scale.x = 0.17;
                models.snowman.scale.y = 0.17;
                models.snowman.scale.z = 0.17;
                scene.add(models.snowman);
            }
        }

        // Set model scale based on dock radius
        let modelscale = this.dockRadius / 10 / 8 * 9;
        this.modelscale.set(modelscale, modelscale, modelscale);
        this.modeloffset.set(0, 1, 0);

        // Add docking ring
        this.visualCue = new THREE.Mesh(new THREE.RingBufferGeometry(this.dockRadius - 1, this.dockRadius, 30), materials.islandradius);
        this.visualCue.rotation.x = -Math.PI / 2;
        this.visualCue.position.set(this.position.x, 1, this.position.z);
        scene.add(this.visualCue);

        // Set name
        this.setName(this.name);
    }

    /* Function to set landmark name */
    setName(name) {
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
    }

    logic() {}

    clientLogic(dt) {
        LandmarkLogic.clientLogic(dt, this);
    }

    getTypeSnap() {
        LandmarkSnap.getTypeSnap(this);
    }

    parseTypeSnap(snap) {
        LandmarkSnap.parseTypeSnap(snap, this);
    }
};
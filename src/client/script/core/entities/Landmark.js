/**
 * Landmark class
 *
 * @class
 * @extends Entity
 */
class Landmark extends Entity {
    /**
     * Landmark constructor
     *
     * @param {any} type Landmark type
     * @param {number} x Landmark x position
     * @param {number} z Landmark x position
     * @param {object} _config Landmark config (data) object
     */
    constructor (type, x, z, _config) {
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
        this.baseMaterial = materials.island;

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
                this.palm = new THREE.Mesh(geometry.palm, materials.island);
                this.palm.position.set(this.position.x + (this.dockRadius / 4), 0, this.position.z - (this.dockRadius / 1.7));
                this.palm.scale.x = this.dockRadius / 9;
                this.palm.scale.y = this.dockRadius / 9;
                this.palm.scale.z = this.dockRadius / 9;
                scene.add(this.palm);
            }
        }
        for (const island of config.christmasTree) {
            if (island === this.name) {
                this.christmasTree = models.christmasTree;
                this.christmasTree.position.set(this.position.x - (this.dockRadius / 10), (this.dockRadius / 50), this.position.z - (this.dockRadius / 10));
                this.christmasTree.scale.x = this.dockRadius / (100 / 0.35);
                this.christmasTree.scale.y = this.dockRadius / (100 / 0.35);
                this.christmasTree.scale.z = this.dockRadius / (100 / 0.35);
                scene.add(this.christmasTree);
            }
        }
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
        }
    }

    /**
     * Set the landmark's name
     *
     * @param {string} name New landmark name
     */
    setName (name) {
        if (this.geometry !== undefined) {
            if (this.label === undefined) {
                this.label = new THREE.TextSprite({
                    textSize: 12,
                    redrawInterval: config.Labels.redrawInterval,
                    texture: {
                        text: name,
                        fontFamily: config.Labels.fontFamily
                    },
                    material: {
                        color: labelcolors.landmark,
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

    /**
     * Landmark logic method
     *
     * @param {number} dt DT
     */
    logic (dt) {
        LandmarkLogic.logic(dt, this);
    }

    /**
     * Landmark client logic method
     *
     * @param {number} dt DT
     */
    clientlogic (dt) {
        LandmarkLogic.clientlogic(dt, this);
    }

    /**
     * Method to parse a landmark type snap
     *
     * @param {object} snap Snap to be parsed
     */
    parseTypeSnap (snap) {
        LandmarkSnap.parseTypeSnap(snap, this);
    }
}

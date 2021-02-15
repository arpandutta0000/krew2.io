/**
 * Pickup class
 *
 * @class
 * @extends Entity
 */
class Pickup extends Entity {
    /**
     * Pickup constructor
     *
     * @param {number} size Pickup size
     * @param {number} x Pickup x position
     * @param {number} z Pickup y position
     * @param {number} type Pickup type
     */
    constructor (size, x, z, type) {
        // Inherit parent class methods
        super();

        // Set netType
        this.netType = 4;

        // Set sending snap and delta
        this.sendDelta = type !== 1;
        this.sendSnap = type !== 1;
        this.sendCreationSnapOnDelta = true;
        this.spawnPacket = false;

        // Set misc values
        this.pickerId = ``;
        this.type = type;
        this.picking = type === 1;
        this.catchingFish = false;

        // Set pickup size
        let scale = 1;
        if (type === 0) scale = parseInt(size) + 1;
        else if (type === 1) {
            scale = 0.05 * size;
            GameAnalytics(`addDesignEvent`, `Game:Session:CatchFish`);
        } else if (type === 3 || type === 2) scale = 0.02;
        this.size = new THREE.Vector3(scale, scale, scale);
        this.modelscale = new THREE.Vector3(scale, scale, scale);
        this.pickupSize = size;

        // Set position
        this.position.x = x;
        this.position.z = z;

        // Set pickup model
        switch (this.type) {
            case 0: {
                this.baseGeometry = baseGeometry.box;
                this.baseMaterial = materials.crate;
                break;
            }

            case 1: {
                this.baseModel = models.fish;
                this.modeloffset = vectors.modeloffsetFishShellClam;
                break;
            }

            case 2: {
                if (Math.round(Math.random())) {
                    this.baseModel = models.shell;
                    this.modeloffset = vectors.modeloffsetFishShellClam;
                } else {
                    this.baseModel = models.clam;
                    this.modeloffset = vectors.modeloffsetFishShellClam;
                    this.modelscale = new THREE.Vector3(0.03, 0.03, 0.03);
                }
                break;
            }

            case 3: {
                this.baseModel = models.crab;
                this.modeloffset = vectors.modeloffsetCrab;
                this.modelrotation = new THREE.Vector3(0, Math.PI, 0);
                break;
            }

            case 4: {
                this.baseModel = models.chest;
                break;
            }
        }
        if (this.type <= 1 || this.type === 4) {
            this.floattimer = this.type === 0 ? Math.random() * 5 : (Math.random() * 5 + 0.5);
            this.rotationspeed = Math.random() * 0.5 + 0.5;
        } else {
            this.floattimer = 1;
            this.rotationspeed = 0;
        }
    }

    /**
     * Set the pickup name
     */
    setName () {
        if (this.geometry !== undefined) {
            if (this.label === undefined) {
                // Set the name
                this.label = new THREE.TextSprite({
                    textSize: 3,
                    redrawInterval: config.Labels.redrawInterval,
                    texture: {
                        text: this.id,
                        fontFamily: config.Labels.fontFamily
                    },
                    material: {
                        color: labelcolors.player,
                        fog: false
                    }
                });

                this.label.name = `label`;
                this.label.position.set(0, 3, 0);

                this.geometry.add(this.label);
            }

            this.label.material.map.text = this.id;
        }
    }

    /**
     * Get a pickup's delta type
     */
    getTypeDelta () {
        return PickupDelta.getTypeDelta(this);
    }

    /**
     * Pickup logic method
     *
     * @param {number} dt DT
     */
    logic (dt) {
        PickupLogic.logic(dt, this);
    }

    /**
     * Pickup client logic method
     *
     * @param {number} dt DT
     */
    clientlogic (dt) {
        PickupLogic.clientlogic(dt, this);
    }

    /**
     * Pickup docked logic
     */
    dockedLogic () {
        PickupLogic.dockedLogic(this);
    }

    /**
     * Method to parse a pickup type snap
     *
     * @param {object} snap Snap to be parsed
     */
    parseTypeSnap (snap) {
        PickupSnap.parseTypeSnap(snap, this);
    }

    /**
     * Destroy a pickup
     */
    onDestroy () {
        Entity.prototype.onDestroy.call(this);

        if (pickups[this.id]) {
            delete pickups[this.id];
        }
    }
}

Pickup.prototype.timeCounters = {};

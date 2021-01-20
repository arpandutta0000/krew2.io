/* Pickup class */

class Pickup extends Entity {
    /* Constructor */
    constructor(size, x, z, type) {
        // Inherit parent class methods
        super();

        // Set netType
        this.netType = 4;

        // Set sending snap and delta
        this.sendDelta = type !== 1;
        this.sendSnap = type !== 1;
        this.sendCreationSnapOnDelta = true;
        this.spawnPacket = false;

        // Set pickup Size
        this.pickupSize = size;
        let scale = 1;
        if (type === 0) {
            scale = parseInt(size) + 1;
        }

        if (type === 1) {
            scale = 0.05 * size;
            GameAnalytics(`addDesignEvent`, `Game:Session:CatchFish`);
        }

        if (type === 3 || type === 2) {
            scale = 0.02;
        }
        this.size = new THREE.Vector3(scale, scale, scale);
        this.modelscale = new THREE.Vector3(scale, scale, scale);

        // Set Position
        this.position = {};
        this.position.x = x;
        this.position.z = z;

        // Set misc values
        this.pickerId = ``;
        this.type = type;
        this.picking = type === 1;
        this.catchingFish = false;

        // Set model
        switch (type) {
            case (0): {
                this.baseGeometry = geometry.boat;
                this.baseMaterial = materials.crate;

                break;
            }

            case (1): {
                this.baseModel = models.fish;
                this.modeloffset = vectors.modeloffsetFishShellClam;

                break;
            }

            case (2): {
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

            case (3): {
                this.baseModel = models.crab;
                this.modeloffset = vectors.modeloffsetCrab;
                this.modelrotation = new THREE.Vector3(0, Math.PI, 0);

                break;
            }

            case (4): {
                this.baseModel = models.chest;

                break;
            }
        }

        // Set float timer and rotation speed
        if (this.type <= 1 || this.type === 4) {
            this.floattimer = this.type === 0 ? Math.random() * 5 : (Math.random() * 5 + 0.5);
            this.rotationspeed = Math.random() * 0.5 + 0.5;
        } else {
            this.floattimer = 1;
            this.rotationspeed = 0;
        }
    }

    /* Function to set pickuyp name */
    setName() {
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

    getTypeDelta() {
        if (this.type === 1) {
            if (!this.spawnPacket) {
                this.spawnPacket = true;
                return this.getTypeSnap();
            }

            return undefined;
        } else {
            let delta = {
                s: this.deltaTypeCompare(`s`, this.pickupSize),
                p: this.deltaTypeCompare(`p`, this.picking),
                i: this.deltaTypeCompare(`i`, this.pickerId),
                t: this.deltaTypeCompare(`t`, this.type)
            };
            if (isEmpty(delta)) {
                delta = undefined;
            }

            return delta;
        }
    }

    dockedLogic() {
        PickupLogic.dockedLogic(this);
    }

    logic() {}

    clientLogic(dt) {
        PickupLogic.clientLogic(dt, this);
    }

    getTypeSnap() {
        PickupSnap.getTypeSnap(this);
    }

    parseTypeSnap(snap) {
        PickupSnap.parseTypeSnap(snap, this);
    }

    onDestroy() {
        Entity.prototype.onDestroy.call(this);

        if (pickups[this.id]) {
            delete pickups[this.id];
        }
    }
};
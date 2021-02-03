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
                this.baseGeometry = geometry.boat;
                this.baseMaterial = materials.crate;
                break;
            }

            case 1: {
                this.baseModel = models.fish;
                this.modeloffset = vectors.modeloffsetFishShellClam;
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
}

Pickup.prototype.randomTime = function (min, max) {
    return (Math.floor(Math.random() * (max - min)) + min) * 1000;
};

Pickup.prototype.logic = function (dt) {};

Pickup.prototype.timeCounters = {};

Pickup.prototype.dockedLogic = function () {
    let fps = 0.5;

    if (this.timeCounters.dockedLogic === undefined) {
        this.timeCounters.dockedLogic = {
            time: performance.now(),
            previousTime: performance.now()
        };
    } else {
        this.timeCounters.dockedLogic.time = performance.now();
    }

    if (this.timeCounters.dockedLogic.time - this.timeCounters.dockedLogic.previousTime > 1000 / fps) {
        this.timeCounters.dockedLogic.previousTime = this.timeCounters.dockedLogic.time;
        requestAnimationFrame(() => {
            for (let id in entities) {
                let $this = entities[id];
                if (
                    $this.netType === 4 &&
                    ($this.type === 2 || $this.type === 3)
                ) {
                    let Raycaster = new THREE.Raycaster();
                    var origin;
                    var direction;
                    let height = 100;
                    var object;
                    var collision;
                    let objects = [];
                    let min = {
                        object: undefined,
                        height: height
                    };
                    let i = 0;
                    let y = 0;

                    if (entities) {
                        direction = new THREE.Vector3(0, -1, 0);
                        origin = $this.geometry.position.clone();
                        origin.set(origin.x, height, origin.z);

                        Raycaster.set(origin, direction);

                        for (let k in entities) {
                            if (entities[k].netType === 5) {
                                objects.push(entities[k].geometry.children[0]);
                            }
                        }

                        collision = Raycaster.intersectObjects(objects);

                        if (collision.length > 0) {
                            for (; i < collision.length; i++) {
                                if (collision[i].distance < min.height) {
                                    min = {
                                        height: collision[i].distance,
                                        object: collision[i].object
                                    };
                                }
                            }

                            y = height - min.height;
                        }

                        $this.position.y = y;
                        $this.actualY = y;
                        $this.geometry.position.setY(y);
                    }
                }
            }
        });
    }
};

Pickup.prototype.clientlogic = function (dt) {
    this.floattimer += dt * 3;
    this.geometry.rotation.x += dt * this.rotationspeed;
    this.geometry.rotation.z += dt * this.rotationspeed;

    if (this.picking === true && entities[this.pickerId]) {
        // Reduce cargo scale and move it towards player
        if (entities[this.pickerId].geometry) {
            let pickerPos = entities[this.pickerId].geometry.getWorldPosition(new THREE.Vector3());

            if (this.type === 0 || this.type === 4) {
                this.geometry.translateOnAxis(this.geometry.worldToLocal(pickerPos), 0.05);
                this.geometry.scale.set(this.geometry.scale.x - 0.05, this.geometry.scale.y - 0.05, this.geometry.scale.z - 0.05);
                if (myPlayer && this.pickerId === myPlayer.id && this.geometry.scale.x <= 0.05 && this.geometry.scale.x > 0) {
                    ui.playAudioFile(false, `get-crate`);
                }
            }

            if (this.type === 1) {
                if (!this.catchingFish)
                    this.geometry.position.y += 0.5;
                else
                    this.geometry.translateOnAxis(this.geometry.worldToLocal(pickerPos), 0.05);

                if (this.geometry.position.y >= 20) {
                    this.catchingFish = true;
                    if (myPlayer && this.pickerId === myPlayer.id)
                        ui.playAudioFile(false, `catch-fish`);
                }

                this.geometry.scale.set(this.geometry.scale.x - 0.009, this.geometry.scale.y - 0.009, this.geometry.scale.z - 0.009);
            }

            if (this.type === 2) {
                this.geometry.translateOnAxis(this.geometry.worldToLocal(pickerPos), 0.05);
                this.geometry.scale.set(this.geometry.scale.x - 0.05, this.geometry.scale.y - 0.05, this.geometry.scale.z - 0.05);

                if ((entities[this.pickerId] !== undefined && entities[this.pickerId].gold > 500 &&
                        (!entities[this.pickerId].ownsCannon || !entities[this.pickerId].ownsFishingRod ||
                            (entities[this.pickerId].parent !== undefined &&
                                entities[this.pickerId].parent.netType !== 1))
                    )) {
                    ui.hideSuggestionBox = false;
                }
            }

            if (this.type === 3) {
                this.geometry.translateOnAxis(this.geometry.worldToLocal(pickerPos), 0.05);
                this.geometry.scale.set(this.geometry.scale.x - 0.05, this.geometry.scale.y - 0.05, this.geometry.scale.z - 0.05);

                if (myPlayer && this.pickerId === myPlayer.id)
                    ui.playAudioFile(false, `catch-crab`);

                if ((entities[this.pickerId] !== undefined && entities[this.pickerId].gold > 500 &&
                        (!entities[this.pickerId].ownsCannon || !entities[this.pickerId].ownsFishingRod ||
                            (entities[this.pickerId].parent !== undefined &&
                                entities[this.pickerId].parent.netType !== 1))
                    )) {
                    ui.hideSuggestionBox = false;
                }
            }
        }
    } else {
        if (this.type === 2 || this.type === 3) {
            // this.setName();
            this.dockedLogic();
        }

        if (this.type === 3) {
            if (this.geometry !== undefined) {
                if (
                    Math.round(this.geometry.position.x) !== Math.round(this.position.x) ||
                    Math.round(this.geometry.position.z) !== Math.round(this.position.z)
                ) {
                    this.geometry.lookAt(this.position.x, this.actualY || this.position.y, this.position.z);

                    if (Math.round(this.geometry.position.x) !== Math.round(this.position.x)) {
                        this.geometry.position.setX(
                            lerp(
                                this.geometry.position.x,
                                this.position.x,
                                0.01
                            )
                        );
                    }

                    if (Math.round(this.geometry.position.z) !== Math.round(this.position.z)) {
                        this.geometry.position.setZ(
                            lerp(
                                this.geometry.position.z,
                                this.position.z,
                                0.01
                            )
                        );
                    }
                }
            }
        }
    }
};

Pickup.prototype.setName = function () {
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
};

Pickup.prototype.getTypeSnap = function () {
    let snap = {
        s: this.pickupSize,
        p: this.picking,
        i: this.pickerId,
        t: this.type

    };
    return snap;
};

Pickup.prototype.getTypeDelta = function () {
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
};

// function that parses a snapshot
Pickup.prototype.parseTypeSnap = function (snap) {
    if (snap.s !== undefined && snap.s !== this.pickupSize) {
        this.pickupSize = parseInt(snap.s);
    }

    if (snap.p !== undefined && snap.p !== this.picking) {
        this.picking = parseBool(snap.p);
    }

    if (snap.i !== undefined && snap.i !== this.pickerId) {
        this.pickerId = snap.i;
    }

    if (snap.t !== undefined && snap.t !== this.type) {
        this.type = parseInt(snap.t);
    }
};

// function that parses a snapshot
Pickup.prototype.onDestroy = function () {
    // make sure to also call the entity ondestroy
    Entity.prototype.onDestroy.call(this);

    if (pickups[this.id]) {
        delete pickups[this.id];
    }
};
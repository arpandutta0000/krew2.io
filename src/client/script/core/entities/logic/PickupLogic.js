let PickupLogic = {
    /**
     * Pickup logic method
     *
     * @param {number} dt DT
     * @param {object} _this Pickup object
     */
    logic: (dt, _this) => {},

    /**
     * Pickup client logic method
     *
     * @param {number} dt DT
     * @param {object} _this Pickup object
     */
    clientlogic: (dt, _this) => {
        _this.floattimer += dt * 3;
        _this.geometry.rotation.x += dt * _this.rotationspeed;
        _this.geometry.rotation.z += dt * _this.rotationspeed;

        if (_this.picking === true && entities[_this.pickerId]) {
            // Reduce cargo scale and move it towards player
            if (entities[_this.pickerId].geometry) {
                let pickerPos = entities[_this.pickerId].geometry.getWorldPosition(new THREE.Vector3());

                if (_this.type === 0 || _this.type === 4) {
                    _this.geometry.translateOnAxis(_this.geometry.worldToLocal(pickerPos), 0.05);
                    _this.geometry.scale.set(_this.geometry.scale.x - 0.05, _this.geometry.scale.y - 0.05, _this.geometry.scale.z - 0.05);
                    if (myPlayer && _this.pickerId === myPlayer.id && _this.geometry.scale.x <= 0.05 && _this.geometry.scale.x > 0) {
                        audio.playAudioFile(false, false, 1, `get-crate`);
                    }
                }

                if (_this.type === 1) {
                    if (!_this.catchingFish)
                        _this.geometry.position.y += 0.5;
                    else
                        _this.geometry.translateOnAxis(_this.geometry.worldToLocal(pickerPos), 0.05);

                    if (_this.geometry.position.y >= 20) {
                        _this.catchingFish = true;
                        if (myPlayer && _this.pickerId === myPlayer.id)
                            audio.playAudioFile(false, false, 1, `catch-fish`);
                    }

                    _this.geometry.scale.set(_this.geometry.scale.x - 0.009, _this.geometry.scale.y - 0.009, _this.geometry.scale.z - 0.009);
                }

                if (_this.type === 2) {
                    _this.geometry.translateOnAxis(_this.geometry.worldToLocal(pickerPos), 0.05);
                    _this.geometry.scale.set(_this.geometry.scale.x - 0.05, _this.geometry.scale.y - 0.05, _this.geometry.scale.z - 0.05);

                    if ((entities[_this.pickerId] !== undefined && entities[_this.pickerId].gold > 500 &&
                            (!entities[_this.pickerId].ownsCannon || !entities[_this.pickerId].ownsFishingRod ||
                                (entities[_this.pickerId].parent !== undefined &&
                                    entities[_this.pickerId].parent.netType !== 1))
                    )) {
                        ui.hideSuggestionBox = false;
                    }
                }

                if (_this.type === 3) {
                    _this.geometry.translateOnAxis(_this.geometry.worldToLocal(pickerPos), 0.05);
                    _this.geometry.scale.set(_this.geometry.scale.x - 0.05, _this.geometry.scale.y - 0.05, _this.geometry.scale.z - 0.05);

                    if (myPlayer && _this.pickerId === myPlayer.id)
                        audio.playAudioFile(false, false, 1, `catch-crab`);

                    if ((entities[_this.pickerId] !== undefined && entities[_this.pickerId].gold > 500 &&
                            (!entities[_this.pickerId].ownsCannon || !entities[_this.pickerId].ownsFishingRod ||
                                (entities[_this.pickerId].parent !== undefined &&
                                    entities[_this.pickerId].parent.netType !== 1))
                    )) {
                        ui.hideSuggestionBox = false;
                    }
                }
            }
        } else {
            if (_this.type === 2 || _this.type === 3) {
                _this.dockedLogic();
            }

            if (_this.type === 3) {
                if (_this.geometry !== undefined) {
                    if (
                        Math.round(_this.geometry.position.x) !== Math.round(_this.position.x) ||
                        Math.round(_this.geometry.position.z) !== Math.round(_this.position.z)
                    ) {
                        _this.geometry.lookAt(_this.position.x, _this.actualY || _this.position.y, _this.position.z);

                        if (Math.round(_this.geometry.position.x) !== Math.round(_this.position.x)) {
                            _this.geometry.position.setX(
                                lerp(
                                    _this.geometry.position.x,
                                    _this.position.x,
                                    0.01
                                )
                            );
                        }

                        if (Math.round(_this.geometry.position.z) !== Math.round(_this.position.z)) {
                            _this.geometry.position.setZ(
                                lerp(
                                    _this.geometry.position.z,
                                    _this.position.z,
                                    0.01
                                )
                            );
                        }
                    }
                }
            }
        }
    },

    /**
     * Pickup docked logic
     *
     * @param {object} _this Pickup object
     */
    dockedLogic: (_this) => {
        let fps = 0.5;

        if (_this.timeCounters.dockedLogic === undefined) {
            _this.timeCounters.dockedLogic = {
                time: performance.now(),
                previousTime: performance.now()
            };
        } else {
            _this.timeCounters.dockedLogic.time = performance.now();
        }

        if (_this.timeCounters.dockedLogic.time - _this.timeCounters.dockedLogic.previousTime > 1000 / fps) {
            _this.timeCounters.dockedLogic.previousTime = _this.timeCounters.dockedLogic.time;
            requestAnimationFrame(() => {
                for (let id in entities) {
                    let $_this = entities[id];
                    if (
                        $_this.netType === 4 &&
                        ($_this.type === 2 || $_this.type === 3)
                    ) {
                        let Raycaster = new THREE.Raycaster();
                        let origin;
                        let direction;
                        let height = 100;
                        let collision;
                        let objects = [];
                        let min = {
                            object: undefined,
                            height: height
                        };
                        let i = 0;
                        let y = 0;

                        if (entities) {
                            direction = new THREE.Vector3(0, -1, 0);
                            origin = $_this.geometry.position.clone();
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

                            $_this.position.y = y;
                            $_this.actualY = y;
                            $_this.geometry.position.setY(y);
                        }
                    }
                }
            });
        }
    }
};

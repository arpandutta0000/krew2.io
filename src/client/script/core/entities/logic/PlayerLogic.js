let PlayerLogic = {
    /**
     * Player logic method
     *
     * @param {number} dt DT
     * @param {object} _this Player object
     */
    logic: (dt, _this) => {
        // check if we are the captain of our ship
        _this.oldCaptainState = _this.isCaptain;
        _this.isCaptain = _this.parent && _this.id === _this.parent.captainId;

        // the player movemnt logic is depending on wether the walkSideward / forward buttons are pressed
        let moveVector = new THREE.Vector3(0, 0, 0);
        moveVector.z = -_this.walkForward;
        moveVector.x = _this.walkSideward;

        // _this.changeWeapon();
        // we create a movement vector depending on the walk buttons and normalize it
        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
        }

        // rotate movevector along y rotation of cube
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), _this.rotation);
        _this.velocity = moveVector;

        _this.velocity.x *= 3;
        _this.velocity.z *= 3;

        // collisions (movement restriction when on boat and not anchored/docked yet)
        if (_this.parent) {
            if (_this.parent.netType === 5 || _this.parent.shipState === 3 || _this.parent.shipState === -1) {
                _this.velocity.x *= 2;
                _this.velocity.z *= 2;
            }

            if (_this.parent.netType !== 5 && _this.parent.shipState !== 3 && _this.parent.shipState !== 2 && _this.parent.shipState !== -1 && _this.parent.shipState !== 4) {
                if (_this.position.x > _this.parent.size.x / 2) {
                    _this.position.x = _this.parent.size.x / 2;
                    if (_this.isPlayer)
                        audio.playAudioFile(false, false, 1, `turning`);
                }

                if (_this.position.z > _this.parent.size.z / 2) {
                    _this.position.z = _this.parent.size.z / 2;
                    if (_this.isPlayer)
                        audio.playAudioFile(false, false, 1, `turning`);
                }

                if (_this.position.x < -_this.parent.size.x / 2) {
                    _this.position.x = -_this.parent.size.x / 2;
                    if (_this.isPlayer)
                        audio.playAudioFile(false, false, 1, `turning`);
                }

                if (_this.position.z < -_this.parent.size.z / 2) {
                    _this.position.z = -_this.parent.size.z / 2;
                    if (_this.isPlayer)
                        audio.playAudioFile(false, false, 1, `turning`);
                }

                // oval boat shape collision
                if (_this.parent.arcFront > 0 && _this.position.z > 0) {
                    let bound = _this.parent.size.x / 2 - _this.position.z * _this.parent.arcFront;
                    if (_this.position.x > 0) {
                        if (_this.position.x > bound) {
                            _this.position.x = bound;
                        }
                    } else {
                        if (_this.position.x < -bound) {
                            _this.position.x = -bound;
                        }
                    }
                }
                if (_this.parent.arcBack > 0 && _this.position.z < 0) {
                    let bound = _this.parent.size.x / 2 + _this.position.z * _this.parent.arcBack;
                    if (_this.position.x > 0) {
                        if (_this.position.x > bound) {
                            _this.position.x = bound;
                        }
                    } else {
                        if (_this.position.x < -bound) {
                            _this.position.x = -bound;
                        }
                    }
                }
            }
        }

        // use active thing (e.g. cannonbann fire)
        if (_this.cooldown > 0) {
            _this.cooldown -= dt;
        }

        if (_this.use === true && _this.cooldown <= 0) {
            let attackSpeedBonus = parseFloat((_this.attackSpeedBonus + _this.pointsFormula.getFireRate()) / 100);
            _this.cooldown = _this.activeWeapon === 1 ? 1.1 : (1.5 - attackSpeedBonus).toFixed(2);

            if (_this.activeWeapon === 0 && _this.isPlayer && _this.parent && _this.parent.shipState !== 3 && _this.parent.shipState !== 4)
                audio.playAudioFile(false, true, 1, `cannon`);

            else if (_this.isPlayer && _this.activeWeapon === 1)
                audio.playAudioFile(false, true, 1, `cast-rod`);
        }
        if (!_this.isPlayer) {
            _this.geometry.rotation.x = _this.pitch + _this.rotationOffset;
        }
    },

    /**
     * Player client logic method
     *
     * @param {number} dt DT
     * @param {object} _this Player object
     */
    clientlogic: (dt, _this) => {
        if (_this.isPlayer && !isEmpty(_this.notifiscationHeap)) {
            _this.notifiscation();
        }
        _this.namesLogic();

        // if _this is the player, walk via keyboard
        if (_this.isPlayer) {
            _this.walkForward = 0;
            _this.walkSideward = 0;

            if (keys_walkFwd) {
                _this.walkForward = 1;
            }

            if (keys_walkBwd) {
                _this.walkForward = -1;
            }

            if (keys_walkRight) {
                _this.walkSideward = 1;
            }

            if (keys_walkLeft) {
                _this.walkSideward = -1;
            }

            _this.jumping = keys_jump ? 1 : 0;

            // Handle respawn bug (if player's boat has less than 0 HP and game over modal hasn't showed up)
            if (_this.state === 1 && !$(`#game-over-modal`).is(`:visible`))
                $(`#game-over-modal`).modal(`show`);

            let lookingUpLimit = 1;
            // if the player is respawning, attach the camera again to it and set state to alive.
            if (_this.state === 2) {
                camera.position.set(0, 1, 5);
                camera.rotation.z = 0;
                camera.rotation.y = 0;
                camera.rotation.x = -0.4;
                _this.geometry.add(camera);

                _this.state = 0;
            }

            if (camera.parent === _this.geometry) {
                let lookingDownOffset;
                let cameraPosition = new THREE.Vector3();
                if (_this.activeWeapon !== 2) {
                    if ($(`#fp-mode-button`).is(`:checked`)) {
                        lookingDownOffset = 2 - Math.max(controls.cameraX, 2);
                        cameraPosition = new THREE.Vector3(
                            camera.position.x,
                            1.5 + Math.min(8, Math.max(0, controls.cameraX * 0.5)),
                            1.21 + (lookingDownOffset * 0.21)
                        );
                        if (_this.captainHat != undefined) _this.captainHat.visible = false;
                    } else {
                        lookingDownOffset = 0.2 - Math.max(controls.cameraX, 0.2);
                        cameraPosition = new THREE.Vector3(
                            camera.position.x,
                            (fov >= 1 && fov <= 10 ? fov * 2 : 2) + Math.min((fov >= 1 && fov <= 10 ? fov * 8 : 8), Math.max(0, controls.cameraX * 10)),
                            (fov >= 1 && fov <= 10 ? fov * 8 : 8) + (lookingDownOffset * (fov >= 1 && fov <= 10 ? fov * 8 : 8)));
                        if (_this.captainHat != undefined) _this.captainHat.visible = true;
                    }

                    if (camera.zoom !== 1) {
                        camera.zoom = 1;
                        camera.updateProjectionMatrix();
                        scene.fog.density = 0.007;
                        camera.far = 300;
                    }

                    _this.crosshair.visible = true;
                } else if (_this.activeWeapon === 2) {
                    lookingDownOffset = 2 - Math.max(controls.cameraX, 2);
                    cameraPosition = new THREE.Vector3(
                        camera.position.x,
                        2,
                        -0.01
                    );
                    scene.fog.density = 0.005;
                    camera.far = 450;
                    camera.zoom = controls.zoom + 1.5;
                    camera.updateProjectionMatrix();
                    _this.crosshair.visible = false;
                }

                // myPlayer's cannon rotation
                _this.geometry.rotation.x = lerp(_this.geometry.rotation.x, Math.min(lookingUpLimit, Math.max(-1, controls.cameraX + _this.rotationOffset)), 0.8);

                _this.rotation = controls.cameraY;

                camera.position.lerp(cameraPosition, 1);

                camera.rotation.x = lerp(camera.rotation.x, lookingDownOffset, 1);

                _this.pitch = controls.cameraX;
                _this.crosshair.position.x = camera.position.x;
                _this.crosshair.position.y = camera.position.y + 0.01;
                _this.crosshair.position.z = camera.position.z - 0.4;
            }

            if (controls.isMouseLookLocked) {
                _this.use = controls.lmb;
            } else {
                _this.use = false;
            }
        }

        // jumping
        if (_this.jumping === 1) {
            _this.tryJump();
        }

        _this.jumpVel = _this.jumpVel - 80 * dt;
        _this.jump += _this.jumpVel * dt;

        if (_this.jump < 0) {
            _this.jump = 0.0;
        }

        if (_this.isPlayer && _this.parent) {
            if (_this.parent.shipState === 0 || _this.parent.shipState === 1) {
                if (_this.walkForward !== 0) {
                    audio.playAudioFile(false, false, 1, `step-wood01`);
                }
                if (_this.walkSideward !== 0) {
                    audio.playAudioFile(false, false, 1, `step-wood02`);
                }
            } else {
                if (_this.walkForward !== 0) {
                    audio.playAudioFile(false, false, 1, `step-sand01`);
                }
                if (_this.walkSideward !== 0) {
                    audio.playAudioFile(false, false, 1, `step-sand02`);
                }
            }
        }

        // handle movement around the island if the boat is docked
        if (
            _this.isPlayer &&
            _this.parent &&
            (
                (
                    _this.parent.shipState === 3 ||
                    _this.parent.shipState === 2 ||
                    _this.parent.shipState === -1 ||
                    _this.parent.shipState === 4
                ) ||
                _this.parent.netType === 5
            )
        ) {
            updateKrewList();

            if (!ui.hideSuggestionBox && myPlayer && myPlayer.gold > 500 && !$(`#shopping-modal`).is(`:visible`) && $(`#earn-gold`).is(`:visible`)) $(`#earn-gold`).hide();

            let island = entities[_this.parent.anchorIslandId || _this.parent.id];
            let islandPosition = new THREE.Vector3(0, 0, 0);

            if (_this.parent.netType === 5) {
                let playerPosition = _this.geometry.position.clone();

                islandPosition.y = playerPosition.y;

                let distanceFromIsland = playerPosition.distanceTo(islandPosition);

                if (island.dockRadius - 2 < distanceFromIsland) { // note: players can exploit _this!
                    playerPosition.lerp(islandPosition, 1 - ((island.dockRadius - 2) / distanceFromIsland));

                    _this.position.x = playerPosition.x;
                    _this.position.z = playerPosition.z;
                }
            } else if (_this.parent.netType === 1) {
                let boat = entities[_this.parent.id];
                let playerPosition = _this.geometry.getWorldPosition(new THREE.Vector3()).clone();

                playerPosition = island.geometry.worldToLocal(playerPosition);
                islandPosition.y = playerPosition.y;

                let distanceFromIsland = playerPosition.distanceTo(islandPosition);

                if (island.dockRadius - 2 < distanceFromIsland) {
                    playerPosition.lerp(islandPosition, 1 - ((island.dockRadius - 2.5) / distanceFromIsland));
                    playerPosition = island.geometry.localToWorld(playerPosition);
                    playerPosition = boat.geometry.worldToLocal(playerPosition);
                    _this.position.x = playerPosition.x;
                    _this.position.z = playerPosition.z;
                }
            }
        }

        _this.dockedLogic();

        _this.geometry.position.set(
            _this.position.x,
            _this.position.y + _this.jump,
            _this.position.z
        );
        _this.geometry.rotation.y = _this.rotation;

        if (_this.weapon !== undefined) {
            if (_this.activeWeapon === 1) {
                _this.weapon.rotation.x += dt * _this.rodRotationSpeed;

                if (_this.weapon.rotation.x > 0.75) {
                    _this.weapon.rotation.x = 0;
                }
            } else {
                _this.weapon.rotation.x = -_this.rotationOffset + 0.1;
            }
        }

        // check if we turned into the captain (or lost captainship)
        if (_this.isCaptain !== _this.oldCaptainState) {
            if (_this.parent && _this.isPlayer && !_this.isCaptain) {
                notifications.showCenterMessage(`You are not the captain anymore!`, 4, 4000);
                if (_this.parent.shipState === 3 || _this.parent.shipState === 4 || _this.parent.shipState === -1) {
                    $(`#toggle-shop-modal-button`).removeClass(`disabled`).addClass(`enabled`);
                    $(`#toggle-krew-list-modal-button`).removeClass(`disabled`).addClass(`enabled`);
                    $(`#exit-island-button`).hide();
                    $(`#toggle-invite-link-button`).show();
                    $(`#quests-button`).show();
                } else {
                    $(`#toggle-shop-modal-button`).removeClass(`enabled`).addClass(`disabled`);
                    $(`#toggle-krew-list-modal-button`).removeClass(`enabled`).addClass(`disabled`);
                }

                if (_this.parent.shipState === 1) {
                    $(`#docking-modal`).hide();
                }

                $(`#abandon-ship-button`).show();
            }
            if (_this.parent && _this.isPlayer && _this.isCaptain) {
                notifications.showCenterMessage(`You are the captain now!`, 4, 4000);

                if (_this.parent.shipState === 3 || _this.parent.shipState === 4 || _this.parent.shipState === -1) {
                    $(`#toggle-shop-modal-button`).removeClass(`disabled`).addClass(`enabled`);
                    $(`#toggle-krew-list-modal-button`).removeClass(`disabled`).addClass(`enabled`);
                    $(`#exit-island-button`).show();
                    $(`#toggle-invite-link-button`).show();
                    $(`#quests-button`).show();
                } else {
                    $(`#toggle-shop-modal-button`).removeClass(`enabled`).addClass(`disabled`);
                    $(`#toggle-krew-list-modal-button`).removeClass(`enabled`).addClass(`disabled`);
                }

                if (_this.parent.shipState === 1) {
                    $(`#docking-modal`).show();
                }

                $(`#abandon-ship-button`).hide();
            }

            if (_this.isCaptain) {
                _this.playerBody.add(_this.captainHat);
            } else {
                _this.playerBody.remove(_this.playerBody.getObjectByName(`captainHat`));
            }
        }
    },

    /**
     * Player names logic method
     *
     * @param {object} _this Player object
     */
    namesLogic: (_this) => {
        if (_this.isPlayer) {
            let fps = 5;

            if (_this.timeCounters.namesLogic === undefined) {
                _this.timeCounters.namesLogic = {
                    time: performance.now(),
                    previousTime: performance.now()
                };
            } else {
                _this.timeCounters.namesLogic.time = performance.now();
            }

            if (_this.timeCounters.namesLogic.time - _this.timeCounters.namesLogic.previousTime > 1000 / fps) {
                _this.timeCounters.namesLogic.previousTime = _this.timeCounters.namesLogic.time;
                requestAnimationFrame(() => {
                    // Call the getWorldPosition method of the camera just once
                    // for optimization
                    let cameraWorldPosition = camera.getWorldPosition(new THREE.Vector3());

                    // Check distance between each player/boat and camera in world position.
                    // And set if is in the players vision range
                    for (let id in entities) {
                        if (
                            entities[id].netType === 0 ||
                            entities[id].netType === 1 ||
                            entities[id].netType === 5
                        ) {
                            let actualDistance = distance(
                                cameraWorldPosition,
                                entities[id].geometry.getWorldPosition(new THREE.Vector3())
                            );
                            let length = _this.activeWeapon === 2 ? camera.far : config.Labels.distanceMultiplier[entities[id].netType];

                            entities[id].inRange = actualDistance <= length;

                            if (config.setProperties.inVision) {
                                entities[id].inVision = entities[id].inRange && inPlayersVision(entities[id], camera);
                            }

                            if (entities[id].netType === 0) {
                                entities[id].setName(entities[id].name);
                            }

                            if (entities[id].netType === 1) {
                                entities[id].setName(entities[id].crewName);
                            }

                            if (entities[id].netType > 1) {
                                entities[id].setName(entities[id].name);
                            }
                        }
                    }
                });
            }
        }
    },

    /**
     * Player docked logic
     *
     * @param {object} _this Player object
     */
    dockedLogic: (_this) => {
        if (_this.isPlayer) {
            let fps = 20;

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

                let origin;
                let direction;
                let height = 100;
                let object;
                let collision;
                let objects = [];
                let min = {
                    object: undefined,
                    height: height
                };
                let i = 0;
                let y = 0;

                if (
                    _this.parent &&
                    entities
                ) {
                    direction = new THREE.Vector3(0, -1, 0);
                    origin = _this.geometry.getWorldPosition(new THREE.Vector3()).clone();
                    origin.set(origin.x, height, origin.z);

                    let PlayerRaycaster = new THREE.Raycaster();
                    PlayerRaycaster.set(origin, direction);

                    if (_this.parent) {
                        if (_this.parent.anchorIslandId && entities[_this.parent.anchorIslandId]) {
                            objects.push(entities[_this.parent.anchorIslandId].geometry.children[0]);
                            if (entities[_this.parent.anchorIslandId].palm) {
                                objects.push(entities[_this.parent.anchorIslandId].palm);
                            }
                        }

                        if (entities[_this.parent.id] !== undefined) {
                            if (entities[_this.parent.id].netType === 5) {
                                objects.push(entities[_this.parent.id].geometry.children[0]);
                                if (entities[_this.parent.id].palm) {
                                    objects.push(entities[_this.parent.id].palm);
                                }
                            }

                            if (
                                entities[_this.parent.id].netType === 1 &&
                                entities[_this.parent.id].mast !== undefined
                            ) {
                                objects.push(entities[_this.parent.id].geometry.getObjectByName(`body`));
                            }
                        }
                    }

                    collision = PlayerRaycaster.intersectObjects(objects);

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

                    if (min.object && min.object.name === `body`) {
                        y -= entities[_this.parent.id].getHeightAboveWater();
                        let right = _this.position.x < 0;
                        let halfWidth = boatTypes[entities[_this.parent.id].shipclassId].width / 2;

                        if (_this.position.x !== 0) {
                            if (_this.isCaptain) {
                                y += Math.abs(entities[_this.parent.id].leanvalue / 2);
                            } else {
                                if (right) {
                                    y -= (entities[_this.parent.id].leanvalue / 2) * (Math.abs(_this.position.x) / halfWidth);
                                } else {
                                    y += (entities[_this.parent.id].leanvalue / 2) * (Math.abs(_this.position.x) / halfWidth);
                                }
                            }
                        }
                    }

                    if (
                        min.object &&
                        min.object.name !== `body` &&
                        entities[_this.parent.id] !== undefined &&
                        entities[_this.parent.id].netType === 1
                    ) {
                        y -= entities[_this.parent.id].getHeightAboveWater();
                    }

                    _this.position.y = y;
                }
            }
        }
    }
};

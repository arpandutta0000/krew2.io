let lookingDownLimit = -1;
let lookingUpLimit = 1;
let currControls = new GameControls();
let lastCheck = Date.now();
let refreshTimer = 0; // used to handle refreshing krew list
let playerModels = [];
let PlayerRaycaster = new THREE.Raycaster();

let setPlayerModels = function () {
    materials.seadog = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.seadog
    });

    materials.shibainu = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.shibainu
    });

    materials.arcticwolf = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.arcticwolf
    });

    materials.seafox = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.seafox
    });

    materials.krewmate = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.krewmate
    });

    let seadogModel = new THREE.Mesh(geometry.seadog, materials.seadog);
    let shibainuModel = new THREE.Mesh(geometry.shibainu, materials.shibainu);
    let arcticwolfModel = new THREE.Mesh(geometry.arcticwolf, materials.arcticwolf);
    let seafoxModel = new THREE.Mesh(geometry.seafox, materials.seafox);
    let krewmateModel = new THREE.Mesh(geometry.krewmate, materials.krewmate);

    seadogModel.castShadow = true;
    shibainuModel.castShadow = true;
    arcticwolfModel.castShadow = true;
    seafoxModel.castShadow = true;
    krewmateModel.castShadow = true;

    seadogModel.receiveShadow = true;
    shibainuModel.receiveShadow = true;
    arcticwolfModel.receiveShadow = true;
    seafoxModel.receiveShadow = true;
    krewmateModel.receiveShadow = true;

    playerModels.push({
        body: seadogModel,
        scale: new THREE.Vector3(0.04, 0.04, 0.04),
        offset: new THREE.Vector3(0, -0.4, 0.8),
        rotation: new THREE.Vector3(0.4, Math.PI, 0)
    });

    playerModels.push({
        body: shibainuModel,
        scale: new THREE.Vector3(0.04, 0.04, 0.04),
        offset: new THREE.Vector3(0, -0.4, 0.8),
        rotation: new THREE.Vector3(0.4, Math.PI, 0)
    });

    playerModels.push({
        body: arcticwolfModel,
        scale: new THREE.Vector3(0.04, 0.04, 0.04),
        offset: new THREE.Vector3(0, -0.4, 0.8),
        rotation: new THREE.Vector3(0.4, Math.PI, 0)
    });

    playerModels.push({
        body: seafoxModel,
        scale: new THREE.Vector3(0.04, 0.04, 0.04),
        offset: new THREE.Vector3(0, -0.4, 0.8),
        rotation: new THREE.Vector3(0.4, Math.PI, 0)
    });

    playerModels.push({
        body: krewmateModel,
        scale: new THREE.Vector3(0.04, 0.04, 0.04),
        offset: new THREE.Vector3(0, -0.4, 0.8),
        rotation: new THREE.Vector3(0.4, Math.PI, 0)
    });
};

Player.prototype.timeCounters = {};

Player.prototype.namesLogic = function () {
    if (this.isPlayer) {
        let fps = 5;
        let _this = this;

        if (this.timeCounters.namesLogic === undefined) {
            this.timeCounters.namesLogic = {
                time: performance.now(),
                previousTime: performance.now()
            };
        } else {
            this.timeCounters.namesLogic.time = performance.now();
        }

        if (this.timeCounters.namesLogic.time - this.timeCounters.namesLogic.previousTime > 1000 / fps) {
            this.timeCounters.namesLogic.previousTime = this.timeCounters.namesLogic.time;
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
                        let length = CONFIG.Labels.distanceMultiplier[entities[id].netType];

                        entities[id].inRange = actualDistance <= length;

                        // Do not set this property if it does not used for better performance
                        if (CONFIG.setProperties.inVision) {
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
};

Player.prototype.dockedLogic = function () {
    if (this.isPlayer) {
        let fps = 20;
        let _this = this;

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
                    y -= boatTypes[entities[_this.parent.id].shipclassId].baseheight;
                    right = _this.position.x < 0;
                    halfWidth = boatTypes[entities[_this.parent.id].shipclassId].width / 2;

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
                    y -= boatTypes[entities[_this.parent.id].shipclassId].baseheight;
                }

                _this.position.y = y;
            }
        }
    }
};

Player.prototype.clientlogic = function (dt) {
    if (this.isPlayer && !isEmpty(this.notifiscationHeap)) {
        this.notifiscation();
    }
    this.namesLogic();

    // if this is the player, walk via keyboard
    if (this.isPlayer) {
        this.walkForward = 0;
        this.walkSideward = 0;

        if (keys_walkFwd) {
            this.walkForward = 1;
        }

        if (keys_walkBwd) {
            this.walkForward = -1;
        }

        if (keys_walkRight) {
            this.walkSideward = 1;
        }

        if (keys_walkLeft) {
            this.walkSideward = -1;
        }

        this.jumping = keys_jump ? 1 : 0;

        // Handle respawn bug (if player's boat has less than 0 HP and game over modal hasn't showed up)
        if (this.state === 1 && !$(`#game-over-modal`).is(`:visible`))
            $(`#game-over-modal`).modal(`show`);

        // if the player is respawning, attach the camera again to it and set state to alive.
        if (this.state === 2) {
            camera.position.set(0, 1, 5);
            camera.rotation.z = 0;
            camera.rotation.y = 0;
            camera.rotation.x = -0.4;
            this.geometry.add(camera);

            this.state = 0;
        }

        if (camera.parent === this.geometry) {
            let lookingDownOffset;
            let cameraPosition = new THREE.Vector3();
            if (this.activeWeapon !== 2) {
                // to overcome discrepancy between cannon's angle of aim, and the actual angle of projectile
                if ($(`#fp-mode-button`).is(`:checked`)) {
                    lookingDownOffset = 2 - Math.max(controls.cameraX, 2);
                    cameraPosition = new THREE.Vector3(
                        camera.position.x,
                        1.5 + Math.min(8, Math.max(0, controls.cameraX * 0.5)),
                        1.21 + (lookingDownOffset * 0.21));
                } else {
                    lookingDownOffset = 0.2 - Math.max(controls.cameraX, 0.2);
                    cameraPosition = new THREE.Vector3(
                        camera.position.x,
                        2 + Math.min(8, Math.max(0, controls.cameraX * 10)),
                        8 + (lookingDownOffset * 8));
                }

                if (camera.zoom === 4) {
                    camera.zoom = 1;
                    camera.updateProjectionMatrix();
                    scene.fog.density = 0.007;
                    ui.showHideSpyglassBlackout(`hide`);
                }
            } else if (this.activeWeapon === 2) {
                ui.showHideSpyglassBlackout(`show`);
                lookingDownOffset = 0.4 - Math.max(controls.cameraX, 0.2);
                cameraPosition = new THREE.Vector3(
                    camera.position.x,
                    2,
                    -0.01
                );
                scene.fog.density = 0.005;
                camera.zoom = 4;
                camera.updateProjectionMatrix();
            }

            // myPlayer's cannon rotation
            this.geometry.rotation.x = lerp(this.geometry.rotation.x, Math.min(lookingUpLimit, Math.max(-1, controls.cameraX + this.rotationOffset)), 0.8);

            this.rotation = controls.cameraY;

            camera.position.lerp(cameraPosition, 1);

            camera.rotation.x = lerp(camera.rotation.x, lookingDownOffset, 1);

            this.pitch = controls.cameraX;
            this.crosshair.position.x = camera.position.x;
            this.crosshair.position.y = camera.position.y + 0.01;
            this.crosshair.position.z = camera.position.z - 0.4;
        }

        if (controls.isMouseLookLocked) {
            this.use = controls.lmb;
        } else {
            this.use = false;
        }
    }

    // jumping
    if (this.jumping === 1) {
        this.tryJump();
    }

    this.jumpVel = this.fly === 0 ? this.jumpVel - 80 * dt : Math.max(0, this.jumpVel - 80 * dt);
    this.jump += this.jumpVel * dt;

    if (this.jump < 0) {
        this.jump = 0.0;
    }

    if (this.isPlayer && this.parent) {
        if (this.parent.shipState === 0 || this.parent.shipState === 1) {
            if (this.walkForward !== 0) {
                ui.playAudioFile(false, `step-wood01`);
            }
            if (this.walkSideward !== 0) {
                ui.playAudioFile(false, `step-wood02`);
            }
        } else {
            if (this.walkForward !== 0) {
                ui.playAudioFile(false, `step-sand01`);
            }
            if (this.walkSideward !== 0) {
                ui.playAudioFile(false, `step-sand02`);
            }
        }
    }

    // handle movement around the island if the boat is docked
    if (
        this.isPlayer &&
        this.parent &&
        (
            (
                this.parent.shipState === 3 ||
                this.parent.shipState === 2 ||
                this.parent.shipState === -1 ||
                this.parent.shipState === 4
            ) ||
            this.parent.netType === 5
        )
    ) {
        ui.updateKrewList();

        if (!ui.hideSuggestionBox) {
            if (!$(`#shopping-modal`).is(`:visible`) && myPlayer.gold > 500) {
                if ($(`#earn-gold`).is(`:visible`))
                    $(`#earn-gold`).hide();
            }
        }

        let island = entities[this.parent.anchorIslandId || this.parent.id];
        let islandPosition = new THREE.Vector3(0, 0, 0);

        if (this.parent.netType === 5) {
            var playerPosition = this.geometry.position.clone();

            islandPosition.y = playerPosition.y;

            var distanceFromIsland = playerPosition.distanceTo(islandPosition);

            if (this.waterWalk === 0 && (island.dockRadius - 2 < distanceFromIsland)) { // note: players can exploit this!
                playerPosition.lerp(islandPosition, 1 - ((island.dockRadius - 2) / distanceFromIsland));

                this.position.x = playerPosition.x;
                this.position.z = playerPosition.z;
            }
        }

        if (this.parent.netType === 1) {
            let boat = entities[this.parent.id];
            var playerPosition = this.geometry.getWorldPosition(new THREE.Vector3()).clone();

            playerPosition = island.geometry.worldToLocal(playerPosition);
            islandPosition.y = playerPosition.y;

            var distanceFromIsland = playerPosition.distanceTo(islandPosition);

            if (island.dockRadius - 2 < distanceFromIsland) {
                playerPosition.lerp(islandPosition, 1 - ((island.dockRadius - 2.5) / distanceFromIsland));
                playerPosition = island.geometry.localToWorld(playerPosition);
                playerPosition = boat.geometry.worldToLocal(playerPosition);
                this.position.x = playerPosition.x;
                this.position.z = playerPosition.z;
            }
        }
    }

    this.dockedLogic();

    this.geometry.position.set(
        this.position.x,
        this.position.y + this.jump,
        this.position.z
    );
    this.geometry.rotation.y = this.rotation;

    if (this.weapon !== undefined) {
        if (this.activeWeapon === 1) {
            this.weapon.rotation.x += dt * this.rodRotationSpeed;

            if (this.weapon.rotation.x > 0.75) {
                this.weapon.rotation.x = 0;
            }

        } else {
            this.weapon.rotation.x = -this.rotationOffset + 0.1;
        }
    }

    // check if we turned into the captain (or lost captainship)
    if (this.isCaptain !== this.oldCaptainState) {
        if (this.parent && this.isPlayer && !this.isCaptain) {
            ui.showCenterMessage(`You are not the captain anymore!`, 4, 4000);
            if (this.parent.shipState === 3 || this.parent.shipState === 4 || this.parent.shipState === -1) {
                // $('#island-menu-div').show();
                $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
                $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
                $(`#exit-island-button`).hide();
                $(`#toggle-invite-link-button`).show();
                $(`#quests-button`).show();
            } else if (this.parent.shipState === 1) {
                $(`#docking-modal`).hide();
            }

            $(`#abandon-ship-button`).show();
        }
        if (this.parent && this.isPlayer && this.isCaptain) {
            ui.showCenterMessage(`You are the captain now!`, 4, 4000);
            refreshTimer = 0;

            if (this.parent.shipState === 3 || this.parent.shipState === 4 || this.parent.shipState === -1) {
                // $('#island-menu-div').show();
                $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
                $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
                $(`#exit-island-button`).show();
                $(`#toggle-invite-link-button`).show();
                $(`#quests-button`).show();
            } else if (this.parent.shipState === 1) {
                $(`#docking-modal`).show();
            }

            $(`#abandon-ship-button`).hide();
        }

        if (this.isCaptain) {
            this.playerBody.add(this.captainHat);
            if (this.label !== undefined) {
                this.label.material.color =
                    Admins.includes(this.name) || Mods.includes(this.name) || Devs.includes(this.name) ?
                    labelcolors.staff :
                    this.isPlayer ?
                    labelcolors.myself :
                    this.isCaptain ?
                    labelcolors.captain :
                    labelcolors.player;
            }
        } else {
            this.playerBody.remove(this.playerBody.getObjectByName(`captainHat`));

            if (this.label !== undefined) {
                this.label.material.color = Admins.includes(this.name) || Mods.includes(this.name) || Devs.includes(this.name) ?
                    labelcolors.staff :
                    this.isPlayer ?
                    labelcolors.myself :
                    this.isCaptain ?
                    labelcolors.captain :
                    labelcolors.player;
            }
        }
    }
};

Player.prototype.tryJump = function (dt) {
    if (this.jumpVel > 0.0 || this.jump > 0) {
        return;
    }

    this.jumpVel = 16;
};
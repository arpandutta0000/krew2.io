let ProjectileLogic = {
    /**
     * Projectile logic method
     *
     * @param {number} dt DT
     * @param {object} _this Projectile object
     */
    logic: (dt, _this) => {
        // Remove if the shooter does not exists
        if (_this.shooterid === `` || entities[_this.shooterid] === undefined || (entities[_this.shooterid] !== undefined && _this.type !== -1 && _this.type !== entities[_this.shooterid].activeWeapon)) {
            if (_this.impact) _this.impact.destroy = true;
            EntityModels.removeEntity(_this);
            return;
        }

        if (entities[_this.shooterid] !== undefined && entities[_this.shooterid].use === false) {
            entities[_this.shooterid].isFishing = false;
        }

        if (_this.position.y >= 0) {
            // gravity is acting on the velocity
            _this.velocity.y -= 25.0 * dt;
            _this.position.y += _this.velocity.y * dt;
        }

        if (entities[_this.shooterid] !== undefined && entities[_this.shooterid].parent !== undefined) {
            let playerPos = entities[_this.shooterid].worldPos();

            // If the player is on a boat, don't destroy the fishing rod if they are moving unless it's far from player
            if (entities[_this.shooterid].parent !== undefined &&
                entities[_this.shooterid].parent.netType === 5) {
                if (playerPos.z.toFixed(2) !== _this.shooterStartPos.z.toFixed(2) &&
                    playerPos.x.toFixed(2) !== _this.shooterStartPos.x.toFixed(2)) {
                    _this.reel = true;
                    entities[_this.shooterid].isFishing = false;
                }
            } else {
                let fromPlayertoRod = playerPos.distanceTo(_this.shooterStartPos);
                if (fromPlayertoRod >= 40) {
                    _this.reel = true;
                    entities[_this.shooterid].isFishing = false;
                }
            }
        }

        if (_this.position.y < 10) { // if the cannon ball is below surface level, remove it
            let hasHitBoat = false;

            // if boat was hit or we fall in water, remove
            if (_this.position.y < 0 || hasHitBoat) {
                // if boat was hit or
                if (
                    _this.reel ||
                    _this.shooterid === `` ||
                    entities[_this.shooterid] === undefined ||
                    entities[_this.shooterid].use === true ||
                    entities[_this.shooterid].activeWeapon === 0 ||
                    _this.position.x > config.worldsize ||
                    _this.position.z > config.worldsize ||
                    _this.position.x < 0 ||
                    _this.position.z < 0
                ) {
                    if (_this.impact) _this.impact.destroy = true;
                    EntityModels.removeEntity(_this);
                } else {
                    _this.velocity.x = 0;
                    _this.velocity.z = 0;
                    if (myPlayer && _this.shooterid === myPlayer.id)
                        audio.playAudioFile(false, false, 1, `fishing`);

                    entities[_this.shooterid].isFishing = true;
                }
            }
        }
    },

    /**
     * Projectile client logic method
     *
     * @param {number} dt DT
     * @param {object} _this Projectile object
     */
    clientlogic: (dt, _this) => {
        // check if we didn't set a model yet
        let shootingPlayer = entities[_this.shooterid];

        let boundariesBox = new THREE.Box3();

        if (shootingPlayer === undefined ||
            (shootingPlayer && shootingPlayer.parent && shootingPlayer.parent.hp <= 0)) {
            scene.remove(_this.geometry);
            if (_this.line !== undefined) {
                scene.remove(_this.line);
                _this.line.geometry.dispose();
            }
        }

        if (shootingPlayer && _this.setProjectileModel === true) {
            scene.remove(_this.geometry);

            // determine projectile model based on player active weapon
            if (shootingPlayer.activeWeapon === 0) {
                _this.geometry = new THREE.Sprite(materials.cannonball);
            } else if (shootingPlayer.activeWeapon === 1) {
                _this.baseGeometry = baseGeometry.plane;
                _this.baseMaterial = materials.hook;

                let lineGeometry = baseGeometry.line.clone();
                lineGeometry.vertices.push(_this.startPoint);
                lineGeometry.vertices.push(_this.endPoint);

                _this.line = new THREE.Line(lineGeometry, new THREE.MeshBasicMaterial({
                    color: 0x000
                }));
                sceneLines[_this.id] = _this.line;

                // _this.line.name = shootingPlayer.id + "fishing_line";
                _this.line.frustumCulled = false;
                if (entities[_this.shooterid].weapon) {
                    boundariesBox.setFromObject(entities[_this.shooterid].weapon);
                    _this.startPoint.set(boundariesBox.max.x - 0.5, boundariesBox.max.y, boundariesBox.max.z - 0.5);
                }

                scene.add(_this.line);
                _this.geometry = new THREE.Mesh(_this.baseGeometry, _this.baseMaterial);
                _this.geometry.rotation.x = Math.PI;
            }

            sceneCanBalls[_this.id] = _this.geometry;
            _this.geometry.renderOrder = 16;
            scene.add(_this.geometry);
            _this.setProjectileModel = false;
        }

        // _this.geometry.rotation.y  = 0;
        _this.geometry.position.set(_this.position.x, _this.position.y, _this.position.z);

        // Check if we have the fishing line, adjust its position dynamically
        if (_this.line) {
            // Make fishing line follow rod position
            if (shootingPlayer && shootingPlayer.weapon) {
                boundariesBox.setFromObject(entities[_this.shooterid].weapon);
                _this.startPoint.set(boundariesBox.max.x - 0.5, boundariesBox.max.y, boundariesBox.max.z - 0.5);
            }

            _this.endPoint.set(_this.position.x, _this.position.y + 0.8, _this.position.z);
            _this.line.geometry.verticesNeedUpdate = true;

            _this.geometry.rotation.y += 1.5 * dt;
        } else if (shootingPlayer && shootingPlayer.activeWeapon === 0) {
            _this.particletimer -= dt;
            if (_this.particletimer < 0) {
                let byPlayer = myPlayer && _this.shooterid === myPlayer.id;
                let friendly = myPlayer && myPlayer.parent && myPlayer.parent.children[_this.shooterid];
                _this.particletimer = 0.04;
                createParticle({
                    vx: 0,
                    vy: 0,
                    vz: 0,
                    x: _this.position.x,
                    z: _this.position.z,
                    y: _this.position.y,
                    w: byPlayer ? 0.7 : 0.4,
                    h: byPlayer ? 0.7 : 0.4,
                    d: byPlayer ? 0.7 : 0.4,
                    gravity: 0,
                    duration: 2,
                    rotaSpeed: Math.random() * 5,
                    sizeSpeed: -1.8,
                    material: byPlayer ? materials.smoke_player : (friendly ? materials.smoke_friendly : materials.smoke_enemy),

                    geometry: baseGeometry.box
                });
            }
        }
    }
};

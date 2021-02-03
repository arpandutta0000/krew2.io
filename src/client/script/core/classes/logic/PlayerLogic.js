let PlayerLogic = {
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
                        ui.playAudioFile(false, `turning`);
                }

                if (_this.position.z > _this.parent.size.z / 2) {
                    _this.position.z = _this.parent.size.z / 2;
                    if (_this.isPlayer)
                        ui.playAudioFile(false, `turning`);
                }

                if (_this.position.x < -_this.parent.size.x / 2) {
                    _this.position.x = -_this.parent.size.x / 2;
                    if (_this.isPlayer)
                        ui.playAudioFile(false, `turning`);
                }

                if (_this.position.z < -_this.parent.size.z / 2) {
                    _this.position.z = -_this.parent.size.z / 2;
                    if (_this.isPlayer)
                        ui.playAudioFile(false, `turning`);
                }

                // oval boat shape collision
                if (_this.parent.arcFront > 0 && _this.position.z > 0) {
                    var bound = _this.parent.size.x / 2 - _this.position.z * _this.parent.arcFront;
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
                    var bound = _this.parent.size.x / 2 + _this.position.z * _this.parent.arcBack;
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
            _this.cooldown = _this.activeWeapon === 1 ? 2 : (1.5 - attackSpeedBonus).toFixed(2);

            if (_this.activeWeapon === 0 && _this.isPlayer && _this.parent && _this.parent.shipState !== 3 && _this.parent.shipState !== 4)
                ui.playAudioFile(false, `cannon`);

            else if (_this.isPlayer && _this.activeWeapon === 1)
                ui.playAudioFile(false, `cast-rod`);
        }
        if (!_this.isPlayer) {
            _this.geometry.rotation.x = _this.pitch + _this.rotationOffset;
        }
    }
};
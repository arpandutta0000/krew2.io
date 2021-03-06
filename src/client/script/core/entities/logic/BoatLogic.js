let BoatLogic = {
    /**
     * Boat logic method
     *
     * @param {number} dt DT
     * @param {object} _this Boat object
     */
    logic: (dt, _this) => {
        let boundaryCollision = false;
        if (_this.position.x > config.worldsize) {
            _this.position.x = config.worldsize;
            boundaryCollision = true;
        }

        if (_this.position.z > config.worldsize) {
            _this.position.z = config.worldsize;
            boundaryCollision = true;
        }

        if (_this.position.x < 0) {
            _this.position.x = 0;
            boundaryCollision = true;
        }

        if (_this.position.z < 0) {
            _this.position.z = 0;
            boundaryCollision = true;
        }

        let kaptain = entities[_this.captainId];

        // the boat movement is simple. it always moves forward, and rotates if the captain is steering
        if (kaptain !== undefined && _this.crewName !== undefined) {
            _this.speed = boatTypes[_this.shipclassId].speed + parseFloat(kaptain.movementSpeedBonus / 100);
        }

        let moveVector = new THREE.Vector3(0, 0, (_this.speed));

        // if boat is not anchored or not in docking state, we will move
        if (_this.shipState === 0) {
            // if the steering button is pressed, the rotation changes slowly
            (kaptain !== undefined)
                ? _this.rotation += _this.steering * dt * 0.4 * (_this.turnspeed + parseFloat(0.05 * kaptain.movementSpeedBonus / 100))
                : _this.rotation += _this.steering * dt * 0.4 * _this.turnspeed;

            // we rotate the movement vector depending on the current rotation
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), _this.rotation);
        } else {
            moveVector.set(0, 0, 0);
        }

        // set the velocity to be the move vector
        _this.velocity = moveVector;

        // client side, calculate the ship leaning
        _this.leanvalue += (_this.steering * 4 - _this.leanvalue) * dt;
        _this.rottimer += dt;

        if (myPlayer && myPlayer.parent && _this.sail) {
            _this.sail.material.visible = _this.id !== myPlayer.parent.id || viewSails;
        }

        if (myPlayer && myPlayer.parent && _this.mast) {
            _this.mast.material.visible = _this.id !== myPlayer.parent.id || viewSails;
        }

        if (_this.body &&
            (
                _this.shipState === 3 ||
                _this.shipState === -1 ||
                _this.shipState === 4
            )
        ) {
            _this.rottimer = 0;
            _this.leanvalue = 0;
            if (_this.body.material.opacity >= 0.5) {
                _this.body.material.opacity -= 0.0075;
            }

            if (_this.sail && _this.sail.material.opacity >= 0.5) {
                _this.sail.material.opacity -= 0.0075;
            }

            if (_this.mast && _this.mast.material.opacity >= 0.5) {
                _this.mast.material.opacity -= 0.0075;
            }
        } else {
            _this.body.material.opacity = 1;
            if (_this.sail) {
                _this.sail.material.opacity = 0.9;
            }

            if (_this.mast) {
                _this.mast.material.opacity = 0.9;
            }
        }

        _this.geometry.rotation.x = Math.sin(_this.rottimer * 0.5 + 3) * Math.sin(_this.rottimer) * 0.05;
        _this.geometry.rotation.z = Math.sin(_this.rottimer * 1.0) * 0.05 - _this.leanvalue * 0.08;

        // if our hp is low (we died)
        if (_this.hp < 1) {
            // on client, disconnect the camera from the player
            if (myPlayer && myPlayer.parent === _this) {
                audio.playAudioFile(false, false, 1, `sink-crash`);
                $(`#shopping-modal`).hide();
                $(`#show-shopping-modal-button`).hide();
            }

            // increase the sink timer, make ship sink
            _this.sinktimer += dt;

            if (_this.sinktimer > 4.0) {
                // ships down, lets remove it from game

                EntityModels.removeEntity(_this);
            }
        }
    },

    /**
     * Boat client logic method
     *
     * @param {object} _this  Boat object
     */
    clientlogic: (_this) => {
        _this.position.y = _this.getHeightAboveWater();

        // rotate through water
        let geometryPosition = new THREE.Vector3(
            _this.position.x,
            _this.position.y,
            _this.position.z
        );

        _this.geometry.position.lerp(geometryPosition, 0.8);

        _this.geometry.rotation.y = lerp(
            _this.geometry.rotation.y,
            _this.rotation,
            0.5
        );
    }
};

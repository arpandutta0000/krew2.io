let EntitySnap = {
    /**
     * Method to parse an entity snap
     *
     * @param {object} snap Snap to be parsed
     * @param {object} _this Entity object
     */
    parseSnap: (snap, id, _this) => {
        if (snap.p && entities[snap.p] && _this.parent !== entities[snap.p]) {
            let oldPosition;
            let newparent = entities[snap.p];
            let oldparent = _this.parent;
            if (myPlayerId === id && newparent !== oldparent) setActiveBtn(snap.p);

            if (newparent.netType !== 5) {
                if (
                    _this.geometry !== undefined &&
                    newparent.geometry !== undefined &&
                    oldparent &&
                    oldparent.geometry !== undefined
                ) oldPosition = newparent.geometry.worldToLocal(oldparent.geometry.localToWorld(_this.geometry.position));
                else oldPosition = newparent.toLocal(_this.worldPos());

                _this.position.x = oldPosition.x;
                _this.position.y = oldPosition.y;
                _this.position.z = oldPosition.z;
            }

            newparent.addChildren(_this);
            newparent.geometry.add(_this.geometry);
            _this.geometry.position.set(_this.position.x, _this.position.y, _this.position.z);

            if (newparent.netType === 1) {
                newparent.krewMembers[_this.id] = _this.geometry.children[0];
            }
            if (myPlayer && myPlayer.isCaptain === false && myPlayer.parent.netType === 5 && newparent.netType === 5 && oldparent !== undefined && oldparent.netType === 1 && oldparent.shipState === 1) {
                $(`#abandon-ship-button`).hide();
                showIslandMenu();
            }

            if (_this.isPlayer && _this.parent && !_this.isCaptain && _this.parent.netType === 1) {
                if (_this.parent.shipState === 3) {
                    $(`#exit-island-button`).hide();
                    $(`#invite-div`).hide();
                }

                $(`#abandon-ship-button`).show();
            }
        }

        if (snap.t !== undefined) {
            _this.parseTypeSnap(snap.t);
        }

        if (!_this.isPlayer) {
            if (snap.x !== undefined) {
                _this.position.x = parseFloat(snap.x);
            }

            if (snap.y !== undefined) {
                _this.position.y = parseFloat(snap.y);
            }

            if (snap.z !== undefined) {
                _this.position.z = parseFloat(snap.z);
            }

            if (snap.r !== undefined) {
                _this.rotation = parseFloat(snap.r);
            }
        }

        // parse deletion packets
        if (snap.del !== undefined) {
            _this.onDestroy();
            delete entities[_this.id];
            delete playerNames[_this.id];
        }

        // Update the player experience only when its needed
        if (snap.t !== undefined && snap.t.e !== undefined && snap.t.e !== null) {
            if (snap.t.e.l !== undefined && snap.t.e.l !== _this.level) {
                _this.level = parseInt(snap.t.e.l);
            }

            // Only do the computation if _this is the player
            if (_this.isPlayer) {
                if (snap.t.e.e !== undefined && snap.t.e.e !== _this.experience) {
                    _this.experience = parseInt(snap.t.e.e);
                    _this.experienceNeedsUpdate = true;
                    _this.updateExperience();
                }

                if (snap.t.e.p.fr !== undefined && snap.t.e.p.fr !== _this.points.fireRate) {
                    _this.points.fireRate = parseInt(snap.t.e.p.fr);
                }

                if (snap.t.e.p.ds !== undefined && snap.t.e.p.ds !== _this.points.distance) {
                    _this.points.distance = parseInt(snap.t.e.p.ds);
                }

                if (snap.t.e.p.dm !== undefined && snap.t.e.p.dm !== _this.points.damage) {
                    _this.points.damage = parseInt(snap.t.e.p.dm);
                }
            }
        }
    }
};

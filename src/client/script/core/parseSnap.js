let parseSnap = function (id, data) {
    // this is the function that reads in the snapshot data for a single entity
    // first, check if we have already created the entity
    if (entities[id] === undefined) {
        // switch on the data.n (netcode id). depending on id, we create a entity of that tpye
        switch (data.n) {
            default: {
                // console.log("Error: unknown entitiy type!")
                break;
            }

            case 0: { // its a player
                // console.log('parseSnap new player', data);
                entities[id] = new Player(data);
                entities[id].playerModel = data.playerModel ? data.playerModel : 0;

                // if this entity has the id that the player was assigned, then we know its the player id
                if (id === myPlayerId) {
                    myPlayer = entities[id];
                    myPlayer.isPlayer = true;
                }

                break;
            }

            case 1: { // its a boat
                entities[id] = new Boat(data.t.b);
                break;
            }

            case 2: { // its a projectile
                entities[id] = new Projectile();
                break;
            }

            case 3: { // its an impact
                entities[id] = new Impact(parseInt(data.t.a), parseFloat(data.x), parseFloat(data.z));
                break;
            }

            case 4: { // its a
                entities[id] = new Pickup(parseInt(data.t.s), parseFloat(data.x), parseFloat(data.z), parseInt(data.t.t));
                break;
            }

            case 5: { // its a
                entities[id] = new Landmark(parseInt(data.t.t), parseFloat(data.x), parseFloat(data.z), data.t);
                break;
            }

            case 6: {
                entities[id] = new Bot();
                break;
            }
        }

        if (entities[id] !== undefined) {
            entities[id].id = e;
            entities[id].clientInit();
        }
    }

    // now that we have made sure that we have the entity, we give it the data
    if (entities[id] !== undefined) {
        entities[id].parseSnap(data, id);
    }
};

let entitySnap = {
    parseSnap: (snap, id, _this) => {
        if (snap.p && entities[snap.p] && _this.parent !== entities[snap.p]) {
            let oldPosition;
            let newparent = entities[snap.p];
            let oldparent = _this.parent;
            if (myPlayerId === id && newparent !== oldparent) {
                ui.setActiveBtn(snap.p);
            }
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
    },

    getSnap: (force, _this) => {
        if (!force && !_this.sendSnap) {
            return undefined;
        }

        if (_this.rotation === undefined) {
            console.log(_this); // Bots don't have a rotation so _this fails
        }

        let snap = {
            p: _this.parent ? _this.parent.id : undefined,
            n: _this.netType, // netcode id is for entity type (e.g. 0 player)
            x: _this.position.x.toFixed(2), // x and z position relative to parent
            y: _this.position.y.toFixed(2),
            z: _this.position.z.toFixed(2),
            r: (_this.rotation || 0).toFixed(2), // rotation
            t: _this.getTypeSnap() // type based snapshot data
        };

        // pass name variable if we're first time creating _this entity
        if (_this.netType === 0 && _this.isNew) {
            snap.name = _this.name;
            snap.id = _this.id;

            // check if there's been names queued (for names that were recieved prior to player entity creation). set names
            for (playerId in playerNames) {
                let name = playerNames[playerId];
                if (name && entities[playerId]) {
                    entities[playerId].setName(name);
                }
            }

            _this.isNew = false;
        }

        return snap;
    }
}
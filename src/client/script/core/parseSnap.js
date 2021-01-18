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
    parseSnap: (snap, id, __this) => {
        if (snap.p && entities[snap.p] && __this.parent !== entities[snap.p]) {
            let oldPosition;
            let newparent = entities[snap.p];
            let oldparent = __this.parent;
            if (myPlayerId === id && newparent !== oldparent) {
                ui.setActiveBtn(snap.p);
            }
            if (newparent.netType !== 5) {
                if (
                    __this.geometry !== undefined &&
                    newparent.geometry !== undefined &&
                    oldparent &&
                    oldparent.geometry !== undefined
                ) oldPosition = newparent.geometry.worldToLocal(oldparent.geometry.localToWorld(__this.geometry.position));
                else oldPosition = newparent.toLocal(__this.worldPos());

                __this.position.x = oldPosition.x;
                __this.position.y = oldPosition.y;
                __this.position.z = oldPosition.z;
            }

            newparent.addChildren(__this);
            newparent.geometry.add(__this.geometry);
            __this.geometry.position.set(__this.position.x, __this.position.y, __this.position.z);

            if (newparent.netType === 1) {
                newparent.krewMembers[__this.id] = __this.geometry.children[0];
            }
            if (myPlayer && myPlayer.isCaptain === false && myPlayer.parent.netType === 5 && newparent.netType === 5 && oldparent !== undefined && oldparent.netType === 1 && oldparent.shipState === 1) {
                $(`#abandon-ship-button`).hide();
                showIslandMenu();
            }

            if (__this.isPlayer && __this.parent && !__this.isCaptain && __this.parent.netType === 1) {
                if (__this.parent.shipState === 3) {
                    $(`#exit-island-button`).hide();
                    $(`#invite-div`).hide();
                }

                $(`#abandon-ship-button`).show();
            }
        }

        if (snap.t !== undefined) {
            __this.parseTypeSnap(snap.t);
        }

        if (!__this.isPlayer) {
            if (snap.x !== undefined) {
                __this.position.x = parseFloat(snap.x);
            }

            if (snap.y !== undefined) {
                __this.position.y = parseFloat(snap.y);
            }

            if (snap.z !== undefined) {
                __this.position.z = parseFloat(snap.z);
            }

            if (snap.r !== undefined) {
                __this.rotation = parseFloat(snap.r);
            }
        }

        // parse deletion packets
        if (snap.del !== undefined) {
            __this.onDestroy();
            delete entities[__this.id];
            delete playerNames[__this.id];
        }

        // Update the player experience only when its needed
        if (snap.t !== undefined && snap.t.e !== undefined && snap.t.e !== null) {
            if (snap.t.e.l !== undefined && snap.t.e.l !== __this.level) {
                __this.level = parseInt(snap.t.e.l);
            }

            // Only do the computation if __this is the player
            if (__this.isPlayer) {
                if (snap.t.e.e !== undefined && snap.t.e.e !== __this.experience) {
                    __this.experience = parseInt(snap.t.e.e);
                    __this.experienceNeedsUpdate = true;
                    __this.updateExperience();
                }

                if (snap.t.e.p.fr !== undefined && snap.t.e.p.fr !== __this.points.fireRate) {
                    __this.points.fireRate = parseInt(snap.t.e.p.fr);
                }

                if (snap.t.e.p.ds !== undefined && snap.t.e.p.ds !== __this.points.distance) {
                    __this.points.distance = parseInt(snap.t.e.p.ds);
                }

                if (snap.t.e.p.dm !== undefined && snap.t.e.p.dm !== __this.points.damage) {
                    __this.points.damage = parseInt(snap.t.e.p.dm);
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
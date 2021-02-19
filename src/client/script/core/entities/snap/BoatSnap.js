let BoatSnap = {
    /**
     * Method to parse a boat type snap
     *
     * @param {object} snap Snap to be parsed
     * @param {object} _this Boat object
     */
    parseTypeSnap: (snap, _this) => {
        if (snap.h !== undefined && snap.h !== _this.hp) {
            _this.hp = parseInt(snap.h);
        }

        if (snap.s !== undefined) {
            _this.steering = parseFloat(snap.s);
        }

        // if class has changed, change model
        if ((snap.c !== undefined && snap.c !== _this.shipclassId) || _this.body === undefined) {
            _this.setShipClass(snap.c);
        }

        // if anchorIsland changed
        if (snap.a !== undefined && snap.a !== _this.anchorIslandId) {
            _this.anchorIslandId = snap.a;
        }

        // if krew count changed
        if (snap.k !== undefined && snap.k !== _this.krewCount) {
            _this.krewCount = snap.k;
        }

        // if captain has changed
        if (snap.b !== undefined && _this.captainId !== snap.b) {
            _this.captainId = snap.b;
        }

        // if speed has changed
        if (snap.e !== undefined && _this.speed !== snap.e) {
            _this.speed = parseInt(snap.e);
        }

        // if recruiting has changed
        if (snap.r !== undefined && _this.recruiting !== snap.r) {
            _this.recruiting = parseBool(snap.r);
        }

        // if krew lock has changed
        if (snap.l !== undefined && _this.isLocked !== snap.r) {
            _this.isLocked = parseBool(snap.l);
        }

        // if departure time has changed
        if (snap.d !== undefined && _this.departureTime !== snap.d) {
            _this.departureTime = parseInt(snap.d);
        }

        // If the ship's state has changed, send a snap and change its transparency if it docked
        if (snap.t !== undefined && _this.shipState !== snap.t) {
            _this.shipState = parseInt(snap.t);
            if (_this.shipState === 0) {
                _this.getKrewOnBoard();
            }
        }
    }
};

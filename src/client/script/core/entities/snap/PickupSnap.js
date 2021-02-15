let PickupSnap = {
    /**
     * Method to parse a pickup type snap
     *
     * @param {object} snap Snap to be parsed
     * @param {object} _this Pickup object
     */
    parseTypeSnap: (snap, _this) => {
        if (snap.s !== undefined && snap.s !== _this.pickupSize) {
            _this.pickupSize = parseInt(snap.s);
        }

        if (snap.p !== undefined && snap.p !== _this.picking) {
            _this.picking = parseBool(snap.p);
        }

        if (snap.i !== undefined && snap.i !== _this.pickerId) {
            _this.pickerId = snap.i;
        }

        if (snap.t !== undefined && snap.t !== _this.type) {
            _this.type = parseInt(snap.t);
        }
    }
};

let PlayerSnap = {
    /**
     * Method to parse a player type snap
     *
     * @param {object} snap Snap to be parsed
     * @param {object} _this Player object
     */
    parseTypeSnap: (snap, _this) => {
        if (snap.f !== undefined) {
            _this.walkForward = parseInt(snap.f);
        }

        if (snap.s !== undefined) {
            _this.walkSideward = parseInt(snap.s);
        }

        if (snap.u !== undefined) {
            _this.use = parseBool(snap.u);
        }

        if (snap.p !== undefined) {
            _this.pitch = parseFloat(snap.p);
        }

        if (snap.j !== undefined) {
            _this.jumping = parseInt(snap.j);
        }

        if (snap.m !== undefined) {
            _this.movementSpeedBonus = parseInt(snap.m);
        }

        if (snap.v !== undefined && snap.v !== _this.availablePoints) {
            _this.availablePoints = parseInt(snap.v);
        }

        if (snap.o !== undefined && snap.o !== _this.ownsCannon) {
            _this.ownsCannon = parseBool(snap.o);
            if (ui !== undefined)
                updateStore();
        }

        if (snap.r !== undefined && snap.r !== _this.ownsFishingRod) {
            _this.ownsFishingRod = parseBool(snap.r);
            if (ui !== undefined)
                updateStore();
        }

        if (snap.c !== undefined && snap.c !== _this.checkedItemsList) {
            _this.checkedItemsList = parseBool(snap.c);
        }

        if (snap.d !== undefined && snap.d !== _this.itemId) {
            _this.itemId = parseInt(snap.d);
            if (ui !== undefined)
                updateStore();
        }

        if (snap.w !== undefined && snap.w !== _this.activeWeapon) {
            _this.activeWeapon = parseInt(snap.w);
            _this.changeWeapon();
        }
    }
};

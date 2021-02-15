let ImpactSnap = {
    /**
     * Method to parse an impact type snap
     *
     * @param {object} snap Snap to be parsed
     * @param {object} _this Impact object
     */
    parseTypeSnap: (snap, _this) => {
        if (snap.a !== undefined) {
            _this.impactType = parseFloat(snap.a);
        }
    }
};

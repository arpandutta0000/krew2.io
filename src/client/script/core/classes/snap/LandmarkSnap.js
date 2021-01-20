let LandmarkSnap = {
    getTypeSnap: (_this) => {
        let snap = {
            t: _this.landmarkType,
            name: _this.name,
            dockRadius: _this.dockRadius
        };
        return snap;
    },

    parseTypeSnap: (snap, _this) => {
        if (snap.t !== undefined) {
            _this.pickupSize = parseInt(snap.t);
        }
    }
};
let ImpactSnap = {
    getTypeSnap: (_this) => {
        let snap = {
            a: _this.impactType
        };
        return snap;
    },

    parseTypeSnap: (snap, _this) => {
        if (snap.a !== undefined) {
            _this.impactType = parseFloat(snap.a);
        }
    }
};
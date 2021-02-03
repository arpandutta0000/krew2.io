let ImpactSnap = {
    parseTypeSnap: (snap, _this) => {
        if (snap.a !== undefined) {
            _this.impactType = parseFloat(snap.a);
        }
    }
};
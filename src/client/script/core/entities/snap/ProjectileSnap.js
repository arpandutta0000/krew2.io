let ProjectileSnap = {
    /**
     * Method to parse a pprojectile type snap
     *
     * @param {object} snap Snap to be parsed
     * @param {object} _this Projectile object
     */
    parseTypeSnap: (snap, _this) => {
        if (snap.vx !== undefined) {
            _this.velocity.x = parseFloat(snap.vx);
        }

        if (snap.vy !== undefined) {
            _this.velocity.y = parseFloat(snap.vy);
        }

        if (snap.vz !== undefined) {
            _this.velocity.z = parseFloat(snap.vz);
        }

        if (snap.x !== undefined) {
            _this.position.x = parseFloat(snap.x);
        }

        if (snap.z !== undefined) {
            _this.position.z = parseFloat(snap.z);
        }

        if (snap.y !== undefined) {
            _this.position.y = parseFloat(snap.y);
        }

        if (snap.i !== undefined && snap.i !== _this.shooterid) {
            _this.shooterid = snap.i;
        }

        if (snap.r !== undefined && snap.r !== _this.reel) {
            _this.reel = parseBool(snap.r);
        }

        if (snap.sx !== undefined) {
            _this.shooterStartPos.x = parseFloat(snap.sx);
        }

        if (snap.sz !== undefined) {
            _this.shooterStartPos.z = parseFloat(snap.sz);
        }
    }
};

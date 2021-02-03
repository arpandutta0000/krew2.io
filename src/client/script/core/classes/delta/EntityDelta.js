let EntityDelta = {
    getDelta: (_this) => {
        if (!_this.sendDelta && !_this.sendCreationSnapOnDelta) {
            return undefined;
        }

        // Send a full snapshot on the delta data
        if (_this.sendCreationSnapOnDelta) {
            let result = _this.getSnap(true);
            _this.sendCreationSnapOnDelta = false;
            return result;
        }

        let delta = {
            p: _this.deltaCompare(`p`, _this.parent ? _this.parent.id : undefined),
            n: _this.deltaCompare(`n`, _this.netType),
            x: _this.deltaCompare(`x`, Number(_this.position.x.toFixed(2))),
            y: _this.deltaCompare(`y`, Number(_this.position.y.toFixed(2))),
            z: _this.deltaCompare(`z`, Number(_this.position.z.toFixed(2))),
            r: _this.deltaCompare(`r`, Number(_this.rotation.toFixed(2))),
            t: _this.getTypeDelta()
        };

        if (isEmpty(delta)) {
            delta = undefined;
        }

        return delta;
    },

    deltaCompare: (old, fresh, _this) => {
        if (_this.last[old] !== fresh && _this.muted.indexOf(old) < 0) {
            _this.last[old] = fresh;
            return fresh;
        }

        return undefined;
    },

    deltaTypeCompare: (old, fresh, _this) => {
        if (_this.lastType[old] !== fresh) {
            _this.lastType[old] = fresh;
            return fresh;
        }

        return undefined;
    }
};
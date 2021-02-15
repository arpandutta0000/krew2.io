let PickupDelta = {
    /**
     * Get a pickup's delta type
     *
     * @param {object} _this Pickup object
     */
    getTypeDelta: (_this) => {
        if (_this.type === 1) {
            if (!_this.spawnPacket) _this.spawnPacket = true;
            return undefined;
        } else {
            let delta = {
                s: _this.deltaTypeCompare(`s`, _this.pickupSize),
                p: _this.deltaTypeCompare(`p`, _this.picking),
                i: _this.deltaTypeCompare(`i`, _this.pickerId),
                t: _this.deltaTypeCompare(`t`, _this.type)
            };
            if (isEmpty(delta)) {
                delta = undefined;
            }

            return delta;
        }
    }
};

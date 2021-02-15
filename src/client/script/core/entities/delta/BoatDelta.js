let BoatDelta = {
    /**
     * Get a boat's delta type
     *
     * @param {object} _this Boat object
     */
    getTypeDelta: (_this) => {
        let delta = {
            h: _this.deltaTypeCompare(`h`, _this.hp),
            s: _this.deltaTypeCompare(`s`, _this.steering.toFixed(4)),
            c: _this.deltaTypeCompare(`c`, _this.shipclassId),
            b: _this.deltaTypeCompare(`b`, _this.captainId),
            t: _this.deltaTypeCompare(`t`, _this.shipState),
            a: _this.deltaTypeCompare(`a`, _this.anchorIslandId),
            k: _this.deltaTypeCompare(`k`, _this.krewCount),
            e: _this.deltaTypeCompare(`e`, _this.speed),
            r: _this.deltaTypeCompare(`r`, _this.recruiting),
            l: _this.deltaTypeCompare(`l`, _this.isLocked),
            d: _this.deltaTypeCompare(`d`, _this.departureTime)
        };

        if (isEmpty(delta)) {
            delta = undefined;
        }

        return delta;
    }
};

let PlayerDelta = {
    /**
     * Get a player's delta type
     *
     * @param {object} _this Player object
     */
    getTypeDelta: (_this) => {
        let delta = {
            f: _this.deltaTypeCompare(`f`, _this.walkForward),
            s: _this.deltaTypeCompare(`s`, _this.walkSideward),
            u: _this.deltaTypeCompare(`u`, _this.use),
            p: _this.deltaTypeCompare(`p`, _this.pitch.toFixed(2)),
            j: _this.deltaTypeCompare(`j`, _this.jumping),
            w: _this.deltaTypeCompare(`w`, _this.activeWeapon),
            c: _this.deltaTypeCompare(`c`, _this.checkedItemsList),
            d: _this.deltaTypeCompare(`d`, _this.itemId),
            o: _this.deltaTypeCompare(`o`, _this.ownsCannon),
            r: _this.deltaTypeCompare(`r`, _this.ownsFishingRod),
            v: _this.deltaTypeCompare(`v`, _this.availablePoints)
        };
        if (isEmpty(delta)) {
            delta = undefined;
        }

        return delta;
    }
};

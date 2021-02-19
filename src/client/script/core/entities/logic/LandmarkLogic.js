let LandmarkLogic = {
    /**
     * Landmark logic method
     *
     * @param {number} dt DT
     * @param {object} _this  Landmark object
     */
    logic: (dt, _this) => {},

    /**
     * Landmark client logic method
     *
     * @param {number} dt DT
     * @param {object} _this Landmark object
     */
    clientlogic: (dt, _this) => {
        _this.wavetimer += dt;
        let scale = 0.5 + Math.sin(_this.wavetimer) * 0.5;
        water.position.y = 0.1 + scale * 0.5;
    }
};

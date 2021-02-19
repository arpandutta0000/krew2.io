let ImpactLogic = {
    /**
     * Impact logic method
     *
     * @param {number} dt DT
     * @param {object} _this Impact object
     */
    logic: (dt, _this) => {
        _this.timeout -= dt * 0.8;
        if (_this.timeout <= 0) {
            EntityModels.removeEntity(_this);
        }
    },

    /**
     * Impact client logic method
     *
     * @param {number} dt DT
     * @param {object} _this Impact object
     */
    clientlogic: (dt, _this) => {
        if (_this.impactType === 0) {
            _this.geometry.position.set(_this.position.x, _this.position.y, _this.position.z);
            _this.geometry.scale.y = (_this.timeout < 0.5 ? Ease.easeOutQuad(_this.timeout * 2) : 1.0 - Ease.easeInQuint((_this.timeout - 0.5) * 2)) * 5;

            let quad = Ease.easeOutQuad(_this.timeout);
            _this.geometry.scale.x = 1.5 - quad;
            _this.geometry.scale.z = 1.5 - quad;
        }
    }
};

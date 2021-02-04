let LandmarkLogic = {
    logic: (dt, _this) => {},

    clientlogic: (dt, _this) => {
        _this.wavetimer += dt;
        let scale = 0.5 + Math.sin(_this.wavetimer) * 0.5;
        water.position.y = 0.1 + scale * 0.5;
    }
};
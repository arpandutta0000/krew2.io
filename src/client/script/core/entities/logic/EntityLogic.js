let EntityLogic = {
    clientlogic: (dt, _this) => {
        _this.geometry.position.set(_this.position.x, _this.position.y, _this.position.z);
        _this.geometry.rotation.y = _this.rotation;
    }
};
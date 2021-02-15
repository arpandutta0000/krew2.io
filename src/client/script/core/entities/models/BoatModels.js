let BoatModels = {
    /**
     * Method to set ship models
     */
    setShipModels: () => {
        for (let i in boatTypes) {
            let boat = boatTypes[i];
            if (models[boat.body] !== undefined) {
                boat.body = models[boat.body].getObjectByName(`body`);
            }

            if (boat.sail !== undefined && models[boat.sail] !== undefined) {
                boat.sail = models[boat.sail].getObjectByName(`sail`);
            }

            if (boat.mast !== undefined && models[boat.mast] !== undefined) {
                boat.mast = models[boat.mast].getObjectByName(`mast`);
            }
        }
    },

    /**
     * Method to change a boat's model
     *
     * @param {number} id New model ID
     * @param {object} _this Boat object
     */
    changeBoatModel: (id, _this) => {
        if (_this.geometry === undefined || boatTypes[id] === undefined) {
            return;
        }

        if (_this.body) {
            _this.geometry.remove(_this.body);
        }

        if (_this.sail) {
            _this.geometry.remove(_this.sail);
        }

        if (_this.mast) {
            _this.geometry.remove(_this.mast);
        }

        // body
        _this.body = boatTypes[id].body.clone();
        _this.body.material = boatTypes[id].body.material.clone();
        _this.body.material.transparent = true;
        _this.body.scale.set(boatTypes[id].scale[0], boatTypes[id].scale[1], boatTypes[id].scale[2]);
        _this.body.position.set(boatTypes[id].offset[0], boatTypes[id].offset[1], boatTypes[id].offset[2]);
        _this.body.rotation.set(boatTypes[id].rotation[0], boatTypes[id].rotation[1], boatTypes[id].rotation[2]);
        _this.geometry.add(_this.body);

        if (boatTypes[id].sail) {
            _this.sail = boatTypes[id].sail.clone();
            _this.sail.material = boatTypes[id].sail.material.clone();

            _this.sail.material.transparent = true;
            _this.sail.scale.set(boatTypes[id].scale[0], boatTypes[id].scale[1], boatTypes[id].scale[2]);
            _this.sail.position.set(boatTypes[id].offset[0], boatTypes[id].offset[1], boatTypes[id].offset[2]);
            _this.sail.rotation.set(boatTypes[id].rotation[0], boatTypes[id].rotation[1], boatTypes[id].rotation[2]);
            _this.geometry.add(_this.sail);
        }

        if (boatTypes[id].mast) {
            _this.mast = boatTypes[id].mast.clone();
            _this.mast.material = boatTypes[id].mast.material.clone();
            _this.mast.material.transparent = true;
            _this.mast.scale.set(boatTypes[id].scale[0], boatTypes[id].scale[1], boatTypes[id].scale[2]);
            _this.mast.position.set(boatTypes[id].offset[0], boatTypes[id].offset[1], boatTypes[id].offset[2]);
            _this.mast.rotation.set(boatTypes[id].rotation[0], boatTypes[id].rotation[1], boatTypes[id].rotation[2]);
            _this.geometry.add(_this.mast);
        }
    }
};

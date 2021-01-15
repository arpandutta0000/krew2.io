let setShipModels = () => {
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
};

Boat.prototype.changeBoatModel = (id) => {
    if (this.geometry === undefined || boatTypes[id] === undefined) {
        return;
    }

    if (this.body) {
        this.geometry.remove(this.body);
    }

    if (this.sail) {
        this.geometry.remove(this.sail);
    }

    if (this.mast) {
        this.geometry.remove(this.mast);
    }

    // body
    this.body = boatTypes[id].body.clone();
    this.body.material = boatTypes[id].body.material.clone();
    this.body.material.transparent = true;
    this.body.scale.set(boatTypes[id].scale[0], boatTypes[id].scale[1], boatTypes[id].scale[2]);
    this.body.position.set(boatTypes[id].offset[0], boatTypes[id].offset[1], boatTypes[id].offset[2]);
    this.body.rotation.set(boatTypes[id].rotation[0], boatTypes[id].rotation[1], boatTypes[id].rotation[2]);
    this.geometry.add(this.body);

    if (boatTypes[id].sail) {
        this.sail = boatTypes[id].sail.clone();
        this.sail.material = boatTypes[id].sail.material.clone();

        this.sail.material.transparent = true;
        this.sail.scale.set(boatTypes[id].scale[0], boatTypes[id].scale[1], boatTypes[id].scale[2]);
        this.sail.position.set(boatTypes[id].offset[0], boatTypes[id].offset[1], boatTypes[id].offset[2]);
        this.sail.rotation.set(boatTypes[id].rotation[0], boatTypes[id].rotation[1], boatTypes[id].rotation[2]);
        this.geometry.add(this.sail);
    }

    if (boatTypes[id].mast) {
        this.mast = boatTypes[id].mast.clone();
        this.mast.material = boatTypes[id].mast.material.clone();
        this.mast.material.transparent = true;
        this.mast.scale.set(boatTypes[id].scale[0], boatTypes[id].scale[1], boatTypes[id].scale[2]);
        this.mast.position.set(boatTypes[id].offset[0], boatTypes[id].offset[1], boatTypes[id].offset[2]);
        this.mast.rotation.set(boatTypes[id].rotation[0], boatTypes[id].rotation[1], boatTypes[id].rotation[2]);
        this.geometry.add(this.mast);
    }
};

Boat.prototype.docking = (stateId) => {
    let shipId = this.shipclassId;
    let isPlayer = myPlayer && this === myPlayer.parent;
};
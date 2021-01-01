// these are functions that the entities only have on the client (Like Threejs bodies)
Entity.prototype.clientInit = function () {
    // if (this.id == myPlayerId){
    //     this.isPlayer = true;
    //     this.baseMaterial = materials.colorset_captain;
    // }
    // if it isnt a play, we make a box. otherwise the camera is attached to the thing
    this.createBody();
};

Entity.prototype.createBody = function () {
    // create base object
    this.geometry = new THREE.Object3D();
    scene.add(this.geometry);
    this.geometry.rotation.order = 'YXZ';

    if (this.baseGeometry) {
        this.body = new THREE.Mesh(this.baseGeometry, this.baseMaterial);
        this.body.scale.set(this.modelscale.x, this.modelscale.y, this.modelscale.z);
        this.body.position.set(this.modeloffset.x, this.modeloffset.y, this.modeloffset.z);
        this.body.rotation.set(this.modelrotation.x, this.modelrotation.y, this.modelrotation.z);
        this.geometry.add(this.body);
        this.geometry.position.x = this.position.x;
        this.geometry.position.y = this.position.y;
        this.geometry.position.z = this.position.z;
    }

    if (this.baseModel) {
        this.body = this.baseModel.clone();
        this.body.scale.set(this.modelscale.x, this.modelscale.y, this.modelscale.z);
        this.body.position.set(this.modeloffset.x, this.modeloffset.y, this.modeloffset.z);
        this.body.rotation.set(this.modelrotation.x, this.modelrotation.y, this.modelrotation.z);
        this.geometry.add(this.body);
        this.geometry.position.x = this.position.x;
        this.geometry.position.y = this.position.y;
        this.geometry.position.z = this.position.z;
    }

    // if this is the player, we add the camera
    if (this.isPlayer) {
        if (camera.parent) {
            camera.parent.remove(camera);
        }

        camera.position.set(0, 1, 5);
        camera.rotation.z = 0;
        camera.rotation.y = 0;
        camera.rotation.x = -0.4;
        this.geometry.add(camera);

        this.geometry.add(this.crosshair);
    }

    /*if ((this.netType == 0) && (this.hasOwnProperty("label"))) {
        this.label.position.set(0,2,0);
        this.geometry.add(this.label);

    }*/

    if (this.netType === 0) {
        this.setPlayerBody();
    }

    this.clientlogic(0);

};

Entity.prototype.onClientDestroy = function () {
    if (this.parent) {
        this.parent.geometry.remove(this.geometry);
    }

    scene.remove(this.geometry);

    if (this.line !== undefined) {
        scene.remove(this.line);
        this.line.geometry.dispose();
    }

};

Entity.prototype.clientlogic = function (dt) {

    this.geometry.position.set(this.position.x, this.position.y, this.position.z);
    this.geometry.rotation.y = this.rotation;
};

var removeEntity = function (entity) {

    if (entities.hasOwnProperty(entity.id)) {

        entity.onDestroy();
        delete entities[entity.id];
    }
};
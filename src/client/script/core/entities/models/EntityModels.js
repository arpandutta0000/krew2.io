EntityModels = {
    createBody: (_this) => {
        // create base object
        _this.geometry = new THREE.Object3D();
        scene.add(_this.geometry);
        _this.geometry.rotation.order = `YXZ`;

        _this.geometry.castShadow = true;
        _this.geometry.receiveShadow = true;

        if (_this.baseGeometry) {
            _this.body = new THREE.Mesh(_this.baseGeometry, _this.baseMaterial);
            _this.body.scale.set(_this.modelscale.x, _this.modelscale.y, _this.modelscale.z);
            _this.body.position.set(_this.modeloffset.x, _this.modeloffset.y, _this.modeloffset.z);
            _this.body.rotation.set(_this.modelrotation.x, _this.modelrotation.y, _this.modelrotation.z);
            _this.geometry.add(_this.body);
            _this.geometry.position.x = _this.position.x;
            _this.geometry.position.y = _this.position.y;
            _this.geometry.position.z = _this.position.z;
        }

        if (_this.baseModel) {
            _this.body = _this.baseModel.clone();
            _this.body.scale.set(_this.modelscale.x, _this.modelscale.y, _this.modelscale.z);
            _this.body.position.set(_this.modeloffset.x, _this.modeloffset.y, _this.modeloffset.z);
            _this.body.rotation.set(_this.modelrotation.x, _this.modelrotation.y, _this.modelrotation.z);
            _this.geometry.add(_this.body);
            _this.geometry.position.x = _this.position.x;
            _this.geometry.position.y = _this.position.y;
            _this.geometry.position.z = _this.position.z;
        }

        // if _this is the player, we add the camera
        if (_this.isPlayer) {
            if (camera.parent) {
                camera.parent.remove(camera);
            }

            camera.position.set(0, 1, 5);
            camera.rotation.z = 0;
            camera.rotation.y = 0;
            camera.rotation.x = -0.4;
            _this.geometry.add(camera);

            _this.geometry.add(_this.crosshair);
        }

        if (_this.netType === 0) {
            _this.setPlayerBody(_this.playerModel);
        }

        _this.clientlogic(0);
    },

    onClientDestroy: (_this) => {
        if (_this.parent) {
            _this.parent.geometry.remove(_this.geometry);
        }

        scene.remove(_this.geometry);

        if (_this.line !== undefined) {
            scene.remove(_this.line);
            _this.line.geometry.dispose();
        }
    },

    removeEntity: (entity) => {
        if (entities.hasOwnProperty(entity.id)) {
            entity.onDestroy();
            delete entities[entity.id];
        }
    }
};
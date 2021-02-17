let PlayerModels = {
    /**
     * Method to set up player models
     */
    setPlayerModels: () => {
        /* Pushed dog models */
        materials.seadog = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.seadog
        });

        materials.shibainu = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.shibainu
        });

        materials.arcticwolf = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.arcticwolf
        });

        materials.seafox = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.seafox
        });

        materials.krewmate = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.krewmate
        });

        materials.skeleton = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.skeleton
        });

        materials.commodore = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.commodore
        });

        let seadogModel = new THREE.Mesh(geometry.seadog, materials.seadog);
        let shibainuModel = new THREE.Mesh(geometry.shibainu, materials.shibainu);
        let arcticwolfModel = new THREE.Mesh(geometry.arcticwolf, materials.arcticwolf);
        let seafoxModel = new THREE.Mesh(geometry.seafox, materials.seafox);
        let krewmateModel = new THREE.Mesh(geometry.krewmate, materials.krewmate);
        let skeletonModel = new THREE.Mesh(geometry.skeleton, materials.skeleton);
        let commodoreModel = new THREE.Mesh(geometry.commodore, materials.commodore);

        dogModels.push({
            body: seadogModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });

        dogModels.push({
            body: shibainuModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });

        dogModels.push({
            body: arcticwolfModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });

        dogModels.push({
            body: seafoxModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });

        dogModels.push({
            body: krewmateModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });

        dogModels.push({
            body: skeletonModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });

        dogModels.push({
            body: commodoreModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });

        /* Push staff models */
        materials.br88c = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textures.br88c
        });

        let br88cModel = new THREE.Mesh(geometry.br88c, materials.br88c);

        staffDogModels.push({
            body: br88cModel,
            scale: new THREE.Vector3(0.04, 0.04, 0.04),
            offset: new THREE.Vector3(0, -0.4, 0.8),
            rotation: new THREE.Vector3(0.4, Math.PI, 0)
        });
    },

    /**
     * Method to set up hat models
     */
    setHatModels: () => {
        hatModels.push(models.pirateHat);
        hatModels.push(models.sailorHat);
        hatModels.push(models.shipMasterHat);
    }
};

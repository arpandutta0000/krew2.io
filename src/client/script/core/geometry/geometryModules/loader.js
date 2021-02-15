/* Generic loader and async handler */
let loader = {
    promises: []
};

/* Add a model load to the loader. Wraps the async calls */
loader.loadModel = path => {
    loader.promises.push(new Promise((resolve, reject) => {
        objLoader.load(path, // Resource URL.
            object => {
                // When resource is loaded.
                models[path.substring(path.lastIndexOf(`/`) + 1, path.length).replace(/\.[^/.]+$/, ``)] = object;
                resolve();
            }
        );
    }));
    return loader.promises[loader.promises.length - 1];
};

/* Add a texture load to the loader. Wraps the async calls */
loader.loadTexture = path => {
    loader.promises.push(new Promise((resolve, reject) => {
        let parts = path.split(`/`).pop().split(`.`);
        let ext = parts.pop();
        let name = parts.pop();

        if (ext === `tga`) {
            tgaLoader.load(path, texture => {
                textures[name] = texture;
                resolve();
            });
            return;
        } else if (ext === `mtl`) {
            let folder = path.split(`/`);
            folder.pop();
            folder = `${folder.join(`/`)}/`;
            mtlLoader.setPath(folder);
            mtlLoader.load(`${name}.${ext}`, materials => {
                materials.preload();
                objLoader.setMaterials(materials);
                resolve();
            });
            return;
        }
        textureLoader.load(path, // Resource URL.
            texture => {
                // When resource is loaded.
                textures[path.substring(path.lastIndexOf(`/`) + 1, path.length).replace(/\.[^/.]+$/, ``)] = texture;
                resolve();
            },
            xhr => {}
        );
    }));
};

/* Add an object tile load to the loader. Wraps the async calls */
loader.loadObjWithMtl = path => {
    let objLoader = new THREE.OBJLoader();
    let mtlLoader = new THREE.MTLLoader();

    let folder = path.split(`/`);
    let parts = folder.pop().split(`.`);
    let ext = parts.pop();
    let name = parts.pop();

    folder = `${folder.join(`/`)}/`;

    loader.promises.push(new Promise((resolve, reject) => {
        mtlLoader.setPath(folder);
        mtlLoader.load(`${name}.mtl`, materials => {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load(path, object => {
                models[path.substring(path.lastIndexOf(`/`) + 1, path.length).replace(/\.[^/.]+$/, ``)] = object;
                resolve();
            });
        });
    }));
    return loader.promises[loader.promises.length - 1];
};

/* Create finish emit */
loader.onFinish = fn => {
    Promise.all(loader.promises).then(results => {
        if (fn) fn();
    });
};

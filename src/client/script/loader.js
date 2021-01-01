/* Texture loader, container ************************************************** */
var textureLoader = new THREE.TextureLoader();
var fileLoader = new THREE.FileLoader();
var objLoader = new THREE.OBJLoader();
var tgaloader = new THREE.TGALoader();
var mtlloader = new THREE.MTLLoader();
var textures = {};
var shaders = {};
var models = {};
var json = {};

/* generic loader and async handler ******************************************* */
var loader = {};
loader.promises = [];

// add a task to loader. can be any function, request will be solved once function was called
loader.compute = function (fun) {
    loader.promises.push(new Promise(function (resolve, reject) {
        fun();

        //console.log("computed: ")
        resolve();
    }));

    return loader.promises[loader.promises.length - 1];
};

// add a texture load to the loader. wraps the async calls
loader.loadTexture = function (path) {
    loader.promises.push(new Promise(function (resolve, reject) {
        var parts = path.split('/').pop().split('.');
        var ext = parts.pop();
        var name = parts.pop();

        if (ext === 'tga') {
            tgaloader.load(path, function (texture) {
                textures[name] = texture;
                resolve();
            });

            return;
        }

        if (ext === 'mtl') {
            var folder = path.split('/');
            folder.pop();
            folder = folder.join('/') + '/';
            mtlloader.setPath(folder);
            mtlloader.load(name + '.' + ext, function (materials) {
                materials.preload();
                objLoader.setMaterials(materials);
                resolve();
            });

            return;
        }

        textureLoader.load(
            path, // resource URL
            function (texture) { // Function when resource is loaded
                textures[path.substring(path.lastIndexOf('/') + 1, path.length).replace(/\.[^/.]+$/, '')] = texture;
                resolve();
            },

            function (xhr) { // Function called when download progresses
                //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },

            // Function called when download errors
            function (xhr) {
                //console.log( 'An error happened' );
            }
        );

    }));

    return loader.promises[loader.promises.length - 1];
};

// add a texture load to the loader. wraps the async calls
loader.loadModel = function (path) {
    loader.promises.push(new Promise(function (resolve, reject) {
        objLoader.load(
            path, // resource URL
            function (object) { // Function when resource is loaded
                models[path.substring(path.lastIndexOf('/') + 1, path.length).replace(/\.[^/.]+$/, '')] = object;
                resolve();
            });

    }));

    return loader.promises[loader.promises.length - 1];
};

// add a texture load to the loader. wraps the async calls
loader.loadObjWithMtl = function (path) {
    var objLoader = new THREE.OBJLoader();
    var mtlloader = new THREE.MTLLoader();
    var folder = path.split('/');
    var parts = folder.pop().split('.');
    var ext = parts.pop();
    var name = parts.pop();

    folder = folder.join('/') + '/';

    loader.promises.push(new Promise(function (resolve, reject) {

        mtlloader.setPath(folder);
        mtlloader.load(name + '.mtl', function (materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load(path, function (object) {
                models[path.substring(path.lastIndexOf('/') + 1, path.length).replace(/\.[^/.]+$/, '')] = object;
                resolve();
            });
        });

    }));

    return loader.promises[loader.promises.length - 1];
};

// add a texture load to the loader. wraps the async calls
loader.loadShader = function (path) {
    loader.promises.push(new Promise(function (resolve, reject) {
        fileLoader.load(
            path, // resource URL
            function (data) { // Function when resource is loaded
                shaders[path.substring(path.lastIndexOf('/') + 1, path.length)] = data;
                resolve();
            }
        );

    }));

    return loader.promises[loader.promises.length - 1];
};

loader.loadJSON = function (path) {
    loader.promises.push(new Promise(function (resolve, reject) {
        $.getJSON(path, function (data) {
            json[path.substring(path.lastIndexOf('/') + 1, path.length).replace(/\.[^/.]+$/, '')] = data;
            resolve();
        });
    }));

    return loader.promises[loader.promises.length - 1];
};

loader.onFinish = function (fn) {
    Promise.all(loader.promises).then(function (results) {
        if (fn) {
            fn();
        }
    });
};

module.exports = {
    textures,
    shaders,
    models,
    json,

    loader
}
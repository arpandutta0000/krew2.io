/**
 * Method to iterate through all entities and tick each
 *
 * @param {number} dt DT
 */
let iterateEntities = (dt) => {
    // Tick each entity
    for (let e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].tick(dt);
        }
    }
};

/**
 * Method to start the game
 */
let createGame = () => {
    // Create the minimap
    let minimap = createMinimap();

    // Create three.js renderer object
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: `high-performance`
    });

    // Set additional render options
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.toneMapping = THREE.NoToneMapping;

    // Add renderer to the document
    document.body.appendChild(renderer.domElement);

    // Create the Scene
    scene = new THREE.Scene();

    // Create the Camera
    camera = new THREE.PerspectiveCamera(75, 1.8, 0.1, 300);
    camera.position.set(0, 10, 0);

    // Create the raycaster
    raycaster = new THREE.Raycaster();

    // Set up environmental values
    setUpEnvironment();

    // Set the renderer to use the correct size to match the viewport
    updateViewport();

    // Create canvas
    let canvas = renderer.domElement;
    gl = canvas.getContext(`webgl2`);
    if (!gl) {
        gl = canvas.getContext(`experimental-webgl`);
    }
    defaultWidth = gl.canvas.width;
    defaultHeight = gl.canvas.height;

    // Main loop function to render the game
    let lastFrameTime = performance.now();
    let loop = () => {
        //  Calculate time between frames
        let thisFrame = performance.now();

        // Update water time
        water.material.uniforms.time.value += 1.0 / 60.0;

        // Determine times bewteen frames
        let dt = Math.min((thisFrame - lastFrameTime) / 1000, 0.1);
        lastFrameTime = thisFrame;

        // Run engine logic
        iterateEntities(dt);

        // Run particle logic
        tickParticles(dt);

        minimap.update();

        // Render the scene
        requestAnimationFrame(loop);
        renderer.clear();
        renderer.render(scene, camera);
    };

    renderer.getContext().canvas.addEventListener(`webglcontextlost`, (event) => {
        event.preventDefault();
        cancelAnimationFrame(loop);
    }, false);

    // Run the loop
    loop();
};

/**
 * Clean up extra THREE objects
 */
let cleanScene = () => {
    if (scene != undefined && scene !== [] && scene !== {} && scene !== ``) {
        traverseObj(scene, (node) => {
            if (node != undefined && node !== [] && node !== {} && node !== ``) {
                if (node instanceof THREE.Mesh) {
                    for (let o in sceneCanBalls) {
                        if (sceneCanBalls[o] === node) {
                            scene.remove(node);
                            delete sceneCanBalls[o];
                        }
                    }
                }
                if (node instanceof THREE.Line) {
                    for (let l in sceneLines) {
                        if (sceneLines[l] === node) {
                            scene.remove(node);
                            sceneLines[l].geometry.dispose();
                            delete sceneLines[l];
                        }
                    }
                }
            }
        });
    }
};

/* Function to delete all entities client side */
let deleteEverything = () => {
    for (let e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].onDestroy();
        }
    }
    entities = {};
    myPlayer = undefined;
};

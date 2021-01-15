// Create variables
let secondsAlive = 0;

/* Method to start the game */
let createGame = function () {
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

    // Init controls
    controls = new GameControls();
    setUpKeyboard(renderer);

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
    canvas = renderer.domElement;
    gl = canvas.getContext(`webgl2`);
    if (!gl) {
        gl = canvas.getContext(`experimental-webgl`);
    }
    defaultWidth = gl.canvas.width;
    defaultHeight = gl.canvas.height;

    // Main loop function to render the game
    lastFrameTime = performance.now();
    var loop = () => {
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

/* Function to clean up extra THREE.js objects */
function cleanScene () {
    if (scene !== undefined && scene !== [] && scene !== {}) {
        scene.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                for (o in sceneCanBalls) {
                    let cannonBall = sceneCanBalls[o];
                    if (cannonBall === node) {
                        scene.remove(node);
                        delete sceneCanBalls[o];
                    }
                }
            }
            if (node instanceof THREE.Line) {
                for (l in sceneLines) {
                    let line = sceneLines[l];
                    if (line === node) {
                        scene.remove(node);
                        sceneLines[l].geometry.dispose();
                        delete sceneLines[l];
                    }
                }
            }
        });
    }
};

/* Function for island departure */
let departure = () => {
    if (myPlayer && entities[myPlayer.id] && entities[myPlayer.id].parent) {
        ui.playAudioFile(false, `sail`);
        $(`#docking-modal`).hide();
        this.departureCounter = this.departureCounter || 0;
        socket.emit(`departure`, this.departureCounter);
        this.departureCounter += 1;
        if (this.departureCounter > 2) {
            this.departureCounter = 0;
        }
    }
};

/* Function to delete all entities client side */
let deleteEverything = function () {
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].onDestroy();
        }
    }
    entities = {};
    myPlayer = undefined;
};
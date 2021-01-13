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
let cleanScene = () => {
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

/* Update info for island docking/departure timers */
var islandTimer = () => {
    // Update the alive timer
    ++secondsAlive;
    $(`#seconds`).html(pad(secondsAlive % 60));
    $(`#minutes`).html(pad(parseInt(secondsAlive % 3600 / 60)));
    $(`#hours`).html(pad(parseInt(secondsAlive / 3600)));

    if (myPlayer && myPlayer.parent) {
        if (myPlayer.parent.shipState === -1 || myPlayer.parent.shipState === 3) {
            $dockingModalButton.removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
            $portName.text(entities[myPlayer.parent.anchorIslandId].name);
            $dockingModalButtonSpan.text(`Countdown...`);
            $cancelExitButtonSpan.text(`Sail (c)`);
            return;
        }

        if (myPlayer.parent.netType === 5) {
            $portName.text(myPlayer.parent.name);
            if ($dockingModal.is(`:visible`)) {
                $dockingModal.hide();
                showIslandMenu();
            }
        }

        if ($dockingModal.hasClass(`initial`)) {
            $dockingModal.removeClass(`initial`).find(`#you-are-docked-message`).remove();
        }

        if (myPlayer.parent.shipState !== 1) {
            countDown = 8;
        }

        if (myPlayer.parent.shipState === 1) {
            if (countDown === 8) {
                socket.emit(`dock`);
            }
            $cancelExitButtonSpan.text(`Cancel (c)`);

            if (countDown !== 0 && countDown > 0) {
                $dockingModalButtonSpan.text(`Docking in ${countDown} seconds`);
            } else {
                $dockingModalButtonSpan.text(`Dock (z)`);
                $dockingModalButton.removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
            }

            countDown--;
        }

        if (myPlayer.parent.shipState === 4) {
            $(`#docking-modal`).hide();
            if (!$(`#departure-modal`).is(`:visible`)) {
                $(`#departure-modal`).show(0);
            }

            $(`#cancel-departure-button`).find(`span`).text(`${(myPlayer && myPlayer.isCaptain ? `Departing in ` : `Krew departing in `) + entities[myPlayer.id].parent.departureTime} seconds`);
        }

        if (((!myPlayer.isCaptain && myPlayer.parent.shipState !== 4) || (myPlayer.isCaptain && myPlayer.parent.shipState === 0)) && $(`#departure-modal`).is(`:visible`)) {
            $(`#departure-modal`).hide();
        }
    }
};

/* When a user joins the game */
let login = function () {
    connect($(`#server-list`).val());

    ui.setQualitySettings();

    $.ajax({
        url: `/account_game_settings`,
        type: `GET`,
        success: function (res) {
            if (!res.errors) {
                if (res.fpMode) {
                    $(`#account-fp-mode-button`).prop(`checked`, true);
                    $(`#fp-mode-button`).prop(`checked`, true);
                } else {
                    $(`#account-fp-mode-button`).prop(`checked`, false);
                    $(`#fp-mode-button`).prop(`checked`, false);
                }

                $(`#account-music-control`).val(res.musicVolume);
                $(`#music-control`).val(res.musicVolume);
                $(`#account-sfx-control`).val(res.sfxVolume);
                $(`#sfx-control`).val(res.sfxVolume);

                $(`#account-quality-list`).val(res.qualityMode);
                $(`#quality-list`).val(res.qualityMode);

                $(`#account-game-settings-save-notice`).removeClass(`hidden`);
            } else {
                $(`#account-fp-mode-button`).prop(`checked`, false);
                $(`#fp-mode-button`).prop(`checked`, false);

                $(`#account-music-control`).val(50);
                $(`#music-control`).val(50);
                $(`#account-sfx-control`).val(50);
                $(`#sfx-control`).val(50);

                $(`#account-quality-list`).val(2);
                $(`#quality-list`).val(2);
            }

            updateMusic();
            updateQuality();
        },
        error: function (res) {
            $(`#account-fp-mode-button`).prop(`checked`, false);
            $(`#fp-mode-button`).prop(`checked`, false);

            $(`#account-music-control`).val(50);
            $(`#music-control`).val(50);
            $(`#account-sfx-control`).val(50);
            $(`#sfx-control`).val(50);

            $(`#account-quality-list`).val(2);
            $(`#quality-list`).val(2);

            $(`#quality-list`).emit(`change`);
            $(`#music-control`).emit(`change`);

            updateMusic();
            updateQuality();
        }
    });
};
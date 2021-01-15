// Set up global variables that will be used throughout all the engine
let renderer, scene, camera, myPlayer, myBoat, domEvents, raycaster, canvas, gl, defaultWidth, defaultHeight;
let SERVER; let threejsStarted = false;
let countDown = 10;
let playerName = ``;
let markers = {};

let adBlockEnabled = false;
let testAd = document.createElement(`div`);
testAd.innerHTML = `&nbsp;`;
testAd.className = `adsbox`;

document.body.appendChild(testAd);
window.setTimeout(() => {
    if (testAd.offsetHeight === 0) {
        adBlockEnabled = true;
    }

    testAd.remove();
    if (adBlockEnabled) {
        $(`#disable-adblock-message`).show();
    }
}, 1000);

let createMinimap = () => {
    let map = CanvasMap(document.getElementById(`minimap`), worldsize, worldsize);
    map.useRadians = true;
    map.zoom = 0.9;
    let middle = worldsize / 2;

    let fps = 24;
    let time = performance.now();

    let compass = {
        x: map.text({
            x: middle,
            y: middle,
            text: `+`,
            fill: `rgba(84,48,13,0.7)`,
            size: 150,
            baseline: `middle`
        }),
        n: map.text({
            x: middle,
            y: middle - 350,
            text: `N`,
            fill: `rgba(84,48,13,0.7)`,
            size: 160,
            baseline: `middle`
        }),
        s: map.text({
            x: middle,
            y: middle + 350,
            text: `S`,
            fill: `rgba(84,48,13,0.7)`,
            size: 190,
            baseline: `middle`
        }),
        w: map.text({
            x: middle - 350,
            y: middle,
            text: `W`,
            fill: `rgba(84,48,13,0.7)`,
            size: 190,
            baseline: `middle`
        }),
        e: map.text({
            x: middle + 350,
            y: middle,
            text: `E`,
            fill: `rgba(84,48,13,0.7)`,
            size: 190,
            baseline: `middle`
        }),
        boundary: map.rect({
            x: 0,
            y: 0,
            width: worldsize,
            height: worldsize,
            stroke: {
                color: `rgba(84,48,13,1)`,
                width: 8
            }
        })
    };

    map
        .add(compass.x)
        .add(compass.n)
        .add(compass.s)
        .add(compass.w)
        .add(compass.e)
        .add(compass.boundary);

    let loop = function () {
        if (performance.now() - time > 1000 / fps) {
            if (entities === undefined) {
                map.elements = {};
            }

            if (entities !== undefined) {
                for (var id in map.elements) {
                    if ((map.elements[id].netType === 5 || map.elements[id].netType === 0 || map.elements[id].netType === 4) && entities[id] === undefined) {
                        map.remove(map.elements[id]);
                    }
                }

                for (var id in entities) {
                    if (entities[id].netType === 5) {
                        if (map.elements[id] === undefined) {
                            map
                                .add(map.point({
                                    x: entities[id].position.x,
                                    y: entities[id].position.z,
                                    r: entities[id].dockRadius,
                                    fill: `green`,
                                    id: id,
                                    netType: 5
                                }))
                                .add(map.text({
                                    x: entities[id].position.x,
                                    y: entities[id].position.z - 120,
                                    text: entities[id].name,
                                    fill: `rgba(84,48,13,1)`,
                                    font: `serif`,
                                    id: `${id}-label`,
                                    size: 180
                                }));
                        }
                    }
                    if (entities[id].netType === 4 && entities[id].type === 4) {
                        if (map.elements[id] === undefined) {
                            map
                                .add(map.text({
                                    x: entities[id].position.x,
                                    y: entities[id].position.z,
                                    text: `x`,
                                    fill: `rgba(204, 10, 10, 1)`,
                                    font: `sans-serif`,
                                    id: id,
                                    size: 140,
                                    netType: 4
                                }));
                        }
                    }
                }

                for (var id in markers) {
                    if (map.elements[id] === undefined) {
                        map.add(map.point({
                            x: markers[id].x,
                            y: markers[id].y,
                            r: 30,
                            d: 0.5,
                            id: id,
                            creatTime: performance.now(),
                            fill: `rgba(255, 0, 0, 0.5)`
                        }));
                    }
                    if (map.elements[id] !== undefined) {
                        if (map.elements[id].creatTime < performance.now() - 10000) {
                            map.remove(map.elements[id]);
                            delete markers[id];
                        } else {
                            map.elements[id].r = map.elements[id].r + Math.sin(map.elements[id].d) * 5;
                            map.elements[id].d += 0.2;
                        }
                    }
                }
            }

            if (myPlayer && myPlayer.geometry) {
                let position = myPlayer.geometry.getWorldPosition(new THREE.Vector3());
                let quaternion = new THREE.Quaternion();
                let extraRotation;

                // Get quartertation based off of ship status
                if (myPlayer.parent && myPlayer.parent.netType === 1 && myPlayer.parent.shipState === 0) {
                    myPlayer.parent.geometry.getWorldQuaternion(quaternion);
                    extraRotation = 180;
                } else {
                    myPlayer.geometry.getWorldQuaternion(quaternion);
                    extraRotation = 0;
                }
                // Calculate heading in degrees
                let pVec = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
                let heading = Math.atan2(pVec.z, pVec.x) * 180 / Math.PI;
                heading = heading > 0 ? heading : heading + 360;
                // Return heading in radians
                rotation = (heading % 360 + extraRotation) * Math.PI / 180;

                if (map.elements[myPlayer.id] === undefined) {
                    map.add(map.triangle({
                        x: myPlayer.position.x,
                        y: myPlayer.position.z,
                        size: 80,
                        rotation: rotation,
                        fill: `white`,
                        stroke: {
                            color: `black`,
                            width: 15
                        },
                        id: myPlayer.id,
                        netType: 0
                    }));
                }

                if (map.elements[myPlayer.id] !== undefined) {
                    map.elements[myPlayer.id].x = position.x;
                    map.elements[myPlayer.id].y = position.z;
                    map.elements[myPlayer.id].rotation = rotation;
                }
            }

            map.draw();
            time = performance.now();
        }
    };

    map.update = loop;

    return map;
};

let timer = setInterval(() => {
    islandTimer();
}, 1000);
let cleanup = setInterval(() => {
    cleanScene();
}, 90000);
// var deletingbots = setInterval(function() { deleteBots();}, 10000);

// var departureTimer = setInterval(function() { departure(); }, 1000);

window.logoutUser = function () {
    // remove the player's cookie
    ui.invalidateCookie(`username`);
    ui.invalidateCookie(`token`);
    window.location.pathname = `/logout`;
};

window.userFirebaseRegister = function (e) {
    if (e) {
        e.preventDefault();
    }

    firebaseRegister();
};

window.userFirebaseLogin = function (e) {
    if (e) {
        e.preventDefault();
    }

    firebaseLogin();
};

let createGame = function () {
    let minimap = createMinimap();

    // Create three.js renderer object
    renderer = new THREE.WebGLRenderer({
        antialias: true
        // powerPreference: `high-performance`
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.toneMapping = THREE.NoToneMapping;

    // Add renderer to the document
    document.body.appendChild(renderer.domElement);

    // create the controlls object. configure pointer lock.
    controls = new GameControls();
    setUpKeyboard(renderer);

    // Set up the scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera(75, 1.8, 0.1, 300);
    camera.position.set(0, 10, 0);

    // Raycaster
    raycaster = new THREE.Raycaster();

    // Set up environmental values
    setUpEnvironment();

    // make the renderer fit the window size
    updateViewport();

    canvas = renderer.domElement;

    gl = canvas.getContext(`webgl2`);
    if (!gl) {
        gl = canvas.getContext(`experimental-webgl`);
    }

    defaultWidth = gl.canvas.width;
    defaultHeight = gl.canvas.height;

    // render function
    lastFrameTime = performance.now();
    var loop = function () {
        //  calculate delta time since last frame. (Minimum 0.1 s)
        let thisFrame = performance.now();

        water.material.uniforms.time.value += 1.0 / 60.0;
        let dt = Math.min((thisFrame - lastFrameTime) / 1000, 0.1);
        lastFrameTime = thisFrame;

        // do engine logic
        iterateEntities(dt);

        // do particle logic
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

// Show Island window for non-kaptains
let showIslandMenu = function () {
    // $('#island-menu-div').show();
    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
    if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
        $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
    }
    $(`#exit-island-button`).hide();
    ui.updateStore($(`.btn-shopping-modal.active`));
    ui.updateKrewList();
};

let enterIsland = function (data) {
    // release mouseLook
    // controls.unLockMouseLook();

    if (data.captainId === myPlayerId) {
        if (myPlayer && myPlayer.parent && myPlayer.parent.shipState !== 2) {
            $(`#docking-modal`).show();
        }
    }
    // if ($('#island-menu-div').is(':visible')) {
    if ($(`#toggle-shop-modal-button`).hasClass(`enabled`)) {
        $(`#docking-modal`).hide();
    }

    if (myPlayer) {
        ui.stopAudioFile(`ocean-music`);
        ui.playAudioFile(true, `island-music`);
    }
};

let $dockingModalButton = $(`#docking-modal-button`);
let $dockingModalButtonSpan = $dockingModalButton.find(`span`);
let $portName = $(`.port-name`);
let $cancelExitButton = $(`#cancel-exit-button`);
let $cancelExitButtonSpan = $cancelExitButton.find(`span`);
let $dockingModal = $(`#docking-modal`);

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

/* var deleteBots = function() {
    console.log('botss');
    socket.emit('deleteBots');
}; */

// function to calculate values for the "alive timer"
let pad = function (val) {
    let valString = `${val}`;
    if (valString.length < 2) {
        return `0${valString}`;
    } else {
        return valString;
    }
};

let secondsAlive = 0;

var islandTimer = function () {
    // update the "alive timer" every second
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

            /* if (!$('#suggestion-ui').is(':visible') &&
                ([5,25].includes(entities[myPlayer.id].parent.departureTime))
                )
                uiSuggest.setItems(); */
            $(`#cancel-departure-button`).find(`span`).text(
                `${(myPlayer && myPlayer.isCaptain ? `Departing in ` : `Krew departing in `) +
                entities[myPlayer.id].parent.departureTime
                } seconds`
            );
        }

        if (
            (
                (!myPlayer.isCaptain && myPlayer.parent.shipState !== 4) ||
                (myPlayer.isCaptain && myPlayer.parent.shipState === 0)
            ) &&
            $(`#departure-modal`).is(`:visible`)
        ) {
            $(`#departure-modal`).hide();
        }
    }
};

let departure = function () {
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

// called from connection.js when "exitIsland" socket message is received from the server
let exitIsland = function (data) {
    // lock mouse
    controls.lockMouseLook();

    if (data.captainId === myPlayerId) {
        $(`#docking-modal`).hide();
        $(`#departure-modal`).hide();
    }

    /* if (myPlayer && myPlayer.parent)
        myPlayer.parent.shipState === 3 */

    // $("#recruiting-div").fadeOut();
    // $('#suggestion-ui').hide();
    // $('#toggle-krew-list-modal-button').popover('hide');
    // $('#toggle-shop-modal-button').popover('hide');
    krewListUpdateManually = false;
    ui.hideSuggestionBox = true;
    if (myPlayer) {
        ui.stopAudioFile(`island-music`);
        ui.playAudioFile(true, `ocean-music`);
    }

    // $('#island-menu-div').hide();
    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
    $(`#exit-island-button`).hide();
    $(`#shopping-modal`).hide();
    $(`#krew-list-modal`).hide();
    ui.updateStore($(`.btn-shopping-modal.active`));

    $(`#docking-modal-button`).removeClass(`btn btn-primary enabled btn-lg`).addClass(`btn btn-primary disabled btn-lg`);
    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
};

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

var updateQuality = function () {
    switch (parseInt($(`#quality-list`).val())) {
        case 1: {
            if (gl !== undefined) {
                var newW = defaultWidth / 2.5;
                var newH = defaultHeight / 2.5;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newW);
                renderer.setSize(newW, newW, false);
            }

            break;
        }

        case 2: {
            if (gl !== undefined) {
                var newW = defaultWidth / 1.45;
                var newH = defaultHeight / 1.45;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newH);
                renderer.setSize(newW, newW, false);
            }

            break;
        }

        case 3: {
            if (gl !== undefined) {
                var newW = defaultWidth;
                var newH = defaultHeight;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newH);
                renderer.setSize(newW, newW, false);
            }

            break;
        }
    }
};

var updateMusic = function () {
    let elements = document.querySelectorAll(`audio`);
    const range = document.getElementById(`music-control`);
    for (let i = 0; i < elements.length; i++) {
        elements[i].volume = 0.1 * range.value / range.max;
    }
};

let sendMessage = function () {
    socket.emit(`chat message`, {
        message: $(`#chat-message`).val(),
        recipient: localChatOn ? `local` : clanChatOn ? `clan` : staffChatOn ? `staff` : `global`
    });
    $(`#chat-message`).val(``).focus();
};

let makeDeposit = function () {
    let deposit = +$(`#make-deposit`).val();
    let sumDeposits = parseInt($(`#my-deposits`).text()) + deposit;
    if (deposit <= myPlayer.gold && sumDeposits <= 150000) {
        socket.emit(`bank`, {
            deposit: deposit
        });
        ui.playAudioFile(false, `deposit`);
        $(`#make-deposit`).val(``).focus();
        $(`#successMakeDepoMess`).show();
        $(`#errorMakeDepoMess`).hide();
        $(`#successTakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    } else if (sumDeposits > 150000) {
        $(`#errorFullDepoMess`).show();
        $(`#successMakeDepoMess`).hide();
        $(`#errorMakeDepoMess`).hide();
        $(`#successTakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
    } else {
        $(`#errorMakeDepoMess`).show();
        $(`#successMakeDepoMess`).hide();
        $(`#successTakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    }
};
let getBankData = function () {
    socket.emit(`bank`);
};
let takeDeposit = function () {
    let deposit = +$(`#take-deposit`).val();
    if (deposit <= +$(`#my-deposits`).text()) {
        socket.emit(`bank`, {
            takedeposit: deposit
        });
        $(`#take-deposit`).val(``).focus();
        $(`#successTakeDepoMess`).show();
        $(`#successMakeDepoMess`).hide();
        $(`#errorMakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    } else {
        $(`#errorTakeDepoMess`).show();
        $(`#successTakeDepoMess`).hide();
        $(`#successMakeDepoMess`).hide();
        $(`#errorMakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    }
};

// Share a link and caption on Facebook
let fbShare = function (message, link) {
    FB.login((response) => {
        let token = response.authResponse.accessToken;

        if (response.authResponse) {
            FB.api(`/me`, `get`, {
                access_token: token
            }, (response) => {
                // console.log(response);
            });

            /* FB.api('/me/feed', 'post', params, function(response) {
                  //console.log(response);
                }); */
            FB.ui({
                method: `share_open_graph`,
                action_type: `og.shares`,
                action_properties: JSON.stringify({
                    object: {
                        'og:url': `http://${link}`, // your url to share
                        'og:title': `Krew.io`,
                        'og:description': message,
                        'og:image': `https://krew.io/assets/img/logo.png`
                    }
                })
            });
        }
    },

    {
        scope: `publish_actions`
    }
    );
};

function isAlphaNumeric (str) {
    let code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123) && // lower alpha (a-z)
            !(code === 190 || code === 46)) {
            return false;
        }
    }
    return true;
}

// Once the document has been fully loaded, start the engine initiation process
$(document).ready(() => {
    loader.loadObjWithMtl(`./assets/models/cannon/cannon.obj`);
    loader.loadObjWithMtl(`./assets/models/hat_pirate.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/bigship.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/schooner.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/sloop.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/vessel.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/ft.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/bo.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/junk.obj`);
    loader.loadObjWithMtl(`./assets/models/ships/raider.obj`);
    loader.loadObjWithMtl(`./assets/models/fish.obj`);
    loader.loadObjWithMtl(`./assets/models/shell.obj`);
    loader.loadObjWithMtl(`./assets/models/crab.obj`);
    loader.loadObjWithMtl(`./assets/models/clam.obj`);
    loader.loadObjWithMtl(`./assets/models/chest.obj`);
    loader.loadObjWithMtl(`./assets/models/spyglass.obj`);

    // christmas tree & snowman
    // loader.loadObjWithMtl('./assets/models/elka.obj');
    // loader.loadObjWithMtl('./assets/models/snowman.obj');

    loader.loadModel(`./assets/models/ships/raft.obj`);
    loader.loadModel(`./assets/models/ships/trader.obj`);
    loader.loadModel(`./assets/models/ships/boat.obj`);
    loader.loadModel(`./assets/models/ships/destroyer.obj`);
    loader.loadModel(`./assets/models/island.obj`);
    loader.loadModel(`./assets/models/fishingrod.obj`);
    loader.loadTexture(`./assets/models/colorset.png`);
    loader.loadTexture(`./assets/models/hook.png`);
    loader.loadTexture(`./assets/models/props_diffuse1.tga`);
    loader.loadTexture(`./assets/img/water.jpg`);
    loader.loadTexture(`./assets/img/cannonball.png`);
    loader.loadTexture(`./assets/img/crate.jpg`);

    // Load Dogs
    loader.loadModel(`./assets/models/dogs/seadog.obj`);
    loader.loadModel(`./assets/models/dogs/shibainu.obj`);
    loader.loadModel(`./assets/models/dogs/arcticwolf.obj`);
    loader.loadModel(`./assets/models/dogs/seafox.obj`);
    loader.loadModel(`./assets/models/dogs/krewmate.obj`);
    loader.loadTexture(`./assets/models/dogs/seadog.tga`);
    loader.loadTexture(`./assets/models/dogs/shibainu.tga`);
    loader.loadTexture(`./assets/models/dogs/arcticwolf.tga`);
    loader.loadTexture(`./assets/models/dogs/seafox.tga`);
    loader.loadTexture(`./assets/models/dogs/krewmate.tga`);

    loader.onFinish(() => {
        // create materials and game world
        createModels();
        createMaterials();
        createGame();
        threejsStarted = true;

        $(`#play-button`).text(`Play as guest`).attr(`disabled`, false);
        if (!(ui.getCookie(`username`) && ui.getCookie(`token`))) {
            ui.getKrewioData();
        } else {
            ui.username = ui.getCookie(`username`);
            ui.prepareForPlay();
        }
    });

    $(`#show-more`).on(`click`, () => {
        if ($(`#show-more`).text().indexOf(`Show more`) > -1) {
            $(`.top50`).show();
            $(`#show-more`).html(`<i class="icofont icofont-medal"></i> Show less`);
        } else {
            $(`.top50`).hide();
            $(`#show-more`).html(`<i class="icofont icofont-medal"></i> Show more`);
        }
    });

    $(`#chat-message`).on(`keyup`, function () {
        let $this = $(this);
        let val = $this.val();

        if (val.trim().length > 150) {
            $this.val(val.slice(0, 150));
        }
    });

    $(`#close-admin-panel-btn`).on(`click`, () => {
        $(`#panel-modal`).hide();
    });

    $(`#verify-panel-button`).on(`click`, () => {
        socket.emit(`openAdminPanel`, (callback) => {
            if (callback === true) {
                $(`#panel-modal`).show();
            }
        });
    });

    // login by pressing login button
    $(`#play-button`).on(`click`, () => {
        // console.log('play button pressed. showAdinplayCentered');
        GameAnalytics(`addDesignEvent`, `Game:Session:ClickedPlayButton`);
        if (threejsStarted) {
            ui.showAdinplayCentered();
            login();
            setUpKeybinds();
            ui.LoadingWheel(`show`);
            ui.playAudioFile(false, `wheelspin`);
            ui.playAudioFile(true, `ocean-ambience`);
        }
    }).text(`Loading...`).attr(`disabled`, true);

    $(`#play-again-button`).on(`click`, () => {
        if (threejsStarted) {
            ui.showAdinplayCentered();
            secondsAlive = 0;
            socket.emit(`respawn`);
            myPlayer.itemId = undefined;
            myPlayer.state = 2;
            // $('#island-menu-div').show();
            $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
            $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
            $(`#toggle-bank-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
            // as long as we spawn on the water, do not show the krew list modal, do not update the Store and do not update the krew list
            // ui.updateStore($('.btn-shopping-modal.active'));
            // $('#krew-list-modal').show();
            // ui.updateKrewList();
        }
    });

    $(`#share-link`).on(`click`, () => {
        let message = `I just had an amazing game of krew.io and my score was ${lastScore}`;
        let link = `krew.io/`;
        fbShare(message, link);
        ui.showAdinplayCentered();
        secondsAlive = 0;

        // login();
        socket.emit(`respawn`);
        myPlayer.state = 2;
        myPlayer.itemId = undefined;
        // $('#island-menu-div').show();
        $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
        $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
        $(`#toggle-bank-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
        ui.updateStore($(`.btn-shopping-modal.active`));
        $(`#krew-list-modal`).show();
        ui.updateKrewList();
    });

    // login by pressing login button
    $(`#quality-list`).on(`change`, () => updateQuality());

    $(`#share-invite-link`).on(`click`, () => {
        let message = `Join my krew!`;
        let link = ui.getInviteLink();
        fbShare(message, link);
    });

    /**
     * Init listeners for the ui
     */
    ui.setListeners();

    $(window).on(`unload`, () => {
        if (socket) {
            socket.close();
        }
    });

    // send chat message by enter key
    $(`#chat-message`).on(`keypress`, (e) => {
        if (e.keyCode === 13) {
            sendMessage();
        }
    });

    $(`#make-deposit`).on(`keypress`, (e) => {
        if (e.keyCode === 13) {
            makeDeposit();
        }
    });
    $(`#take-deposit`).on(`keypress`, (e) => {
        if (e.keyCode === 13) {
            takeDeposit();
        }
    });

    ui.updateServerList();

    ui.createWallOfFame();

    // send chat message by pressing send message button
    $(`#send-message-button`).on(`click`, () => {
        sendMessage();
    });

    if (getUrlVars().sid && getUrlVars().bid) { // invite link is being used
        $(`#invite-is-used`).show();
        $(`#select-server`).hide();
        $(`#select-spawn`).hide();
    }

    $(`#crew_count, #ship_health, #food`).slider();

    $(`#crew_count`).on(`slide`, (slideEvt) => {
        $(`#crew_count_val`).text(slideEvt.value);
    });

    $(`#ship_health`).on(`slide`, (slideEvt) => {
        $(`#ship_health_val`).text(slideEvt.value);
    });

    // TODO: check if this is needed. If not, delete or comment
    $(`#hide-shopping-modal-button`).on(`click`, () => {
        $(`#shopping-modal`).fadeOut();
        if (myBoat.shipState === 3) {
            $(`#show-shopping-modal-button`).fadeIn();
        }
    });

    // TODO: check if this is needed. If not, delete or comment
    $(`#show-shopping-modal-button`).on(`click`, () => {
        $(`#shopping-modal`).fadeIn();
    });

    let $btnShoppingModal = $(`.btn-shopping-modal`);

    $btnShoppingModal.each(function () {
        let $this = $(this);
        $this.on(`click`, () => {
            $btnShoppingModal.removeClass(`active`);
            $this.addClass(`active`);
            ui.updateStore($this);
        });
    });

    $(`#docking-modal-button`).on(`click`, () => {
        if ($(`#docking-modal-button`).hasClass(`enabled`)) {
            if (myPlayer && myPlayer.parent) {
                ui.playAudioFile(false, `dock`);
                socket.emit(`anchor`);
                $btnShoppingModal.eq(2).trigger(`click`);
                if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
                    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                }
                if (myPlayer.parent.netType === 1 && !$(`#exit-island-button`).is(`:visible`)) {
                    $(`#exit-island-button`).show();
                }
            }

            lastScore = 0;
            controls.unLockMouseLook();
            $(`#docking-modal`).hide();
            $(`#supply`).tooltip(`show`);

            // $("#shopping-modal").show();
            // $('#island-menu-div').show();
            $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
            $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);

            ui.updateStore($(`.btn-shopping-modal.active`));
            $(`#recruiting-div`).fadeIn(`slow`);
        }
    });

    $(`#login-modal`).modal({
        show: true,
        backdrop: `static`,
        keyboard: false
    });
    $(`.modal-custom`).on(`show.bs.modal`, (e) => {
        setTimeout(() => {
            $(`.modal-backdrop`).addClass(`modal-backdrop-custom`);
            $(`.modal-custom`).removeClass(`modal-open`);
        });
    });

    $(`#game-over-modal`).modal({
        show: false,
        backdrop: `static`,
        keyboard: false
    });

    $(`#chat-global`).on(`click`, () => {
        toggleGlobalChat();
    });

    $(`#chat-local`).on(`click`, () => {
        toggleLocalChat();
    });

    $(`#chat-clan`).on(`click`, () => {
        toggleClanChat();
    });
    $(`#chat-staff`).on(`click`, () => {
        toggleStaffChat();
    });

    $(`#hide-chat`).on(`click`, () => {
        $(`#show-chat`).show();
        $(`#chat-div`).hide();
    });

    $(`#show-chat`).on(`click`, () => {
        $(`#show-chat`).hide();
        $(`#chat-div`).show();
    });

    $(`#toggle-invite-link-button`).on(`click`, () => {
        if ($(`#invite-div`).is(`:visible`)) {
            $(`#invite-div`).hide();
        } else {
            $(`#invite-link`).val(ui.getInviteLink());
            $(`#invite-div`).show();
        }
    });

    $(`#exit-island-button`).on(`click`, () => {
        departure();
    });

    $(`#toggle-help-button`).on(`click`, () => {
        if ($(`#help-modal`).is(`:visible`)) {
            $(`#help-modal`).hide();
        } else {
            ui.closeAllPagesExcept(`#help-modal`);
            $(`#help-modal`).show();
        }
    });

    $(`#close-help-button`).on(`click`, () => {
        $(`#help-modal`).hide();
    });
    $(`#close-bank-button`).on(`click`, () => {
        $(`#bank-modal`).hide();
    });
    $(`#btn-make-deposit`).on(`click`, () => {
        makeDeposit();
    });
    $(`#btn-take-deposit`).on(`click`, () => {
        takeDeposit();
    });

    $(`#toggle-quest-button`).on(`click`, () => {
        if ($(`#quests-modal`).is(`:visible`)) {
            $(`#quests-modal`).hide();
        } else {
            // after clicking on the quest button, get all information needed for stats from the server
            socket.emit(`get-stats`, (data) => {
                let json_data = JSON.parse(data);
                // pirate quests
                $(`.pirate-progress`).text(json_data.shipsSank);
                $(`.crew-pirate-progress`).text(json_data.overall_kills);
                if (json_data.shipsSank >= 1) {
                    // if pirate quest 1 is achieved, display checkbox icon and show next quest
                    $(`#completed-quest-table`).append($(`#pirate-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#pirate-quest-2`).show();
                    $(`#crew-pirate-quest-1`).show();
                }
                if (json_data.shipsSank >= 5) {
                    $(`#completed-quest-table`).append($(`#pirate-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#pirate-quest-3`).show();
                }
                if (json_data.shipsSank >= 10) {
                    $(`#completed-quest-table`).append($(`#pirate-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#pirate-quest-4`).show();
                }
                if (json_data.shipsSank >= 20) {
                    $(`#completed-quest-table`).append($(`#pirate-quest-4`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }
                if (json_data.overall_kills >= 10) {
                    $(`#completed-quest-table`).append($(`#crew-pirate-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-pirate-quest-2`).show();
                }
                if (json_data.overall_kills >= 20) {
                    $(`#completed-quest-table`).append($(`#crew-pirate-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-pirate-quest-3`).show();
                }
                if (json_data.overall_kills >= 50) {
                    $(`#completed-quest-table`).append($(`#crew-pirate-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }

                // trade quests
                $(`.trade-progress`).text(json_data.overall_cargo);
                $(`.crew-trade-progress`).text(json_data.crew_overall_cargo);
                // after completing quest display new status in quest window
                if (json_data.overall_cargo >= 1000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#trade-quest-2`).show();
                    $(`#crew-trade-quest-1`).show();
                }
                if (json_data.overall_cargo >= 6000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#trade-quest-3`).show();
                }
                if (json_data.overall_cargo >= 15000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#trade-quest-4`).show();
                }
                if (json_data.overall_cargo >= 30000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-4`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }
                if (json_data.crew_overall_cargo >= 12000) {
                    $(`#completed-quest-table`).append($(`#crew-trade-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-trade-quest-2`).show();
                }
                if (json_data.crew_overall_cargo >= 50000) {
                    $(`#completed-quest-table`).append($(`#crew-trade-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-trade-quest-3`).show();
                }
                if (json_data.crew_overall_cargo >= 150000) {
                    $(`#completed-quest-table`).append($(`#crew-trade-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }

                // other quests
                $(`#other-progress-1`).text(myPlayer.jump_count);
                if (myPlayer.jump_count >= 50) {
                    $(`#completed-quest-table`).append($(`#other-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#other-quest-2`).show();
                }
                // other-quest-2 until other-quest-4 are handled in ui.js file
            });
            // after updating stats, show the quests modal
            ui.closeAllPagesExcept(`#quests-modal`);
            $(`#quests-modal`).show();
        }
    });

    $(`#close-quests-button`).on(`click`, () => {
        $(`#quests-modal`).css(`display`, `none`);
    });

    $(`#cancel-exit-button`).on(`click`, () => {
        if ($cancelExitButtonSpan.text() === `Cancel (c)`) {
            socket.emit(`exitIsland`);
            $dockingModalButtonSpan.text(`Countdown...`);
        }
    });

    $(`#abandon-ship-button`).on(`click`, () => {
        if (myBoat.hp <= 0) {
            return;
        }

        if (myPlayer.goods && (myBoat.shipState === 3 || myBoat.shipState === 4)) {
            for (let k in myPlayer.goods) {
                if (myPlayer.goods[k] > 0) {
                    socket.emit(`buy-goods`, {
                        quantity: myPlayer.goods[k],
                        action: `sell`,
                        good: k
                    }, (err, data) => {
                        if (err) {
                            console.log(err);
                        }
                        if (!err) {
                            myPlayer.gold = data.gold;
                            myPlayer.goods = data.goods;
                        }
                    });
                }
            }
        }

        socket.emit(`abandonShip`);

        $(`#abandon-ship-button`).hide();
        if (myBoat !== undefined) {
            if (myBoat.shipState === 3 || myBoat.shipState === -1 || myBoat.shipState === 4) {
                $(`#supply`).tooltip(`show`);
                // $('#island-menu-div').show();
                $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
                $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
                if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
                    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                }
                ui.updateStore($(`.btn-shopping-modal.active`));
            } else if (myBoat.shipState === 1) {
                $(`#docking-modal`).show();
            }
        }
    });

    $(`#lock-krew-button`).on(`click`, () => {
        if ($(`#lock-krew-button`).is(`:checked`)) {
            $(`#lock-krew-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`Unlock krew...`);
            socket.emit(`lock-krew`, true);
        } else {
            $(`#lock-krew-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`Lock krew...`);
            socket.emit(`lock-krew`, false);
        }
    });

    $(`#fp-mode-button`).on(`click`, () => {
        if ($(`#fp-mode-button`).is(`:checked`)) {
            $(`#fp-mode-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`FP Camera (Enabled)`);
        } else {
            $(`#fp-mode-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`FP Camera (Disabled)`);
        }
    });

    localStorage.setItem(`lastAdTime`, Date.now() - 10000000);

    var aiptag = aiptag || {};
    aiptag.cmd = aiptag.cmd || [];
    aiptag.cmd.display = aiptag.cmd.display || [];
    aiptag.cmd.display.push(() => {
        aipDisplayTag.display(`krew-io_300x250`);
    });
    aiptag.gdprShowConsentTool = true; // Show GDPR consent tool
    aiptag.gdprShowConsentToolButton = true;
    initAipPreroll();

    function aipGDPRCallback_OnAccept (googleConsent) {
        if (googleConsent === true) {
            initAipPreroll();
        }
    }

    function initAipPreroll () {
        // console.log("adplayer set?!");
        if (typeof aipPlayer !== `undefined`) {
            adplayer = new aipPlayer({
                AD_WIDTH: 960,
                AD_HEIGHT: 540,
                AD_FULLSCREEN: true,
                PREROLL_ELEM: document.getElementById(`preroll`),
                AIP_COMPLETE: function () {},
                AIP_REMOVE: function () {}
            });
            window.adplayerCentered = new aipPlayer({
                AD_WIDTH: 560,
                AD_HEIGHT: 315,
                AD_FULLSCREEN: false,
                PREROLL_ELEM: document.getElementById(`preroll-centered`),
                AIP_COMPLETE: function () {},
                AIP_REMOVE: function () {}
            });
        }
    }
});

$(`#global-chat-alert`).hide(); // because bootstrap by default un-hides elements inside .tab

var toggleGlobalChat = function () {
    $(`#chat-global`).addClass(`active`);
    $(`#chat-local`).removeClass(`active`);
    $(`#chat-clan`).removeClass(`active`);
    $(`#chat-staff`).removeClass(`active`);

    $(`.global-chat`).show();
    $(`.local-chat`).hide();
    $(`.clan-chat`).hide();
    $(`.staff-chat`).hide();
    staffChatOn = false;
    clanChatOn = false;
    localChatOn = false;
    globalChatOn = true;
    $(`#global-chat-alert`).hide();
};

var toggleLocalChat = function () {
    $(`#chat-global`).removeClass(`active`);
    $(`#chat-clan`).removeClass(`active`);
    $(`#chat-local`).addClass(`active`);
    $(`#chat-staff`).removeClass(`active`);

    $(`.global-chat`).hide();
    $(`.local-chat`).show();
    $(`.clan-chat`).hide();
    $(`.staff-chat`).hide();
    staffChatOn = false;
    clanChatOn = false;
    localChatOn = true;
    globalChatOn = false;
    $(`#local-chat-alert`).hide();
};

var toggleClanChat = function () {
    $(`#chat-global`).removeClass(`active`);
    $(`#chat-local`).removeClass(`active`);
    $(`#chat-clan`).addClass(`active`);
    $(`#chat-staff`).removeClass(`active`);

    $(`.global-chat`).hide();
    $(`.local-chat`).hide();
    $(`.clan-chat`).show();
    $(`.staff-chat`).hide();
    staffChatOn = false;
    clanChatOn = true;
    localChatOn = false;
    globalChatOn = false;
    $(`#clan-chat-alert`).hide();
};

var toggleStaffChat = function () {
    $(`#chat-global`).removeClass(`active`);
    $(`#chat-local`).removeClass(`active`);
    $(`#chat-clan`).removeClass(`active`);
    $(`#chat-staff`).addClass(`active`);

    $(`.global-chat`).hide();
    $(`.local-chat`).hide();
    $(`.clan-chat`).hide();
    $(`.staff-chat`).show();
    staffChatOn = true;
    clanChatOn = false;
    localChatOn = false;
    globalChatOn = false;
    $(`#staff-chat-alert`).hide();
};

let Ease = {
    // no easing, no acceleration
    linear: function (t) {
        return t;
    },

    // accelerating from zero velocity
    easeInQuad: function (t) {
        return t * t;
    },

    // decelerating to zero velocity
    easeOutQuad: function (t) {
        return t * (2 - t);
    },

    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    // accelerating from zero velocity
    easeInCubic: function (t) {
        return t * t * t;
    },

    // decelerating to zero velocity
    easeOutCubic: function (t) {
        return (--t) * t * t + 1;
    },

    // acceleration until halfway, then deceleration
    easeInOutCubic: function (t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },

    // accelerating from zero velocity
    easeInQuart: function (t) {
        return t * t * t * t;
    },

    // decelerating to zero velocity
    easeOutQuart: function (t) {
        return 1 - (--t) * t * t * t;
    },

    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },

    // accelerating from zero velocity
    easeInQuint: function (t) {
        return t * t * t * t * t;
    },

    // decelerating to zero velocity
    easeOutQuint: function (t) {
        return 1 + (--t) * t * t * t * t;
    },

    // acceleration until halfway, then deceleration
    easeInOutQuint: function (t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
};

const { worldsize } = require("../../../../server/core/postConcat");

// Setup some global variables that will be used throughout all the engine.
let renderer, scene, camera, myPlayer, myBoat, domEvents, raycaster, canvas, gl, defaultWidth, defaultHeight;
let SERVER = false;
let playerName = ``;
let countDown = 8;
let threeJSStarted = false;
let markers = {}

// Test adblock.
let adBlockEnabled = false;
let testAd = document.createElement(`div`);
testAd.innerHTML = `&nbsp;`;
testAd.className = `adsblox`;

document.body.appendChild(testAd);
window.setTimeout(() => {
    if(testAd.offsetHeight == 0) adBlockEnabled = true;
    testAd.remove();

    if(adBlockEnabled) {
        $(`#KRW_krew-io_300x250_2`).parent().html(`<img src="./assets/img/251sbb.jpg" alt="" style="width: 100%"/>`);
        $(`#div-gpt-ad-1491569839954-0`).parent().html(`<img src="./assets/img/251s91.jpg" alt="" style="width: 100%"/>`);
        $(`#disable-adblock-message`).show();
    }
}, 1e3);

let createMinimap = () => {
    let map = CanvasMap(document.querySelector(`.minimap`), worldsize, worldsize);
    map.useRadians = true;
    map.zoom = 0.9;

    let middle = worldsize / 2;
    
    let fps = 24;
    let time = performance.now();

    let compass = {
        x: map.text({ x: middle, y: middle, text: `+`, fill: `rgba(84,48,13,0.7)`, size: 260, baseline: `middle` }),
        n: map.text({ x: middle, y: middle - 300, text: `N`, fill: `rgba(84,48,13,0.7)`, size: 160, baseline: `middle` }),
        s: map.text({ x: middle, y: middle + 300, text: `S`, fill: `rgba(84,48,13,0.7)`, size: 160, baseline: `middle` }),
        w: map.text({ x: middle - 300, y: middle, text: `W`, fill: `rgba(84,48,13,0.7)`, size: 160, baseline: `middle` }),
        e: map.text({ x: middle + 300, y: middle, text: `E`, fill: `rgba(84,48,13,0.7)`, size: 160, baseline: `middle` }),
        boundary: map.rect({ x: 0, y: 0, width: worldsize, height: worldsize, stroke: { color: `rgba(84,48,13,1)`, width: 8 } })
    }

    map
        .add(compass.x)
        .add(compass.n)
        .add(compass.s)
        .add(compass.w)
        .add(compass.e)
        .add(compass.boundary);

    let loop = () => {
        if(performance.now() - time > 1e3 / fps) {
            if(entities == undefined) map.elements = {}
            else {
                for(let i in map.elements) {
                    let element = map.elements[i];
                    if((element.netType == 5 || element.netType == 0 || element.netType == 4) && entity == undefined) map.remove(element);
                }

                for(let i in entities) {
                    let entity = entities[i];
                    if(entity.netType == 5) {
                        if(map.elements[i] == undefined) {
                            map
                                .add(map.point({
                                    x: entity.position.x,
                                    y: entity.position.z,
                                    r: entity.dockRadius,
                                    fill: `green`,
                                    id: i,
                                    netType: 5
                                }))
                                .add(map.text({
                                    x: entity.position.x,
                                    y: entity.position.z - 120,
                                    text: entity.name,
                                    fill: `rgba(84, 48, 13, 1)`,
                                    font: `serif`, 
                                    id: `${i}-label`,
                                    size: 140
                                }));
                        }
                    }
                    else if(entity.netType == 4 && entity.type == 4) {
                        if(map.elements[i] == undefined) {
                            map.add(map.text({
                                x: entity.position.x,
                                y: entity.position.z,
                                text: `x`,
                                fill: `rgba(204, 10, 10, 1)`,
                                font: `sans-serif`,
                                id: i,
                                size: 140,
                                netType: 4
                            }));
                        }
                    }
                }

                for(let i in markers) {
                    let marker = markers[i];
                    let element = map.elements[i]
                    if(element == undefined) {
                        map.add(map.point({
                            x: marker.x,
                            y: marker.y,
                            r: 30,
                            d: 0.5,
                            id: i,
                            createTime: performance.now(),
                            fill: `rgba(255, 0, 0, 0.5)`
                        }));
                    }
                    else {
                        if(element.createTime < performance.now() - 1e4) {
                            map.remove(element);
                            delete element;
                        }
                        else {
                            element.r += Math.sin(element.d) * 5;
                            element.d += 0.2;
                        }
                    }
                }
            }

            if(myPlayer && myPlayer.geometry) {
                let position = myPlayer.geometry.getWorldPosition();

                let rotation = myPlayer.parent && myPlayer.parent.netType == 1 && myPlayer.parent.shipState == 0 ? myPlayer.parent.geometry.getWorldRotation().y + Math.PI: myPlayer.geometry.getWorldRotation().y;
                rotation *= -1;

                let playerElement = map.elements[myPlayer.id];
                if(!playerElement) {
                    map.add(map.triangle({
                        x: myPlayer.position.x,
                        y: myPlayer.position.z,
                        size: 60,
                        rotation,
                        fill: `white`,
                        stroke: {
                            color: `black`,
                            width: 15
                        },
                        id: myPlayer.id,
                        netType: 0
                    }));
                }
                else  {
                    playerElement.x = position.x;
                    playerElement.y = position.z;
                    playerElement.rotation = rotation;
                }
            }
            map.draw();
            time = performance.now();
        }
    }
    map.update = loop;
    return map;
}

let timer = setInterval(islandTimer, 1e3);
let cleanup = setInterval(cleanScene, 9e4);

window.logoutUser = () => {
    // Remove the player's cookie.
    ui.invalidateCookie(`username`);
    ui.invalidateCookie(`token`);
    window.location.pathname = `/logout`;
}

let createGame = () => {
    let minimap = createMinimap();

    // Create THREE.js renderer.
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Add option for disabling antialiasing? Could also be left to be disabled globally in the browser.

    // Add renderer to the document.
    document.body.appendChild(renderer.domElement);
    
    // Create the controls object. Configure pointer lock.
    controls = new GameControls();
    setUpKeyboard(renderer);

    // Setup the scene.
    scene = new THREE.Scene();

    // Camera.
    camera = new THREE.PerspectiveCamera(75, 1.8, 0.1, 1e4);
    camera.position.set(0, 10, 0);

    // Raycaster.
    raycaster = new THREE.Raycaster();

    // Setup environmental values.
    setUpEnvironment();

    // Make the renderer fit the window size.
    updateViewport();

    canvas = renderer.domElement;

    gl = canvas.getContext(`webgl2`);
    if(!gl) gl = canvas.getContext(`experimental-webgl`);

    defaultWidth = gl.canvas.width;
    defaultHeight = gl.canvas.height;

    // Render scene.
    lastFrameTime = performance.now();
    let loop = () => {
        // Calcualte delta time since last frame. (Minimum 0.1s).
        let thisFrame = performance.now();
        water.material.uniforms.time.value += 1.0 / 60.0;

        let dt = Math.min((thisFrame - lastFrameTime) / 1e3, 0.1);
        lastFrameTime = thisFrame;

        // Do engine logic.
        iterateEntities(dt);

        // Do particle logic.
        tickParticles(dt);
        minimap.update();

        // Render the scene.
        requestAnimationFrame(loop);
        renderer.clear();
        renderer.render(scene, camera);
    }
    // Execute the loop.
    loop();
}

// Show island window for non-kaptains.
let showIslandMenu = () => {
    $(`.toggle-shop-menu-btn`).removeClass(`disabled`).addClass(`enabled`);
    $(`.toggle-krew-list-btn`)/removeClass(`disabled`).addClass(`enabled`);
    if(entities[myPlayer.parent.anchorIslandId].name == `Labrador`) $(`.toggle-bank-menu-btn`).removeClass(`disabled`).addClass(`enabled`).attr(`data-tooltip`, `Deposit or withdraw gold`);

    $(`.exit-island-btn`).hide();
    ui.updateStore($(`.btn-shopping-modal.active`));
    ui.updateKrewList();
}

let enterIsland = data => {
    if(data.captainId == myPlayerId && myPlayer && myPlayer.parent && myPlayer.parent.shipState != 2) $(`.docking-modal`).show();
    
    if($(`.toggle-shop-modal-btn`).hasClass(`enabled`)) $(`.docking-modal`).hide();

    if(myPlayer) {
        ui.stopAudioFile(`ocean-music`);
        ui.playAudioFile(true, `island-music`);
    }
}

let dockingModalBtn = $(`.docking-modal.btn`);
let dockingModalBtnTxt = dockingModalBtn.find(`span`);

let portName = $(`.port-name`);

let cancelExitBtn = $(`.cancel-exit.btn`);
let cancelExitBtnTxt = cancelExitBtn.find(`span`);

let dockingModal = $(`.docking-modal`);

let cleanScene = () => {
    scene.traverse(node => {
        if(node instanceof THREE.Mesh) {
            for(let i in sceneCanBalls) {
                if(sceneCanBalls[i] == node) {
                    scene.remove(node);
                    delete sceneCanBalls[i];
                }
            }
        }
        if(node instanceof THREE.Line) {
            for(let i in sceneLines) {
                let line = sceneLines[i];
                if(line == node) {
                    scene.remove(node);
                    sceneLines[i].geometry.dispose();
                    delete sceneLines[i];
                }
            }
        }
    });
}

// Calculate values for alive timer.
let pad = val => {
    let valString = val + ``;
    if(valString.length < 2) return `0${valString}`;
    else return valString;
}

let secondsAlive = 0;

let islandTimer = () => {
    // Update the alive timer every second.
    secondsAlive++;
    $(`.timer-seconds`).html(pad(secondsAlive % 60));
    $(`.timer-minutes`).html(pad(parseInt(secondsAlive % 3600 / 60)));
    $(`.timer-hours`).html(pad(parseInt(secondsAlive / 3600)));

    if(myPlayer && myPlayer.parent) {
        if(myPlayer.parent.shipState == -1 || myPlayer.parent.shipState == 3) {
            dockingModalBtn.removeClass(`disabled`).addClass(`enabled`);
            portName.text(entities[myPlayer.parent.anchorIslandId].name);

            dockingModalBtnTxt.text(`Docking...`);
            cancelExitBtnTxt.text(`Sail (c)`);
            return;
        }
        if(myPlayer.parent.netType == 5) {
            portName.text(myPlayer.parent.name);
            if(dockingModal.is(`visible`)) {
                dockingModal.hide();
                showIslandMenu();
            }
        }
        if(dockingModal.hasClass(`initial`)) dockingModal.removeClass(`initial`).find(`.you-are-docked-msg`).remove();
        if(myPlayer.parent.shipState != 1) countDown = 8;
        if(myPlayer.parent.shipState == 1) {
            if(countDown == 8) socket.emit(`dock`);
            cancelExitBtnTxt.text(`Cancel (c)`);

            if(countDown != 0 && countDown > 0) dockingModalBtnTxt.text(`Docking in ${countDown} seconds`);
            else {
                dockingModalBtnTxt.text(`Dock (z)`);
                dockingModalBtn.removeClass(`disabled`).addClass(`enabled`);
            }
            countDown--;
        }

        if(myPlayer.parent.shipState == 4) {
            $(`.docking-modal`).hide();
            if(!$(`.departure.modal`).is(`visible`)) $(`.departure-modal`).show();

            $(`.cancel-departure-btn`).find(`span`).text(`${myPLayer && myPlayer.isCaptain ? `Departing in `: `Krew departing in`} ${entities[myPlayer.id].parent.departureTime} seconds`);
        }

        if(((!myPlayer.isCaptain && myPlayer.parent.shipState != 4) || (myPlayer.isCaptain && myPlayer.parent.shipState == 0)) && $(`.departure-modal`).is(`:visible`)) {
            
        }
    }
}

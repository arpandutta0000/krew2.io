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
        $(`#KRW_krew-io_300x250_2`).parent().html(`<img src="/assets/img/251sbb.jpg" alt="" style="width: 100%"/>`);
        $(`#div-gpt-ad-1491569839954-0`).parent().html(`<img src="/assets/img/251s91.jpg" alt="" style="width: 100%"/>`);
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
                            delete map.elements[i];
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

let timer = setInterval(() => islandTimer(), 1e3);
let cleanup = setInterval(() => cleanScene(), 9e4);

window.logoutUser = () => {
    // Remove the player`s cookie.
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
    if(!scene) return; // Do not clean the scene if it has not been created yet.
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

        if(((!myPlayer.isCaptain && myPlayer.parent.shipState != 4) || (myPlayer.isCaptain && myPlayer.parent.shipState == 0)) && $(`.departure-modal`).is(`:visible`)) $(`.departure-modal`).hide();
    }
}

let departure = () => {
    if(myPlayer && entities[myPlayer.id] & entities[myPlayer.id].parent) {
        ui.playAudioFile(false, `sail`);
        $(`.docking-modal`).hide();

        this.departureCounter = this.departureCounter || 0;
        socket.emit(`depature`, this.departureCounter);

        this.departureCounter++;
        if(this.depatureCounter > 2) this.departureCounter = 0;
    }
}

// Called from connection.js when exitIsland socekt message is received from the server.
let exitIsland = data => {
    // Lock mouse.
    controls.lockMouseLook();

    if(data.captainId == myPlayerId) {
        $(`.docking-modal`).hide();
        $(`.departure-modal`).hide();
    }

    krewListUpdateManually = false;
    ui.hideSuggestionBox = true;

    if(myPlayer) {
        ui.stopAudioFile(`island-music`);
        ui.playAudioFile(true, `ocean-music`);
    }

    $(`.toggle-bank-menu-btn`).removeClass(`enabled`).addClass(`disabled`).attr(`data-tooltip`, `Bank is available at Labrador`);

    $(`.exit-island-btn`).hide();
    $(`.shopping-menu`).hide();
    $(`.krew-list-menu`).hide();

    ui.updateStore($(`.btn-shopping-modal.active`));

    $(`.docking-modal-btn`).removeClass(`enabled`).addClass(`disabled`);
    $(`.toggle-shop-menu-btn`).removeClass(`enabled`).addClass(`disabled`);
    $(`.toggle-krew-list-menu-btn`).removeClass(`enabled`).addClass(`disabled`);
}

let login = () => {
    connect($(`#server-list`).val());
    ui.setQualitySettings();

    $(`.fps-mode-btn`).attr(`checked`, false);
    $(`.quality-list`).val(2);
    $(`.quality-list`).trigger(`change`);
}

let sendMessage = () => {
    socket.emit(`chat message`, {
        message: $(`.chat-message`).val(),
        recipient: staffChatOn ? `staff`: clanChatOn ? `clan`: localChatOn ? `local`: `global`
    });
    $(`.chat-message`).val(``).focus();
}

let makeDeposit = () => {
    let deposit = +$(`.make-deposit`).val();
    let sumDeposits = parseInt($(`.my-deposits`).text()) + deposit;

    if(deposit <= myPlayer.gold && sumDeposits <= 15e4) {
        socket.emit(`bank`, { deposit });
        ui.playAudioFile(false, `deposit`);

        $(`.make-deposit`).val(``).focus();
        $(`.successMakeDepoMess`).show();
        $(`.errorMakeDepoMess`).hide();
        $(`.successTakeDepoMess`).hide();
        $(`.errorTakeDepoMess`).hide();
        $(`.errorFullDepoMess`).hide();
    }
    else if(sumDeposits > 15e4) {
        $(`.errorFullDepoMess`).show();
        $(`.successMakeDepoMess`).hide();
        $(`.errorMakeDepoMess`).hide();
        $(`.successTakeDepoMess`).hide();
        $(`.errorTakeDepoMess`).hide();
    }
    else {
        $(`.errorMakeDepoMess`).show();
        $(`.successMakeDepoMess`).hide();
        $(`.successTakeDepoMess`).hide();
        $(`.errorTakeDepoMess`).hide();
        $(`.errorFullDepoMess`).hide();
    }
}

// Share a link and caption on Facebook.
let fbShare = (message, link) => {
    FB.login(res => {
        let token = res.authResponse.accessToken;

        if(res.authResponse) {
            FB.api(`/me`, `get`, { access_token: token }, res => {});
            FB.ui({
                method: `share_open_graph`,
                action_type: `og.shares`,
                action_properties: JSON.stringify({
                    object: {
                        'og:url': `https://${link}`, // The URL to share.
                        'og:title': `Krew.io`,
                        'og:description': message,
                        'og:image': `https://krew.io/assets/img/logo.png/`
                    }
                })
            });
        }
    }, { scope: `publish_actions` });
}

let isAlphaNumeric = str => {
    let code;

    for(let i = 0; i < str.length; i++) {
        code = str.charCodeAt(i);
        if(!(code > 47 && code < 58) // Numeric (0-9)
        && !(code > 64 && code < 91) // Upper Alphabet (A-Z)
        && !(code > 96 && code < 123)) { // Lower Alphabet (a-z) 
            return false;
        }
    }
    return true;
}

// Once the document has been fulyl loaded. Start the engine initiation process.
$(document).ready(() => {
    loader.loadObjWithMtl(`/assets/models/cannon/cannon.obj`);
    loader.loadObjWithMtl(`/assets/models/hat_pirate.obj`);
    loader.loadObjWithMtl(`/assets/models/ships/bigship.obj`);
    loader.loadObjWithMtl(`/assets/models/ships/schooner.obj`);
    loader.loadObjWithMtl(`/assets/models/ships/sloop.obj`);
    loader.loadObjWithMtl(`/assets/models/ships/vessel.obj`);
    loader.loadObjWithMtl(`/assets/models/fish.obj`);
    loader.loadObjWithMtl(`/assets/models/shell.obj`);
    loader.loadObjWithMtl(`/assets/models/crab.obj`);
    loader.loadObjWithMtl(`/assets/models/clam.obj`);
    loader.loadObjWithMtl(`/assets/models/chest.obj`);
    loader.loadObjWithMtl(`/assets/models/spyglass.obj`);

    // Christmas tree and snowman.
    loader.loadObjWithMtl(`/assets/models/elka.obj`);
    loader.loadObjWithMtl(`/assets/models/snowman.obj`);

    loader.loadModel(`/assets/models/ships/raft.obj`);
    loader.loadModel(`/assets/models/ships/trader.obj`);
    loader.loadModel(`/assets/models/ships/boat.obj`);
    loader.loadModel(`/assets/models/ships/destroyer.obj`);
    loader.loadModel(`/assets/models/island.obj`);
    loader.loadModel(`/assets/models/dogs/dog_1.obj`);
    loader.loadModel(`/assets/models/fishingrod.obj`);

    loader.loadTexture(`/assets/models/colorset.png`);
    loader.loadTexture(`/assets/models/hook.png`);
    loader.loadTexture(`/assets/models/dogs/dog_diffuse.tga`);
    loader.loadTexture(`/assets/models/props_diffuse1.tga`);
    loader.loadTexture(`/assets/img/water.jpg`);
    loader.loadTexture(`/assets/img/cannonball.png`);
    loader.loadTexture(`/assets/img/crate.jpg`);
    loader.loadTexture(`/assets/models/tex_chest.png`);

    loader.onFinish(() => {
        // Create materials and game world.
        createModels();
        createMaterials();
        createGame();

        threeJSStarted = true;
        $(`.play-btn`).text(`Play as guest`).attr(`disabled`, false);
    });

    $(`.show-more`).on(`click`, () => {
        if($(`.show-more`).text().indexOf(`Show more`) > -1) {
            $(`.top20`).show();
            $(`.show-more`).html(`<i class="icofont icofont-medal"></i> Show less`);
        }
        else {
            $(`.top20`).hide();
            $(`.show-more`).html(`<i class="icofont icofont-medal</i> Show more`);
        }

        $(`.chat-message`).on(`keyup`, () => {
            let $this = $(this);
            let val = $this.val();

            if(val.trim().length > 150) $this.val(val.slice(0, 150));
        });

        // Play by pressing login button.
        $(`.play-btn`).on(`click`, () => {
            GameAnalytics(`addDesignEvent`, `Game:Session:ClickedPlayButton`);
            if(threeJSStarted) {
                login();
                setUpKeybinds();
                ui.LoadingWheel(`show`);
                ui.playAudioFile(false, `wheelspin`);
                ui.playAudioFile(true, `ocean-ambience`);
            }
        }).text(`Loading...`).attr(`disabled`, true);

        $(`.play-again-btn`).on(`click`, () => {
            if(threeJSStarted) {
                ui.showAdinplayCentered();
                secondsAlive = 0;
                socket.emit(`respawn`);
                myPlayer.itemId = undefined;
                myPlayer.state = 2;

                $(`.toggle-shop-modal-btn`).removeClass(`enabled`).addClass(`disabled`);
                $(`.toggle-krew-list-modal-btn`).removeClass(`enabled`).addClass(`disabled`);
                $(`.toggle-bank-modal-btn`).removeClass(`enabled`).addClass(`disabled`).attr(`data-tooltip`, `Bank is available at Labrador`);
            }
        });

        $(`.share-link`).on(`click`, () => {
            let message = `I just had an amazing game of Krew.io and my score was ${lastScore}!`;
            let link = `${window.location.hostname}/`;
            fbShare(message, link);
            ui.showAdinplayCentered();
            secondsAlive = 0;

            socket.emit(`respawn`);
            myPlayer.state = 2;
            myPlayer.itemId = undefined;

            $(`.toggle-shop-modal-btn`).removeClass(`enabled`).addClass(`disabled`);
            $(`.toggle-krew-list-modal-btn`).removeClass(`enabled`).addClass(`disabled`);
            $(`.toggle-bank-modal-btn`).removeClass(`enabled`).addClass(`disabled`).attr(`data-tooltip`, `Bank is available at Labrador`);

            ui.updateStore($(`.btn-shopping-modal.active`));
            
            $(`.krew-list-modal`).show();
            ui.updateKrewList();
        });

        $(`.quality-list`).on(`change`, () => {
            let newW = defaultWidth / 2.5;
            let newH = defaultHeight / 2.5;
            switch(parseInt($(`.quality-list`).val())) {
                case 2: {
                    newW = defaultWidth / 1.45;
                    newH = defaultWidth / 1.45;
                    break;
                }
                case 3: {
                    newW = defaultWidth;
                    newH = defaultWidth;
                    break;
                }
            }
            
            if(gl != undefined) {
                gl.canvas.height = newH;
                gl.canvas.width = newW;

                gl.viewport(0, 0, newW, newH); // Originally newW, newW.
                renderer.setSize(newW, newH, false); // Originally newW, newW.
            }
        });

        $(`.share-invite-link`).on(`click`, () => {
            let message = `Join my krew!`;
            let link = ui.getInviteLink();
            fbShare(message, link);
        });

        // Initialize listeners for the UI.
        ui.setListeners();

        $(window).on(`unload`, () => {
            if(socket) socket.close();
        });

        // Submit on enter key.
        $(`.chat-message`).on(`keypress`, e => {
            if(e.keyCode == 13) sendMessage();
        });
        $(`.make-deposit`).on(`keypress`, e => {
            if(e.keyCode == 13) makeDeposit();
        });
        $(`.take-deposit`).on(`keypress`, e => {
            if(e.keyCode == 13) takeDeposit();
        });

        ui.updateServerList();
        ui.createWallOfFame();

        // Sen chat message by pressing send message button.
        $(`.send-message-btn`).on(`click`, () => {
            sendMessage();
        });

        if(getUrlVars().sid && getUrlVars().bid) {
            // If invite link is being used.
            $(`.invite-is-used`).show();
            $(`.select-server`).hide();
            $(`.select-spawn`).hide();
        }

        $(`.crew-count, .ship-health`).slider();

        $(`.crew-count`).on(`slide`, e => $(`.crew-count-val`).text(e.value));
        $(`.ship-health`).on(`slide`, e => $(`.ship-health-val`).text(e.value));

        let shoppingModalBtn = $(`.btn-shopping-modal`);
        shoppingModalBtn.each(() => {
            let $this = $(this);
            $this.on(`click`, () => {
                shoppingModalBtn.removeClass(`active`);
                $this.addClass(`active`);
                ui.updateStore($this);
            });
        });

        $(`.docking-modal-btn`).on(`click`, () => {
            if($(`.docking-modal-btn`).hasClass(`enabled`)) {
                if(myPlayer && myPlayer.parent) {
                    ui.playAudioFile(false, `dock`);
                    socket.emit(`anchor`);
                    shoppingModalBtn.eq(2).trigger(`click`);

                    if(entities[myPlayer.parent.anchorIslandId].name == `Labrador`) $(`.toggle-bank-modal-btn`).removeClass(`disabled`).addClass(`enabled`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                    if(myPlayer.parent.netType == 1 && !$(`.exit-island-btn`).is(`:visible`)) $(`.exit-island-btn`).show();
                }

                lastScore = 0;
                controls.unLockMouseLook();

                $(`.docking-modal`).hide();
                $(`.supply`).tooltip(`show`);

                $(`.toggle-shop-modal-btn`).removeClass(`disabled`).addClass(`enabled`);
                $(`.toggle-krew-list-modal-btn`).removeClass(`disabled`).addClass(`enabled`);

                ui.updateStore($(`.btn-shopping-modal.active`));
                $(`.recruiting-wrapper`).fadeIn(`slow`);
            }
        });

        $(`.login-modal`).modal({
            show: true,
            backdrop: `static`,
            keyboard: false
        });
        $(`.modal-custom`).on(`show.bs.modal`, e => {
            setTimeout(() => {
                $(`.modal-backdrop`).addClass(`modal-backdrop-custom`);
                $(`.modal-custom`).removeClass(`modal-open`);
            });
        });

        $(`.game-over-modal`).modal({
            show: false,
            backdrop: `static`,
            keyboard: false
        });

        $(`.chat-global`).on(`click`, () => toggleGlobalChat());
        $(`.chat-local`).on(`click`, () => toggleLocalChat());
        $(`.chat-clan`).on(`click`, () => toggleClanChat());
        $(`.chat-staff`).on(`click`, () => toggleStaffChat());

        $(`.hide-chat`).on(`click`, () => {
            $(`.show-chat`).show();
            $(`.chat-wrapper`).hide();
        });
        $(`.show-chat`).on(`click`, () => {
            $(`.hide-chat`).show();
            $(`.chat-wrapper`).show();
        });

        $(`.toggle-invite-link-btn`).on(`click`, () => {
            if($(`.invite-wrapper`).is(`:visible`)) $(`.invite-wrapper`).hide();
            else {
                $(`.invite-link`).val(ui.getInviteLink());
                $(`.invite-wrapper`).show();
            }
        });

        $(`.exit-island-btn`).on(`click`, () => departure());

        $(`.toggle-help-btn`).on(`click`, () => {
            if($(`.help-modal`).is(`:visible`)) $(`.help-modal`).hide();
            else {
                ui.closeAllPagesExcept(`.help-modal`);
                $(`.help-modal`).show();
            }
        });

        $(`.close-help-btn`).on(`click`, () => $(`.help-modal`).hide());
        $(`.close-bank-btn`).on(`click`, () => $(`.bank-modal`).hide());
        $(`.btn-make-deposit`).on(`click`, () => makeDeposit());
        $(`.btn-take-deposit`).on(`click`, () => takeDeposit());

        $(`.toggle-quest.btn`).on(`click`, () => {
            if($(`.quest-modal`).is(`:visible`)) $(`.quest-modal`).hide();
            else {
                // After clicking on the quest button, get all information needed for stats from the server.
                socket.emit(`getStats`, data => {
                    let jsonData = JSON.parse(data);

                    // Pirate quests.
                    $(`.pirate-progress`).text(jsonData.shipsSank);
                    $(`.crew-pirate-progress`).text(jsonData.overallKills);

                    if (json_data.shipsSank >= 1){
                        // If pirate quest 1 is achieved, display the checkbox icon and show the next quest.
                        $(`#completed-quest-table`).append($(`#pirate-quest-1`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#pirate-quest-2`).show();
                        $(`#crew-pirate-quest-1`).show();
                    }
                    if (json_data.shipsSank >= 5){
                        $(`#completed-quest-table`).append($(`#pirate-quest-2`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#pirate-quest-3`).show();
                    }
                    if (json_data.shipsSank >= 10){
                        $(`#completed-quest-table`).append($(`#pirate-quest-3`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#pirate-quest-4`).show();
                    }
                    if (json_data.shipsSank >= 20){
                        $(`#completed-quest-table`).append($(`#pirate-quest-4`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    }
                    if (json_data.overall_kills >= 10){
                        $(`#completed-quest-table`).append($(`#crew-pirate-quest-1`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#crew-pirate-quest-2`).show();
                    }
                    if (json_data.overall_kills >= 20){
                        $(`#completed-quest-table`).append($(`#crew-pirate-quest-2`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#crew-pirate-quest-3`).show();
                    }
                    if (json_data.overall_kills >= 50){
                        $(`#completed-quest-table`).append($(`#crew-pirate-quest-3`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    }

                    // Trade quests.
                    $(`.trade-progress`).text(json_data.overall_cargo);
                    $(`.crew-trade-progress`).text(json_data.crew_overall_cargo);

                    // After completing the quest, display the new status in the quest window.
                    if (json_data.overall_cargo >= 1000){
                        $(`#completed-quest-table`).append($(`#trade-quest-1`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#trade-quest-2`).show();
                        $(`#crew-trade-quest-1`).show();
                    }
                    if (json_data.overall_cargo >= 6000){
                        $(`#completed-quest-table`).append($(`#trade-quest-2`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#trade-quest-3`).show();
                    }
                    if (json_data.overall_cargo >= 15000){
                        $(`#completed-quest-table`).append($(`#trade-quest-3`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#trade-quest-4`).show();
                    }
                    if (json_data.overall_cargo >= 30000){
                        $(`#completed-quest-table`).append($(`#trade-quest-4`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    }
                    if (json_data.crew_overall_cargo >= 12000){
                        $(`#completed-quest-table`).append($(`#crew-trade-quest-1`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#crew-trade-quest-2`).show();
                    }
                    if (json_data.crew_overall_cargo >= 50000){
                        $(`#completed-quest-table`).append($(`#crew-trade-quest-2`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#crew-trade-quest-3`).show();
                    }
                    if (json_data.crew_overall_cargo >= 150000){
                        $(`#completed-quest-table`).append($(`#crew-trade-quest-3`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    }
    
                    // Other quests.
                    $(`#other-progress-1`).text(myPlayer.jump_count);
                    if (myPlayer.jump_count >= 50){
                        $(`#completed-quest-table`).append($(`#other-quest-1`).last());
                        $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                        $(`#other-quest-2`).show();
                    }
                });
            }
        });

        $(`.close-quests-btn`).on(`click`, () => $(`.quests-modal`).css(`display`, `none`));

        $(`.cancel-exit-btn`).on(`click`, () => {
            if(cancelExitBtnTxt.text() == `Cancel (c)`) {
                socket.emit(`exitIsland`);
                dockingModalBtnTxt.text(`Countdown...`);
            }
        });

        $(`.abandon-ship-btn`).on(`click`, () => {
            if(myBoat.hp <= 0) return;
            if(myPlayer.goods && (myBoat.shipState == 3 || myBoat.shipState == 4)) {
                for(let i in myPlayer.goods) {
                    if(myPlayer.goods[i] > 0) {
                        socket.emit(`buyGoods`, {
                            quantity: myPlayer.goods[i],
                            action: `sell`,
                            good: i
                        }, (err, data) => {
                            if(err) return console.log(err);
                            myPlayer.gold = data.gold;
                            myPlayer.goods = data.goods;
                        });
                    }
                }
            }

            socket.emit(`abandonShip`);
            $(`.abandon-ship-btn`).hide();

            if(myBoat != undefined) {
                if(myBoat.shipState == 3 || myBoat.shipState == -1 || myBoat.shipState == 4) {
                    $(`.supply`).tooltip(`show`);

                    $(`.toggle-shop-modal-btn`).removeClass(`disabled`).addClass(`enabled`);
                    $(`.toggle-krew-list-modal-btn`).removeClass(`disabled`).addClass(`enabled`)

                    if(entities[myPlayer.parent.anchorIslandId].name == `Labrador`) $(`.toggle-bank-modal-btn`).removeClass(`disabled`).addClass(`enabled`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                    ui.updateStore($(`.btn-shopping-modal.active`));
                }
                else if(myBoat.shipState == 1) $(`.docking-modal`).show();
            }
        });
    });

    $(`.lock-krew-btn`).on(`click`, () => {
        if($(`.lock-krew-btn`).is(`:checked`)) {
            $ (`lock-krew-text`).removeClass(`text-info`).addClass(`text-danger`).text(`Unlock krew...`);
            socket.emit(`lockKrew`, true);
        }
        else {
            $ (`lock-krew-text`).removeClass(`text-info`).addClass(`text-danger`).text(`Lock krew...`);
            socket.emit(`lockKrew`, false);
        }
    });
    localStorage.setItem(`lastAdTime`, Date.now() - 1e7);

    let aiptag = aiptag || {};
    aiptag.cmd = aiptag.cmd || [];
    aiptag.cmd.display = aiptag.cmd.display || [];
    aiptag.cmd.display.push(() => aipDisplayTag.display(`krew-io_300x250`));
    aiptag.gdprShowConsentTool = true; // Show the GDPR consent tool.
    aiptag.gdprShowConsentToolButton = true;
    initAipPreroll();

    let aipGDPRCallback_OnAccept = googleConsent => {
        if(googleConsent) initAipPreroll();
    }

    let initAipPreroll = () => {
        if(typeof aipPlayer != `undefined`) {
            adplayer = new aipPlayer({
                AD_WIDTH: 960,
                AD_HEIGHT: 540,
                AD_FULLSCREEN: true,
                PREROLL_ELEM: document.querySelector(`#preroll`),
                AIP_COMPLETE: () => {},
                AIP_REMOVE: () => {}
            });
            window.adplayerCentered = new aipPlayer({
                AD_WIDTH: 560,
                AD_HEIGHT: 315,
                AD_FULLSCREEN: false,
                PREROLL_ELEM: document.querySelector(`#preroll-centered`),
                AIP_COMPLETE: () => {},
                AIP_REMOVE: () => {}
            });
        }
    }
});

// Bootstrap shows elements inside .tab by default.
$(`.global-chat-alert`).hide();

let toggleGlobalChat = () => {
    $(`.chat-global`).addClass(`active`);
    $(`.chat-local`).removeClass(`active`);
    $(`.chat-clan`).removeClass(`active`);
    $(`.chat-staff`).removeClass(`active`);

    $(`.chat-global`).show();
    $(`.chat-local`).hide();
    $(`.chat-clan`).hide();
    $(`.chat-staff`).hide();

    globalChatOn = true;
    localChatOn = false;
    clanChatOn = false;
    staffChatOn = false;

    $(`.global-chat-alert`).hide();

    // Scroll down to the bottom of the chat.
    $(`.chat-history`).scrollTop(() => {
        return this.scrollHeight;
    });
}

let toggleLocalChat = () => {
    $(`.chat-global`).removeClass(`active`);
    $(`.chat-local`).addClass(`active`);
    $(`.chat-clan`).removeClass(`active`);
    $(`.chat-staff`).removeClass(`active`);

    $(`.chat-global`).hide();
    $(`.chat-local`).show();
    $(`.chat-clan`).hide();
    $(`.chat-staff`).hide();

    globalChatOn = false;
    localChatOn = true;
    clanChatOn = false;
    staffChatOn = false;

    $(`.local-chat-alert`).hide();

    // Scroll down to the bottom of the chat.
    $(`.chat-history`).scrollTop(() => {
        return this.scrollHeight;
    });
}

let toggleClanChat = () => {
    $(`.chat-global`).removeClass(`active`);
    $(`.chat-local`).removeClass(`active`);
    $(`.chat-clan`).addClass(`active`);
    $(`.chat-staff`).removeClass(`active`);

    $(`.chat-global`).hide();
    $(`.chat-local`).hide();
    $(`.chat-clan`).show();
    $(`.chat-staff`).hide();

    globalChatOn = false;
    localChatOn = false;
    clanChatOn = true;
    staffChatOn = false;

    $(`.clan-chat-alert`).hide();

    // Scroll down to the bottom of the chat.
    $(`.chat-history`).scrollTop(() => {
        return this.scrollHeight;
    });
}

let toggleStaffChat = () => {
    $(`.chat-global`).addClass(`active`);
    $(`.chat-local`).removeClass(`active`);
    $(`.chat-clan`).removeClass(`active`);
    $(`.chat-staff`).addClass(`active`);

    $(`.chat-global`).hide();
    $(`.chat-local`).hide();
    $(`.chat-clan`).hide();
    $(`.chat-staff`).show();

    globalChatOn = false;
    localChatOn = false;
    clanChatOn = false;
    staffChatOn = true;

    $(`.staff-chat-alert`).hide();

    // Scroll down to the bottom of the chat.
    $(`.chat-history`).scrollTop(() => {
        return this.scrollHeight;
    });
}

let Ease = {
    // No easing, no acceleration.
    linear: function (t) { return t; },

    // Accelerating from zero velocity.
    easeInQuad: function (t) { return t * t; },

    // Decelerating to zero velocity.
    easeOutQuad: function (t) { return t * (2 - t); },

    // Acceleration until halfway, then deceleration.
    easeInOutQuad: function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },

    // Accelerating from zero velocity.
    easeInCubic: function (t) { return t * t * t; },

    // Decelerating to zero velocity.
    easeOutCubic: function (t) { return (--t) * t * t + 1; },

    // Acceleration until halfway, then deceleration.
    easeInOutCubic: function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },

    // Accelerating from zero velocity.
    easeInQuart: function (t) { return t * t * t * t; },

    // Decelerating to zero velocity.
    easeOutQuart: function (t) { return 1 - (--t) * t * t * t; },

    // Acceleration until halfway, then deceleration.
    easeInOutQuart: function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t; },

    // Accelerating from zero velocity.
    easeInQuint: function (t) { return t * t * t * t * t; },

    // Decelerating to zero velocity.
    easeOutQuint: function (t) { return 1 + (--t) * t * t * t * t; },

    // Acceleration until halfway, then deceleration.
    easeInOutQuint: function (t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t; },
}

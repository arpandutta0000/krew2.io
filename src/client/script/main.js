/* Create global variables used throughout the client*/
let renderer, scene, camera, myPlayer, myBoat, domEvents, raycaster, canvas, gl, defaultWidth, defaultHeight, SERVER;
let markers, geometry, materials, labelcolors, vectors = {};
let threejsStarted = false;
let countDown = 10;
let playerName = ``;

/* When document is ready */
$(document).ready(() => {
    // Setup custom modal attributes
    $(`.modal-custom`).on(`show.bs.modal`, (e) => {
        setTimeout(() => {
            $(`.modal-backdrop`).addClass(`modal-backdrop-custom`);
            $(`.modal-custom`).removeClass(`modal-open`);
        });
    });

    // Load all models
    loadModels();

    // Update server list
    ui.updateServerList();

    // Create the wall of fame
    ui.createWallOfFame();

    // Init ui listeners
    ui.setListeners();
    preGamplayUiInit();
    gameplayUiInit();
    ecoUiInit();

    // Check if an invite link is being used
    if (getUrlVars().sid && getUrlVars().bid) {
        $(`#invite-is-used`).show();
        $(`#select-server`).hide();
        $(`#select-spawn`).hide();
    }

    // Check if user is using adblock
    adBlockCheck();

    // Init ads
    initAds();

    // Hide bootstrao elements as bootstrap by default un-hides elements inside .tab
    $(`#global-chat-alert`).hide();

    // Close socket connection on unload
    $(window).on(`unload`, () => {
        if (socket) {
            socket.close();
        }
    });
});
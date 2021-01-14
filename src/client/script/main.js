/* When document is ready */
$(document).ready(() => {
    console.log(`poggers bro`);
    // Setup custom modal attributes
    // $(`.modal-custom`).on(`show.bs.modal`, (e) => {
    //     setTimeout(() => {
    //         $(`.modal-backdrop`).addClass(`modal-backdrop-custom`);
    //         $(`.modal-custom`).removeClass(`modal-open`);
    //     });
    // });

    // Load all models
    loadModels();

    // Init main ui listener
    ui.setListeners();

    // Update server list
    ui.updateServerList();

    // Create the wall of fame
    ui.createWallOfFame();

    // Init other ui listeners
    preGamplayUiInit();

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

    $(`#login-modal`).modal(`show`);

    // Close socket connection on unload
    $(window).on(`unload`, () => {
        if (socket) {
            socket.close();
        }
    });
});
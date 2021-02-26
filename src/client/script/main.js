/* When document is ready */
$(document).ready(() => {
    // If not on localhost, clear console and init ads
    if (window.location.hostname !== `localhost`) {
        console.clear();
        adBlockCheck();
        initAds();
        if (
            !window.location.hostname.endsWith(`krew.io`) ||
            window.location != window.parent.location ||
            window.frameElement != null ||
            self != top
        ) $(`#play-on-krewio-message`).show();
    }

    // Print console header
    printConsoleHeader();

    // Load all models
    loadModels();

    // Init main ui listener
    ui.setListeners();

    // Update server list
    splash.updateServerList();

    // Create the wall of fame
    splash.createWallOfFame();

    // Close socket connection on unload
    $(window).on(`unload`, () => {
        if (socket) socket.close();
    });
});
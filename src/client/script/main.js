/* When document is ready */
$(document).ready(() => {
    // Clear console
    console.clear();

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

    // Check if player is on Krew.io and not a game portal
    if (!window.location.hostname.endsWith(`krew.io`)) $(`#play-on-krewio-message`).show();

    // Check if user is using adblock
    adBlockCheck();

    // Init ads
    initAds();

    // Close socket connection on unload
    $(window).on(`unload`, () => {
        if (socket) socket.close();
    });
});
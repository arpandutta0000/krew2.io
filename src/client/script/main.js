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

    // Check if user is using adblock
    adBlockCheck();

    // Init ads
    initAds();

    // Close socket connection on unload
    $(window).on(`unload`, () => {
        if (socket) socket.close();
    });
});

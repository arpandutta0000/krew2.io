/**
 * Variables
 */
let socket;
let entities = {};
let headers = {};

/**
 * On document ready
 */
$(document).ready(() => {
    // Print console header
    console.log(`\n\n\n███████╗████████╗ █████╗ ███████╗███████╗    ██╗   ██╗██╗\n██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔════╝    ██║   ██║██║\n███████╗   ██║   ███████║█████╗  █████╗      ██║   ██║██║\n╚════██║   ██║   ██╔══██║██╔══╝  ██╔══╝      ██║   ██║██║\n███████║   ██║   ██║  ██║██║     ██║         ╚██████╔╝██║\n╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝          ╚═════╝ ╚═╝\n\nStaff UI v1.0\n\n\n\n`)

    // Call authentication method
    authenticate();

    // Init UI listeners
    ui.initListeners();

    // Update the server list every 30 seconds
    ui.updateServerList();
    setInterval(ui.updateServerList, 3e4);
});

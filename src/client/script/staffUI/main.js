/**
 * Variables
 */
let socket;
let entities = {};
let headers = {};

/**
 * On document ready
 */
$(document).ready(async () => {
    // Call authentication method
    authenticate();

    // Update the server list every 30 seconds
    ui.updateServerList();
    setInterval(ui.updateServerList, 3e4);

    $(`#connect-button`).on(`click`, () => {
        /* Connect to a server */
        initConnection($(`#server-list`).val());
    });
});

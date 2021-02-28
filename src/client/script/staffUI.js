/**
 * Variables
 */
let socket;
let headers = {};

/**
 * Parse URL info
 */
let getUrlVars = () => {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => vars[key] = value);
    return vars;
};

let authenticate = () => $.get(`${window.location.href.replace(/\?.*/, ``).replace(/#.*/, ``).replace(/\/$/, ``).replace(`/staff`, ``)}/authenticated`).then((response) => {
    headers.username = !response.isLoggedIn ? undefined : response.username;
    headers.password = !response.isLoggedIn ? undefined : response.password;
});

/**
 * Update server list
 */
let updateServerList = () => {
    $.ajax({
        url: `${window.location.href.replace(/\?.*/, ``).replace(/#.*/, ``).replace(/\/$/, ``).replace(`/staff`, ``)}/get_servers`,
        data: {
            gameId: `59a714c837cc44805415df18`
        },
        dataType: `jsonp`,
        type: `GET`,
        success: function (servers) {
            ui.servers = servers;

            let serverSelected = false;
            $(`#server-list`).html(``);

            let i = 0;
            let pid;
            for (pid in servers) {
                let server = servers[pid];

                i++;
                let $option = $(`<option/>`, {
                    html: `Server ${i} (${server.playerCount}/${server.maxPlayerCount})`,
                    value: pid
                });

                $(`#server-list`).append($option);
                if (!serverSelected && server.playerCount < server.maxPlayerCount) {
                    $(`#server-list`).val(pid);
                    serverSelected = true;
                }
            }
        }
    });
};

/**
 * Initate a connection to socket
 * 
 * @param {number} pid Server pid
 */
let initConnection = (pid) => {
    // Return if a player is already in game
    if (socket !== undefined) return;

    // Connect to each IP to request a load
    if (getUrlVars().pid && ui.serverList[getUrlVars().pid]) pid = getUrlVars().pid;

    // Set server
    let server = ui.servers[pid];

    // Checks if server is localhost
    if (window.location.hostname === `localhost`) {
        server = {
            ip: `http://localhost`,
            port: `2053`,
            playerCount: Object.values(ui.servers)[0].playerCount,
            maxPlayerCount: Object.values(ui.servers)[0].maxPlayerCount
        };
    }

    // Set URL
    let url = window.location.hostname === `localhost` ? `http://localhost` : config.url;

    // Add port
    if (parseInt(server.port) !== 80) {
        url += `:${server.port}`;
    }

    // Establish socket connection
    socket = io.connect(url, {
        secure: true,
        rejectUnauthorized: false,
        withCredentials: true,
        auth: {
            type: `staffUI`,
            username: headers.username,
            password: headers.password
        }
    });
};

/**
 * UI Object
 */
let ui = {

};

$(document).ready(async () => {
    await authenticate();
    await updateServerList();

    $(`#connect-button`).on(`click`, () => {
        /* Connect to a server */
        initConnection($(`#server-list`).val());
    })
});
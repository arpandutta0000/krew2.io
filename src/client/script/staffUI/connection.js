/**
 * Initate a connection to socket
 *
 * @param {number} pid Server pid
 */
let initConnection = (pid) => {
    // Disconnect socket if already connected
    if (socket !== undefined) socket.disconnect();

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

    initSocketBinds(socket);
};

/**
 * Initiate socket binds
 *
 * @param {object} socket Socket object
 */
let initSocketBinds = (socket) => {
    // On snaps
    socket.on(`s`, (data) => {
        data = JSON.parse(LZString.decompress(data));
        for (let e in data) parseSnap(e, data[e])
    });

    // On score updates
    socket.on(`scores`, (data) => {
        data = JSON.parse(LZString.decompress(data));
        for (let e in data.players) parseScores(data.players[e]);
        for (let e in data.boats) parseScores(data.boats[e]);
    });
}

/**
 * Parse URL info
 */
let getUrlVars = () => {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => vars[key] = value);
    return vars;
};

/**
 * Authenticate session
 */
let authenticate = () => $.get(`${window.location.href.replace(/\?.*/, ``).replace(/#.*/, ``).replace(/\/$/, ``).replace(`/staff`, ``)}/authenticated`).then((response) => {
    headers.username = !response.isLoggedIn ? undefined : response.username;
    headers.password = !response.isLoggedIn ? undefined : response.password;
});
/**
 * Connect to a server
 *
 * @param {number} pid Server pid
 */
let connect = function (pid) {
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
        withCredentials: true
    });

    // Call socket binds init
    initSocketBinds();

    // Init controls
    controls = new GameControls();
    setUpKeyboard();

    // Show game ui
    $(`#game-ui`).show();
    $(`#splash-modal`).modal(`hide`);
    document.getElementById ("cross-promo").style.display = "none";
    document.getElementById ("krew-io_300x600").style.display = "none";

    // Log connection info
    console.log(`\n\nSuccessfully connected!\nGood luck sailor! ⛵\n\nConnection information:\nPort: ${server.port}\nPlayers: ${server.playerCount}\nMax Players: ${server.maxPlayerCount}\n\n\n`);
};

/**
 * Initiate socket binds
 */
let initSocketBinds = () => {
    // When server sends handshake paket
    socket.on(`handshake`, (msg) => {
        console.log(`Jumped into handshake!`);

        // Confirmation message on unload
        $(window).on(`beforeunload`, () => `Do you really want to leave your ship and lose your progress?`);

        // Delete all entities
        deleteEverything();

        // Get player ID
        myPlayer = undefined;
        myPlayerId = msg.socketId;

        // Create player entity
        socket.emit(`createPlayer`, {
            boatId: getUrlVars().bid,
            name: !headers.username ? undefined : headers.username,
            password: !headers.password ? undefined : headers.password,
            spawn: splash.setSpawnPlace()
        });
        secondsAlive = 0;

        socket.on(`startGame`, () => {
            splash.loadingWheel(`hide`);
            notifications.showCenterMessage(
                `Use WASD to move. Press space to jump. Left click to shoot/fish. Use 1, 2, and 3 to switch tools. For more help click the help icon above. Good luck Sailor!`,
                4,
                2e4
            );
            getPing();
        });

        // Start pings for ping stat
        let pings = [];
        let recievedPong = false;
        let startTime;

        // Battle music helper variables
        let lastHit = 0;
        let hitCount = 0;
        let inBattle = false;

        let getPing = () => {
            if (!recievedPong && pings[0]) $(`#ping-wrapper > span`).text(`LOST CONNECTION`);
            startTime = Date.now();
            recievedPong = false;
            socket.emit(`ping`);
        };

        setInterval(getPing, 10e3);

        socket.on(`pong`, () => {
            let latency = Date.now() - startTime;
            pings.push(latency);
            recievedPong = true;

            if (pings.length > 3) pings.shift();
            $(`#ping-wrapper > span`).text(`${Math.round(pings.reduce((a, b) => a + b) / pings.length)} MS`);
        });

        // Get existing players data
        socket.on(`playerNames`, (data) => {
            playerNames = data;
        });

        // When the server sends a snapshot
        socket.on(`s`, (data) => {
            // Decompress snapshot data
            data = JSON.parse(LZString.decompress(data));
            for (let e in data) {
                // Call parsesnap function
                parseSnap(e, data[e]);
            }
        });

        // On disconnect delete all entities
        socket.on(`disconnect`, deleteEverything);

        // On end end the game
        socket.on(`end`, endTheGame);

        // On scores update decompress packet data
        socket.on(`scores`, (data) => {
            data = JSON.parse(LZString.decompress(data));
            updateLeaderboard(data);
        });

        // Update bank data
        socket.on(`setBankData`, (data) => setBankData(data));

        // Update list of krews/leaderboard
        socket.on(`updateKrewsList`, () => updateKrewList());

        // Goods update
        socket.on(`cargoUpdated`, () => {
            if ($(`#buy-goods`).hasClass(`active`)) GoodsComponent.getList();
        });

        // Enter island event
        socket.on(`enterIsland`, (data) => enterIsland(data));

        // Open island menu event
        socket.on(`showIslandMenu`, () => showIslandMenu());

        // Close shopping windows of the players that are exiting the island
        socket.on(`exitIsland`, (data) => exitIsland(data));

        // Show video ad
        socket.on(`showAdinplayCentered`, () => showAdinplayCentered());

        // Set departure timer
        socket.on(`departureWarning`, () => {
            if ($(`#toggle-krew-list-modal-button`).hasClass(`enabled`)) {
                $(`#toggle-krew-list-modal-button`).addClass(`glowing`);
                setTimeout(() => {
                    $(`#toggle-krew-list-modal-button`).removeClass(`glowing`);
                }, 5000);
            }
        });

        // On a center message (Game info, server restarts, achievements, etc)
        socket.on(`showCenterMessage`, (message, type, time) => {
            if (ui && notifications.showCenterMessage) notifications.showCenterMessage(message, type || 3, time);
            if (message.startsWith(`Achievement trading`)) $(`#shopping-modal`).hide();
        });

        // Show death messages
        socket.on(`showKillMessage`, (killChain) => {
            if (ui && notifications.showKillMessage && !$(`#game-ui`).is(`:hidden`)) notifications.showKillMessage(killChain);
        });

        // Play damage sounds and show hit info
        socket.on(`showDamageMessage`, (message, type) => {
            if (ui && notifications.showDamageMessage) {
                if (type === 2)
                    audio.playAudioFile(false, true, 1, `cannon-hit`);

                notifications.showDamageMessage(message, type);

                lastHit = Date.now();
                if (!inBattle) {
                    if (hitCount >= 1 && Date.now() - lastHit < 1e4) {
                        inBattle = true;
                        hitCount = 0;
                        audio.changeMusic(`battle`, false);
                    } else hitCount++;
                }
            }
        });

        setInterval(() => {
            if (inBattle && Date.now() - lastHit > 1e4) {
                inBattle = false;
                if (myPlayer && myPlayer.parent && (myPlayer.parent.shipState === 3 || myPlayer.parent.shipState === 4)) audio.changeMusic(`island`, true);
                else audio.changeMusic(`ocean`, true);
            }
        }, 5e3);

        // Admin says
        socket.on(`showAdminMessage`, (message) => {
            if (ui && notifications.showAdminMessage) notifications.showAdminMessage(message);
        });

        // On a level up play sound and show level up text
        socket.on(`levelUpdate`, (data) => {
            if (entities[data.id] !== undefined && entities[data.id].netType === 0) {
                entities[data.id].level = data.level;
                if (data.id === myPlayerId) {
                    audio.playAudioFile(false, true, 0.9, `level-up`);
                    myPlayer.updateExperience();
                    myPlayer.notifiscationHeap[
                        Math.random().toString(36).substring(6, 10)
                    ] = {
                        text: `Level Up!`,
                        type: 2,
                        isNew: true
                    };
                }
            }
        });

        // When a player creates a clan marker (Clicking or "Attention to the map!")
        socket.on(`clanMarker`, (data) => {
            let randid = Math.random().toString(36).substring(6, 10);
            markers[randid] = data;
        });

        // Create interval update
        let intervalUpdate;

        // Remove old interval if it exists
        if (intervalUpdate !== undefined) {
            clearInterval(intervalUpdate);
            intervalUpdate = undefined;
        }

        // Set up interval that sends client snapshots
        let snapCounter = 0;
        intervalUpdate = setInterval(() => {
            if (!myPlayer) {
                return;
            }

            msg = myPlayer.getDelta();
            if (msg) {
                socket.emit(`u`, msg);
            }
        }, 100);
    });

    // Chat messages listener
    socket.on(`chat message`, (msgData) => displayMessage(msgData));

    // On chat clears
    socket.on(`clear`, () => $(`.global-chat`).remove());

    // On day/night cycles
    socket.on(`cycle`, (time) => {
        if (time === `day`) doDaylightCycle(0);
        else if (time === `night`) doDaylightCycle(1);
    });
};

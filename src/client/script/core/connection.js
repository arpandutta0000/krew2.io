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

    // Log connection info
    console.log(`Successfully connected!\nGood luck sailor! o7\n\nConnection information:\nIP: ${server.ip}\nPort: ${server.port}\nPlayers: ${server.playerCount}\nMax Players: ${server.maxPlayerCount}`);

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

    $(`#game-ui`).show();
    $(`#splash-modal`).modal(`hide`);
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
                `Use WASD to move. Click to shoot/fish. Use 1 & 2 to switch weapons.`,
                4,
                15000
            );
            getPing();
        });

        // Start pings for ping stat
        let pings = [];
        let recievedPong = false;
        let startTime;

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
            for (e in data) {
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
        socket.on(`setBankData`, (data) => {
            setBankData(data);
        });

        // Update list of krews/leaderboard
        socket.on(`updateKrewsList`, () => {
            updateKrewList();
        });

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
            if (ui && notifications.showCenterMessage) {
                notifications.showCenterMessage(message, type || 3, time);
            }
            if (message.startsWith(`Achievement trading`)) {
                $(`#shopping-modal`).hide();
            }
        });

        // Show death messages
        socket.on(`showKillMessage`, (killChain) => {
            if (ui && notifications.showKillMessage) {
                notifications.showKillMessage(killChain);
            }
        });

        // Play damage sounds and show hit info
        socket.on(`showDamageMessage`, (message, type) => {
            if (ui && notifications.showDamageMessage) {
                if (type === 2)
                    playAudioFile(false, `cannon-hit`);

                notifications.showDamageMessage(message, type);
            }
        });

        // Admin says
        socket.on(`showAdminMessage`, (message) => {
            if (ui && notifications.showAdminMessage) {
                notifications.showAdminMessage(message);
            }
        });

        // On a level up play sound and show level up text
        socket.on(`levelUpdate`, (data) => {
            if (entities[data.id] !== undefined && entities[data.id].netType === 0) {
                entities[data.id].level = data.level;
                if (data.id === myPlayerId) {
                    playAudioFile(false, `level-up`);
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
    socket.on(`chat message`, (msgData) => {
        if (
            myPlayer &&
            myPlayer.parent &&
            (myPlayer.parent.hasChild(msgData.playerId) ||
                msgData.recipient === `global` ||
                msgData.recipient === `local` ||
                msgData.recipient === `clan` ||
                msgData.recipient === `staff`) &&
            entities[msgData.playerId] !== undefined
        ) {
            let isKrewmate =
                myPlayer.parent.netType === 1 &&
                myPlayer.parent.hasChild(msgData.playerId);
            let isPlayer = msgData.playerId === myPlayerId;
            let isClanMember =
                myPlayer.clan !== `` &&
                myPlayer.clan !== undefined &&
                myPlayer.clan === entities[msgData.playerId].clan &&
                !isPlayer;
            let classRec = `global-chat`;
            let isAdmin = config.Admins.includes(msgData.playerName);
            let isMod = config.Mods.includes(msgData.playerName);
            let isDev = config.Devs.includes(msgData.playerName);
            let chatHistory = $(`#chat-history`);
            if (msgData.recipient === `global`) {
                classRec = `global-chat`;
            } else if (msgData.recipient === `local`) {
                classRec = `local-chat`;
            } else if (msgData.recipient === `staff`) {
                classRec = `staff-chat`;
            } else {
                classRec = `clan-chat`;
            }
            let $msgDiv = $(`<div/>`, {
                text: `${(msgData.playerClan ? `[${msgData.playerClan}] ` : ``) +
                    (isAdmin ? `[Admin] ` : isMod ? `[Staff] ` : isDev ? `[Dev] ` : ``) +
                    msgData.playerName
                }: ${
                    msgData.message}`,
                class: `${classRec
                } text-${
                    isAdmin || isMod || isDev
                        ? `mod-color`
                        : isClanMember
                            ? `clan-color`
                            : isPlayer || isKrewmate
                                ? isPlayer
                                    ? `success`
                                    : entities[msgData.playerId].isCaptain
                                        ? `danger`
                                        : `info`
                                : `white`}`
            });

            messageTypes = [`staff-chat`, `clan-chat`, `local-chat`, `global-chat`];
            for (let i = 0; i < messageTypes.length; i++) {
                let messageType = messageTypes[i];

                messageCount = $(`.${messageType}`).length;
                if (messageCount > 15) {
                    $(`.${messageType}`)
                        .first()
                        .remove();
                }
            }

            if (msgData.recipient === `global` && !globalChatOn) {
                $(`#global-chat-alert`).show();
                $msgDiv.hide();
            }

            if (msgData.recipient === `local` && !localChatOn) {
                $(`#local-chat-alert`).show();
                $msgDiv.hide();
            }

            if (msgData.recipient === `clan` && !clanChatOn) {
                $(`#clan-chat-alert`).show();
                $msgDiv.hide();
            }
            if (msgData.recipient === `staff` && !staffChatOn) {
                $(`#staff-chat-alert`).show();
                $msgDiv.hide();
            }

            let atTheBottom = false;
            if (
                $(chatHistory).scrollTop() + $(chatHistory).innerHeight() >=
                $(chatHistory)[0].scrollHeight
            ) {
                atTheBottom = true;
            }

            chatHistory.append($msgDiv);

            if (atTheBottom === true) {
                chatHistory.scrollTop(function () {
                    return this.scrollHeight;
                });
            }
        }
    });

    // On chat clears
    socket.on(`clear`, () => {
        $(`.global-chat`).remove();
    });

    // On day/night cycles
    socket.on(`cycle`, (time) => {
        if (time === `day`) doDaylightCycle(0);
        else if (time === `night`) doDaylightCycle(1);
    });
};
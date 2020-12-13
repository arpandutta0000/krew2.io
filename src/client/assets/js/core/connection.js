// Predefined variables.
let socket;
let address = document.location.host;

// Chat toggle options for where to send a message.
let staffChatOn = false;
let clanChatOn = false;
let localChatOn = false;
let globalChatOn = true;

let intervalUpdate = undefined;

// Define clientside account perms.
const staff = {
    admins: [`devclied`, `DamienVesper`, `LeoLeoLeo`, `harderman`, `itsdabomb`],
    mods: [`Fiftyyyyy`, `Sloth`, `Sjmun`, `TheChoco`, `Kekmw`, `Headkeeper`],
    devs: [`Yaz`]
}

let connect = pid => {
    // If player is already connected to the game.
    if(socket != undefined) return console.log(`Player already connected to the game.`);

    // Get the selected gameserver.
    if(getUrlVars().pid && ui.serverList[getUrlVars().pid]) pid = getUrlVars().pid;

    // Determine local / prod gameserver.
    let server = ui.servers[pid];
    if(window.location.hostname == `localhost`) server = { ip: `http://localhost`, port: `2001` }

    // Concatenate this information into a url to use.
    let url = window.location.hostname == `localhost` ? `http://localhost`: `https://krew.io`;
    if(!isNaN(parseInt(server.port)) && parseInt(server.port) != 80) url += `:${server.port}`;

    // Connect to the gameserver.
    console.log(url);
    socket = io.connect(`https://krew.io:2001`, {
        secure: true,
        rejectUnauthorized: false
    });
    initSocketBinds();

    $(`#game-ui`).show();
    $(`#login-modal`).modal(`hide`);
}

initSocketBinds = () => {
    // Await handshake (recognition from master of client connection to gameserver).
    socket.on(`handshake`, msg => {
        // Send a message before player closes game window.
        document.addEventListener(`beforeunload`, () => {
            return `Do you really want to leave your ship and lose your progress?`;
        });

        // Clear previous data (if any) from last connection.
        deleteEverything();

        // Assign player ID.
        myPlayer = undefined;
        myPlayerId = msg.socketID

        // Let the gameserver know to create a player and send data for the player.
        socket.emit(`createPlayer`, {
            boatID: getUrlVars().bid,
            token: ui.token,
            spawn: ui.setSpawnPlace(),
            user: `DamienVesper`
        });

        // Reset the alive timer.
        secondsAlive = 0;

        // Setup UI for initial jump into game.
        socket.on(`startGame`, () => {
            ui.LoadingWheel(`hide`);
            ui.showCenterMessage(`Use WASD to move. Click to shoot or fish. Use 1, 2, and 3 to switch weapons.`, 4, 15e3);
        });

        // Receive data for player usernames.
        socket.on(`playerNames`, data => playerNames = data);

        // Receive data for world snapshot.
        socket.on(`snapshot`, data => {
            data = JSON.parse(LZString.decompress(data));
            for(let i in data) parseSnap(i, data[i]);
        });

        // Handle disconnecting from game / death.
        socket.on(`disconnect`, deleteEverything);
        socket.on(`end`, endTheGame);

        // Receive data for player scores for leaderboard.
        socket.on(`scores`, data => {
            data = JSON.parse(LZString.decompress(data));
            ui.updateLeaderboard(data);
        });

        // Receive and set data for player in bank.
        socket.on(`setBankData`, data => ui.setBankData());

        // Receive and update krews list (alternative method).
        socket.on(`updateKrewsList`, () => ui.updateKrewList());

        // Receive and update ship cargo.
        socket.on(`updateCargo`, () => {
            if($(`#buy-goods`).hasClass(`active`)) GOODSCOMPONENT.getList();
        });

        // Receive docking menu and update ui to reflect.
        socket.on(`enterIsland`, data => enterIsland(data));

        // Show island menus when ship docks.
        socket.on(`showIslandMenu`, () => showIslandMenu());

        // Remove island menus when ship sails.
        socket.on(`exitIsland`, () => exitIsland(data));

        // Show ad.
        socket.on(`showAd`, () => ui.showAd());

        // Departure warning for other ships that depart at the same island.
        socket.on(`departureWarning`, () => {
            let krewListBtn = $(`.toggle-krew-list-button`);
            if(krewListBtn.hasClass(`enabled`)) {
                krewListBtn.addClass(`glowing`);
                setTimeout(() => krewListBtn.removeClass(`glowing`), 5e3);
            }
        });

        // Show message in message bar (top center) to user.
        socket.on(`showCenterMessage`, (msg, type, time) => {
            if(ui && ui.showCenterMessage) ui.showCenterMessage(message, type || 3, time);
            if(message.startsWith(`Achievement trading`)) $(`.shopping-modal`).style.display = `none`;
        });

        // Show killfeed to user.
        socket.on(`showKillMessage`, killChain => {
            if(ui && ui.showKillMessage) ui.showKillMessage(killChain);
        });

        // Show damage dealt / damage being dealt to user.
        socket.on(`showDamageMessage`, (msg, type) => {
            if(ui && ui.showDamageMessage) {
                if(type == 2) ui.playAudioFile(false, `cannon-hit`);
                ui.showDamageMessage(msg, type);
            }
        });

        // Show admin message to user.
        socket.on(`showAdminMessage`, msg => {
            if(ui && ui.showAdminMessage) ui.showAdminMessage(msg);
        });

        // Show level up notification to user.
        socket.on(`levelUpdate`, data => {
            if(entities[data.id] != undefined && entities[data.id].netType == 0) {
                entities[data.id].level = data.level;

                if(data.id == myPlayerId) {
                    ui.playAudioFile(false, `level-up`);

                    myPlayer.updateExperience();
                    myPlayer.notificationsHeap[Math.random().toString(36).substring(6, 10)] = { text: `Level Up!`, type: 2, isNew: true }
                }
            }
        });

        // Clan marker.
        socket.on(`clanMarker`, data => {
            let randID = Math.random().toString(36).substring(6, 10);
            markers[randID] = data;
        });

        // Remove old interval, if existent.
        if(intervalUpdate != undefined) {
            clearInterval(intervalUpdate);
            intervalUpdate = undefined;
        }

        // Create a new interval to send current snapshot.
        let snapCounter = 0;
        intervalUpdate = setInterval(() => {
            if(!myPlayer) return;

            msg = myPlayer.getDelta();
            if(msg) socket.emit(`u`, msg);

        }, 100);

        // Receive chat messages and show them in the chat menu.
        socket.on(`chat message`, data => {
            if(myPlayer && myPlayer.parent && (myPlayer.parent.hasChild(data.playerID) || data.recipent == `global` || data.recipent == `local` || data.recipient == `clan` || data.recipient == `staff`) && entities[data.playerID] != undefined) {
                let chatHistory = $(`#chat-history`);

                let isKrewmate = myPlayer.parent.netType == 1 && myPlayer.parent.hasChild(data.myPlayerId);
                let playerClan = entities[data.playerID].clan;
                let isClanMember = myPlayer.clan != `` && myPlayer.clan != undefined && myPlayer.clan == playerClan && !isPlayer;
                
                let isAdmin = staff.admins.includes(data.playerName);
                let isMod = staff.mods.includes(data.playerName);
                let isDev = staff.devs.includes(data.playerName);

                let classRec = `${data.recipient}-chat`;


                let msgDiv = $(`<div>`, {
                    text: `${(isAdmin ? `[admin] `: isMod ? `[mod] `: isDev ? `[dev] `: ``) + data.playerName}: ${data.message}`,
                    class: (isAdmin || isMod || isDev) ? `text-mod-color`:
                    isClanMember ? `text-clan-color`:
                    isKrewmate ? 
                        entitites[data.playerId].isCaptain ? `text-danger`:
                        `text-primary`:
                        `text-info`
                });


                // hide message based on what chat is currently selected by the user.
                if((data.recipient == `global` && !globalChatOn)
                || (data.recipient == `local` && !localChatOn)
                || (data.recipient == `clan` && !clanChatOn)
                || (data.recipient == `staff` && !staffChatOn))
                    msgDiv.hide();

                if(data.recipient == `global` && !globalChatOn) $(`#global-chat-alert`).show();
                else if(data.recipient == `local` && !localChatOn) $(`#local-chat-alert`).show();
                else if(data.recipient == `clan` && !clanChatOn) $(`#clan-chat-alert`).show();
                else if(data.recipient == `staff` && !staffChatOn) $(`#staff-chat-alert`).show();

                chatHistory.appendChild(msgDiv);
            }
        });
    });
}

let getUrlVars = () => {
    let vars = {}
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => vars[key] = value);
    return vars;
}

let deleteEverything = () => {
    for(let e in entities) if(entities.hasOwnProperty(e)) entities[e].onDestroy();
}

// Disconnect player from socket.
let endTheGame = (gold, fired, hit, sank) => {
    miniplaySend2API(`gameover`, 1);
    miniplaySend2API(`ships`, sank);

    controls.unLockMouseLook();

    $(`.local-chat`).remove();
    $(`#game-over-modal`).modal(`show`);

    setHighlights(gold, fired, hit, sank);
    myPlayer.state = 1;
}

// Set player session highlights for respawn window.
let setHighlights = (gold, fired, hit, sank) => {
    miniplaySend2API(`gameover`, 1);
    miniplaySend2API(`ships`, sank);

    $(`#total-score`).html(lastScore);
    $(`#total-damage`).html(lastScore);
    $(`#total-gold-collected`).html(gold.toFixed(0));
    $(`#total-shots-fired`).html(fired);
    $(`#total-shots-hit`).html(Math.round((hit / fired) * 100));
    $(`#total-ships-sank`).html(sank);
    $(`#supplies-cut`).html((0.3 * gold).toFixed(0));

    if($(`#docking-modal`).is(`:visible`)) $(`#docking-modal`).hide();
}

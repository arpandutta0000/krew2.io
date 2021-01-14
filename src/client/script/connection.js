let socket;
let address = document.location.host;
let playerid; // my player ID
let staffChatOn = false;
let clanChatOn = false;
let localChatOn = false;
let globalChatOn = true;

let maxPlayerPerInstance = 100;

let interval_update;

// define here who is Mod or Admin (for client side)
let Admins = [`devclied`, `LeoLeoLeo`, `DamienVesper`, `BR88C`, `itsdabomb`, `harderman`];
let Mods = [`Fiftyyyyy`, `Speedy_Sloth`, `Sjmun`, `TheChoco`, `Kekmw`];
let Devs = [`Yaz_`];

// connect to the first available server
let connect = function (pid) {
    // player is already connected to the game.
    if (socket !== undefined) {
        return;
    }

    // here we wanna connect to each ip to request the load
    if (getUrlVars().pid && ui.serverList[getUrlVars().pid]) {
        pid = getUrlVars().pid;
    }

    console.log(ui.servers);
    let server = ui.servers[pid];

    if (window.location.hostname === `localhost`)
        server = {
            ip: `http://localhost`,
            port: `2053`
        };

    // Since we are passing the url on the server object, we dont need to process the window.location
    // just put the url to the server.ip property and add the port

    let url = window.location.hostname === `localhost` ? `http://localhost` : `https://tournament.krew.io/`;
    if (parseInt(server.port) !== 80) {
        url += `:${server.port}`;
    }

    socket = io.connect(url, {
        secure: true,
        rejectUnauthorized: false,
        withCredentials: true
    }); // establish socket connection!

    initSocketBinds();

    $(`#game-ui`).show();
    $(`#login-modal`).modal(`hide`);
};

var initSocketBinds = function () {
    console.log(`jumped into bind function`);
    // when server sends handshake paket
    socket.on(`handshake`, (msg) => {
        console.log(`jumped into handshake`);

        // on unload, close socket
        $(window).on(`beforeunload`, () => {
            return `Do you really want to leave your ship and lose your progress?`;
        });

        // console.log('socket handshake', msg);

        deleteEverything();
        // we receive our id.
        myPlayer = undefined;
        myPlayerId = msg.socketId;

        // create player entity
        socket.emit(`createPlayer`, {
            boatId: getUrlVars().bid,
            name: !ui.username ? undefined : ui.username,
            password: !ui.password ? undefined : ui.password,
            spawn: ui.setSpawnPlace()
        });
        secondsAlive = 0;

        socket.on(`startGame`, () => {
            ui.LoadingWheel(`hide`);
            ui.showCenterMessage(
                `Use WASD to move. Click to shoot/fish. Use 1 & 2 to switch weapons.`,
                4,
                15000
            );
            getPing();
        });

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

        // im the new guy receiving information about the existing guys
        socket.on(`playerNames`, (data) => {
            playerNames = data;
        });

        // when the server sends a snapshot
        socket.on(`s`, (data) => {
            // decompress snapshot data
            data = JSON.parse(LZString.decompress(data));
            for (e in data) {
                parseSnap(e, data[e]);
            }
        });

        socket.on(`disconnect`, deleteEverything);
        socket.on(`end`, endTheGame);

        socket.on(`scores`, (data) => {
            // decompress snapshot data with lz-string
            data = JSON.parse(LZString.decompress(data));
            ui.updateLeaderboard(data);
        });

        socket.on(`setBankData`, (data) => {
            ui.setBankData(data);
        });

        // alternative way for updating krews list globally for other docked ships
        socket.on(`updateKrewsList`, () => {
            ui.updateKrewList();
        });

        socket.on(`cargoUpdated`, () => {
            if ($(`#buy-goods`).hasClass(`active`)) {
                GOODSCOMPONENT.getList();
            }
        });

        // get anchor island info to client
        // This is also setted with the enterIsland event so this is commented
        // socket.on('getIsland', function(islandData) {
        //     currentIsland = islandData;
        // })

        // island messages
        socket.on(`enterIsland`, (data) => {
            // this is sent once to every member of the krew when a boat enters the island docking area
            // data.c tells us if we are the captain. 0 = krew, 1 = captain
            enterIsland(data);
        });

        socket.on(`showIslandMenu`, () => {
            showIslandMenu();
        });

        // close shopping windows of the players that are exiting the island
        socket.on(`exitIsland`, (data) => {
            exitIsland(data);
        });

        socket.on(`showAdinplayCentered`, () => {
            ui.showAdinplayCentered();
        });

        socket.on(`departureWarning`, () => {
            if ($(`#toggle-krew-list-modal-button`).hasClass(`enabled`)) {
                // let the krew list button glow for 5 seconds if another krew apart from mine is departing
                $(`#toggle-krew-list-modal-button`).addClass(`glowing`);
                setTimeout(() => {
                    $(`#toggle-krew-list-modal-button`).removeClass(`glowing`);
                }, 5000);
            }
        });

        socket.on(`showCenterMessage`, (message, type, time) => {
            if (ui && ui.showCenterMessage) {
                ui.showCenterMessage(message, type || 3, time);
            }
            if (message.startsWith(`Achievement trading`)) {
                $(`#shopping-modal`).hide();
            }
        });

        socket.on(`showKillMessage`, (killChain) => {
            if (ui && ui.showKillMessage) {
                ui.showKillMessage(killChain);
            }
        });

        socket.on(`showDamageMessage`, (message, type) => {
            if (ui && ui.showDamageMessage) {
                if (type === 2)
                    ui.playAudioFile(false, `cannon-hit`);

                ui.showDamageMessage(message, type);
            }
        });

        socket.on(`showAdminMessage`, (message) => {
            if (ui && ui.showAdminMessage) {
                ui.showAdminMessage(message);
            }
        });

        socket.on(`levelUpdate`, (data) => {
            if (entities[data.id] !== undefined && entities[data.id].netType === 0) {
                entities[data.id].level = data.level;
                if (data.id === myPlayerId) {
                    ui.playAudioFile(false, `level-up`);
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

        socket.on(`clanMarker`, (data) => {
            let randid = Math.random().toString(36).substring(6, 10);
            markers[randid] = data;
        });

        // remove old interval if it exist
        if (interval_update !== undefined) {
            clearInterval(interval_update);
            interval_update = undefined;
        }

        // set up interval that sends our own snapshot
        let snapCounter = 0;
        interval_update = setInterval(() => {
            if (!myPlayer) {
                return;
            }

            msg = myPlayer.getDelta();
            if (msg) {
                socket.emit(`u`, msg);
            }
        }, 100);
    });

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
            let isAdmin = Admins.includes(msgData.playerName);
            let isMod = Mods.includes(msgData.playerName);
            let isDev = Devs.includes(msgData.playerName);
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
    socket.on(`clear`, () => {
        $(`.global-chat`).remove();
    });
    socket.on(`cycle`, (time) => {
        if (time === `day`) doDaylightCycle(0);
        else if (time === `night`) doDaylightCycle(1);
    });
};

var getUrlVars = function () {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (
        m,
        key,
        value
    ) => {
        vars[key] = value;
    });

    return vars;
};

var deleteEverything = function () {
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            entities[e].onDestroy();
        }
    }
    entities = {};
    myPlayer = undefined;
};

// Disconnect / game end listener
var endTheGame = function (gold, fired, hit, sank) {
    miniplaySend2API(`gameover`, 1);
    miniplaySend2API(`ships`, sank);

    controls.unLockMouseLook();

    $(`.local-chat`).remove();
    $(`#game-over-modal`).modal(`show`);

    setHighlights(gold, fired, hit, sank);
    myPlayer.state = 1;

    // deleteEverything();
};

// Set player session highlights for respawn window
var setHighlights = function (gold, fired, hit, sank) {
    $(`#total-score`).html(lastScore);
    $(`#total-damage`).html(lastScore);
    $(`#total-gold-collected`).html(gold.toFixed(0));
    $(`#total-shots-fired`).html(fired);
    $(`#total-shots-hit`).html(hit);
    $(`#accuracy`).html(Math.round((hit / fired) * 100));
    $(`#total-ships-sank`).html(sank);
    $(`#supplies-cut`).html((0.3 * gold).toFixed(0));
    if ($(`#docking-modal`).is(`:visible`)) {
        $(`#docking-modal`).hide();
    }
};

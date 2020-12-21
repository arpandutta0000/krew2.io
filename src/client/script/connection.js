var socket;
var address = document.location.host;
var playerid; // my player ID
var staffChatOn = false;
var clanChatOn = false;
var localChatOn = false;
var globalChatOn = true;

var maxPlayerPerInstance = 100;

var interval_update = undefined;

// define here who is Mod or Admin (for client side)
var Admins = ['devclied', 'LeoLeoLeo', 'itsdabomb', 'harderman', 'DamienVesper'];
var Mods = ['Fiftyyyyy', 'Sloth', 'Sjmun', 'TheChoco', 'Kekmw', 'Headkeeper'];
var Devs = ['yaz'];

// connect to the first available server
var connect = function (pid) {
    // player is already connected to the game.
    if (socket != undefined) {
        return;
    }

    //here we wanna connect to each ip to request the load
    if (getUrlVars().pid && ui.serverList[getUrlVars().pid]) {
        pid = getUrlVars().pid;
    }

    console.log(ui.servers);
    var server = ui.servers[pid];

    if (window.location.hostname === 'localhost')
        server = {
            ip: 'http://localhost',
            port: '2053'
        };

    // Since we are passing the url on the server object, we dont need to process the window.location
    // just put the url to the server.ip property and add the port

    var url = window.location.hostname === 'localhost' ? 'http://localhost' : 'https://beta.krew.io';
    if (parseInt(server.port) !== 80) {
        url += ':' + server.port;
    }

    socket = io.connect('https://krew.io:2001', {
        secure: true,
        rejectUnauthorized: false,
    }); // establish socket connection!

    initSocketBinds();

    $('#game-ui').show();
    $('#login-modal').modal('hide');
};

var initSocketBinds = function () {
    console.log('jumped into bind function');
    // when server sends handshake paket
    socket.on('handshake', function (msg) {
        console.log('jumped into handshake');

        // on unload, close socket
        $(window).on('beforeunload', function () {
            return 'Do you really want to leave your ship and lose your progress?';
        });

        // console.log('socket handshake', msg);

        deleteEverything();
        // we receive our id.
        myPlayer = undefined;
        myPlayerId = msg.socketId;

        // create player entity
        socket.emit('createPlayer', {
            boatId: getUrlVars().bid,
            token: ui.clientAccessToken,
            name: 'DamienVesper',
            spawn: ui.setSpawnPlace(),
            // TODO: fix session token (so players can't join with multiple seadogs)
            // cookie: sessionCookie,
        });
        secondsAlive = 0;

        socket.on('startGame', function () {
            ui.LoadingWheel('hide');
            ui.showCenterMessage(
                'Use WASD to move. Click to shoot/fish. Use 1 & 2 to switch weapons.',
                4,
                15000
            );

            if (Admins.includes(ui.username) || Mods.includes(ui.username) || Devs.includes(ui.username)) {
                $('#panel-modal').show();
                $('#verify-login').show();
            } else $('#verify-login').hide();


            firebase.auth().signOut();
        });

        $('#submit-pincode-btn').on('onclick', function () {
            // best to fingerprint before sending through socket
            socket.emit('loginWithPin', $('#admin-pincode').val());
        });

        // im the new guy receiving information about the existing guys
        socket.on('playerNames', function (data) {
            playerNames = data;
        });

        // access admin panel
        socket.on('accessAdminPanel', function (result) {
            console.log(result);
            if (result == 401) {
                ui.showCenterMessage('Mod Logged in successfully', 3, 10000);
                $('#admin-verification-login').hide();
                $('mod-commands').show();
            } else if (result == 402 || result == 403) {
                ui.showCenterMessage(result == 402 ? 'Dev' : 'Admin' + ' Logged in successfully', 3, 10000);
                $('#admin-verification-login').hide();
                $('#dev-commands').show();

                var html = document.getElementById('dev-commands');
                html.innerHTML += '<button id="server-save-btn" type="button" class="btn btn-primary btn-md">Server Save</button></br></br> \
        <div id = "defog-div"> \
        <label id="defog-label" class="label">\
        <div id="defog-text" class="lock-text-info" style="padding-right:10px">De-fog</div>\
              <div class="toggle">\
                   <input class="toggle-state" type="checkbox" name="check" value="check" id="defog-button"/>\
                  <div class="toggle-inner">\
                     <div class="indicator"></div>\
                   </div><div class="active-bg"></div>\
              </div>\
           </label>\
        </div>\
        <div id = "fly-div">\
           <label id="fly-label" class="label">\
              <div id="fly-text" class="lock-text-info" style="padding-right:10px">Fly</div>\
              <div class="toggle">\
                  <input class="toggle-state" type="checkbox" name="check" value="check" id="fly-button"/>\
                <div class="toggle-inner">\
                   <div class="indicator"></div>\
               </div><div class="active-bg"></div>\
           </div>\
         </label>\
         </div>\
        <div id = "walk-underwater-div">\
           <label id="fly-label" class="label">\
              <div id="fly-text" class="lock-text-info" style="padding-right:10px">Dive under water</div>\
              <div class="toggle">\
                  <input class="toggle-state" type="checkbox" name="check" value="check" id="walk-uderwater-button"/>\
                <div class="toggle-inner">\
                   <div class="indicator"></div>\
               </div><div class="active-bg"></div>\
           </div>\
         </label>\
         </div>\
        <div id = "fastwalk-div">\
           <label id="fly-label" class="label">\
              <div id="fly-text" class="lock-text-info" style="padding-right:10px">Super Speed on island</div>\
              <div class="toggle">\
                  <input class="toggle-state" type="checkbox" name="check" value="check" id="fast-walk-button"/>\
                <div class="toggle-inner">\
                   <div class="indicator"></div>\
               </div><div class="active-bg"></div>\
           </div>\
         </label>\
         </div>\
        <div id="walteralk-div">\
           <label id="fast-walk-label" class="label">\
              <div id="fast-walk-text" class="lock-text-info" style="padding-right:10px">Walk on Water</div>\
              <div class="toggle">\
                 <input class="toggle-state" type="checkbox" name="check" value="check" id="water-walk-button"/>\
                  <div class="toggle-inner">\
                      <div class="indicator"></div>\
                  </div><div class="active-bg"></div>\
               </div>\
           </label>\
        </div>';
            }
        });

        $(document).on('click', '#server-save-btn', function () {
            if (!myPlayer.isAdmin && !myPlayer.isMod && !myPlayer.isDev) return;
        });

        $(document).on('change', '#defog-button', function () {
            if (!myPlayer.isAdmin && !myPlayer.isMod && !myPlayer.isDev) return;
            if (scene.fog.density == 0)
                scene.fog.density = 0.007;
            else
                scene.fog.density = 0;;
        });

        $(document).on('change', '#fly-button', function () {
            if (myPlayer && myPlayer.fly == 0)
                socket.emit('fly', 1);
            else if (myPlayer && myPlayer.fly == 1)
                socket.emit('fly', 0);
        });
        $(document).on('change', '#walk-uderwater-button', function () {
            if (myPlayer && myPlayer.fly == 0)
                socket.emit('dive', -1);
            else if (myPlayer && myPlayer.fly == -1)
                socket.emit('dive', 0);
        });
        $(document).on('change', '#fast-walk-button', function () {
            //console.log('is water walk working? ', $('#fly-button').is(':checked'));
            if (myPlayer && myPlayer.waterWalk == 0)
                socket.emit('fastWalk', 1);
            else if (myPlayer && myPlayer.waterWalk == 1)
                socket.emit('fastWalk', 0);
        });
        $(document).on('change', '#water-walk-button', function () {
            //console.log('is water walk working? ', $('#fly-button').is(':checked'));
            if (myPlayer && myPlayer.waterWalk == 0)
                socket.emit('waterWalk', 1);
            else if (myPlayer && myPlayer.waterWalk == 1)
                socket.emit('waterWalk', 0);
        });
        // when the server sends a snapshot
        socket.on('s', function (data) {
            // decompress snapshot data
            data = JSON.parse(LZString.decompress(data));
            for (e in data) {
                parseSnap(e, data[e]);
            }
        });

        socket.on('disconnect', deleteEverything);
        socket.on('end', endTheGame);

        socket.on('scores', function (data) {
            // decompress snapshot data with lz-string
            data = JSON.parse(LZString.decompress(data));
            ui.updateLeaderboard(data);
        });

        socket.on('setBankData', function (data) {
            ui.setBankData(data);
        });

        // alternative way for updating krews list globally for other docked ships
        socket.on('updateKrewsList', function () {
            ui.updateKrewList();
        });

        socket.on('cargoUpdated', function () {
            if ($('#buy-goods').hasClass('active')) {
                GOODSCOMPONENT.getList();
            }
        });

        // get anchor island info to client
        // This is also setted with the enterIsland event so this is commented
        // socket.on('getIsland', function(islandData) {
        //     currentIsland = islandData;
        // })

        // island messages
        socket.on('enterIsland', function (data) {
            // this is sent once to every member of the krew when a boat enters the island docking area
            // data.c tells us if we are the captain. 0 = krew, 1 = captain
            enterIsland(data);
        });

        socket.on('showIslandMenu', function () {
            showIslandMenu();
        });

        // close shopping windows of the players that are exiting the island
        socket.on('exitIsland', function (data) {
            exitIsland(data);
        });

        socket.on('showAdinplayCentered', function () {
            ui.showAdinplayCentered();
        });

        socket.on('departureWarning', function () {
            if ($('#toggle-krew-list-modal-button').hasClass('enabled')) {
                // let the krew list button glow for 5 seconds if another krew apart from mine is departing
                $('#toggle-krew-list-modal-button').addClass('glowing');
                setTimeout(function () {
                    $('#toggle-krew-list-modal-button').removeClass('glowing');
                }, 5000);
            }
        });

        socket.on('showCenterMessage', function (message, type, time) {
            if (ui && ui.showCenterMessage) {
                ui.showCenterMessage(message, type || 3, time);
            }
            if (message.startsWith('Achievement trading')) {
                $('#shopping-modal').hide();
            }
        });

        socket.on('showKillMessage', function (killChain) {
            if (ui && ui.showKillMessage) {
                ui.showKillMessage(killChain);
            }
        });

        socket.on('showDamageMessage', function (message, type) {
            if (ui && ui.showDamageMessage) {
                if (type == 2)
                    ui.playAudioFile(false, 'cannon-hit');

                ui.showDamageMessage(message, type);
            }
        });

        socket.on('showAdminMessage', function (message) {
            if (ui && ui.showAdminMessage) {
                ui.showAdminMessage(message);
            }
        });

        socket.on('levelUpdate', function (data) {
            if (entities[data.id] !== undefined && entities[data.id].netType === 0) {
                entities[data.id].level = data.level;
                if (data.id === myPlayerId) {
                    ui.playAudioFile(false, 'level-up');
                    myPlayer.updateExperience();
                    myPlayer.notifiscationHeap[
                        Math.random().toString(36).substring(6, 10)
                    ] = {
                        text: 'Level Up!',
                        type: 2,
                        isNew: true
                    };
                }
            }
        });

        socket.on('clanMarker', function (data) {
            var randid = Math.random().toString(36).substring(6, 10);
            markers[randid] = data;
        });

        // remove old interval if it exist
        if (interval_update !== undefined) {
            clearInterval(interval_update);
            interval_update = undefined;
        }

        // set up interval that sends our own snapshot
        var snapCounter = 0;
        interval_update = setInterval(function () {
            if (!myPlayer) {
                return;
            }

            msg = myPlayer.getDelta();
            if (msg) {
                socket.emit('u', msg);
            }
        }, 100);
    });

    socket.on('chat message', function (msgData) {
        if (
            myPlayer &&
            myPlayer.parent &&
            (myPlayer.parent.hasChild(msgData.playerId) ||
                msgData.recipient === 'global' ||
                msgData.recipient === 'local' ||
                msgData.recipient === 'clan' ||
                msgData.recipient === 'staff') &&
            entities[msgData.playerId] !== undefined
        ) {
            var isKrewmate =
                myPlayer.parent.netType === 1 &&
                myPlayer.parent.hasChild(msgData.playerId);
            var isPlayer = msgData.playerId === myPlayerId;
            var isClanMember =
                myPlayer.clan !== '' &&
                myPlayer.clan !== undefined &&
                myPlayer.clan === entities[msgData.playerId].clan &&
                !isPlayer;
            var classRec = 'global-chat';
            var isAdmin = Admins.includes(msgData.playerName);
            var isMod = Mods.includes(msgData.playerName);
            var isDev = Devs.includes(msgData.playerName);
            var chatHistory = $('#chat-history');
            if (msgData.recipient === 'global') {
                classRec = 'global-chat';
            } else if (msgData.recipient === 'local') {
                classRec = 'local-chat';
            } else if (msgData.recipient === 'staff') {
                classRec = 'staff-chat';
            } else {
                classRec = 'clan-chat';
            }
            var $msgDiv = $('<div/>', {
                text: (isAdmin ? '[admin] ' : isMod ? '[mod] ' : isDev ? '[dev] ' : '') +
                    msgData.playerName +
                    ': ' +
                    msgData.message,
                class: classRec +
                    ' text-' +
                    (isAdmin || isMod || isDev ?
                        'mod-color' :
                        isClanMember ?
                        'clan-color' :
                        isPlayer || isKrewmate ?
                        isPlayer ?
                        'success' :
                        entities[msgData.playerId].isCaptain ?
                        'danger' :
                        'info' :
                        'white'),
            });

            messageTypes = ['staff-chat', 'clan-chat', 'local-chat', 'global-chat'];
            for (var i = 0; i < messageTypes.length; i++) {
                var messageType = messageTypes[i];

                messageCount = $('.' + messageType).length;
                if (messageCount > 15) {
                    $('.' + messageType)
                        .first()
                        .remove();
                }
            }

            if (msgData.recipient === 'global' && !globalChatOn) {
                $('#global-chat-alert').show();
                $msgDiv.hide();
            }

            if (msgData.recipient === 'local' && !localChatOn) {
                $('#local-chat-alert').show();
                $msgDiv.hide();
            }

            if (msgData.recipient === 'clan' && !clanChatOn) {
                $('#clan-chat-alert').show();
                $msgDiv.hide();
            }
            if (msgData.recipient === 'staff' && !staffChatOn) {
                $('#staff-chat-alert').show();
                $msgDiv.hide();
            }

            var atTheBottom = false;
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
};


var getUrlVars = function () {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (
        m,
        key,
        value
    ) {
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

    miniplaySend2API('gameover', 1);
    miniplaySend2API('ships', sank);

    controls.unLockMouseLook();

    $('.local-chat').remove();
    $('#game-over-modal').modal('show');

    setHighlights(gold, fired, hit, sank);
    myPlayer.state = 1;

    //deleteEverything();
};

// Set player session highlights for respawn window
var setHighlights = function (gold, fired, hit, sank) {
    $('#total-score').html(lastScore);
    $('#total-damage').html(lastScore);
    $('#total-gold-collected').html(gold.toFixed(0));
    $('#total-shots-fired').html(fired);
    $('#total-shots-hit').html(hit);
    $('#accuracy').html(Math.round((hit / fired) * 100));
    $('#total-ships-sank').html(sank);
    $('#supplies-cut').html((0.3 * gold).toFixed(0));
    if ($('#docking-modal').is(':visible')) {
        $('#docking-modal').hide();
    }
};
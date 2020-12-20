global.maxAmountCratesInSea = 1100;
global.minAmountCratesInSea = 480;

let thugConfig = require(`./config/thugConfig.js`);
let config = require(`./config/config.js`);
let login = require(`./auth/login.js`);
let xssFilters = require(`xss-filters`);
let https = require(`https`);
let http = require(`http`);
let fs = require(`fs`);
let Filter = require(`bad-words`), filter = new Filter();
lzString = require(`./../client/assets/js/lz-string.min`);

// Utils.
let log = require(`./utils/log.js`);
let md5 = require(`./utils/md5.js`);
let { isSpamming, mutePlayer, charLimit } = require(`./utils/chat.js`);
let bus = require(`./utils/messageBus.js`);

let serverStartTimestamp = Date.now();
log(`green`, `UNIX Timestamp for server start: ${serverStartTimestamp}.`);

// additional bad words which need to be filtered
let newBadWords = [`idiot`, `2chOld`, `Yuquan`];
filter.addWords(...newBadWords);

// configure socket
if(global.io === undefined) {
  let server = process.env.NODE_ENV == `prod` ? https.createServer({
       key: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/privkey.pem`),
       cert: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/fullchain.pem`),
       requestCert: false,
       rejectUnauthorized: false
      }): http.createServer();

  global.io = require(`socket.io`)(server, { origins: `*:*` });
  server.listen(process.env.port);
}

const mongoose = require(`mongoose`);

mongoose.connect(`mongodb://localhost:27017/localKrewDB`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => log(`green`, `Socket.IO server has connected to database.`));

const axios = require(`axios`);

// Mongoose Models
let User = require(`./models/user.model.js`);
let Clan = require(`./models/clan.model.js`);
let Ban = require(`./models/ban.model.js`);
let Hacker = require(`./models/hacker.model.js`);
let PlayerRestore = require(`./models/playerRestore.model.js`);

// function to check if a string is alphanumeric
function isAlphaNumeric(str) {
  let code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if(
      !(code > 47 && code < 58) && // numeric (0-9)
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123)
    ) {
      // lower alpha (a-z)
      return false;
    }
  }
  return true;
}

log(`green`, `Socket.IO is listening on port to socket port ${process.env.port}`);
//io = require('socket.io').listen(process.env.port);

// Define serverside admins / mods / devs.
Admins = [`devclied`, `DamienVesper`, `LeoLeoLeo`],
Mods = [`Fiftyyyyyy`, `Sloth`, `Sj`, `TheChoco`, `Kekmw`, `Headkeeper`],
Devs = [`Yaz_`]


// create player in the world
// Test environment
if(TEST_ENV) {
  setTimeout(function () {
    let playerEntity;
    for (let i = 0; i < 100; i++) {
      playerEntity = core.createPlayer({});
      login.allocatePlayerToBoat(playerEntity);
    }
  }, 5000);
}

// Array for reported IPs
const reportedIps = [];
const gameCookies = {};


// Socket connection handling on server.
io.on(`connection`, async socket => {
    let krewioData;
    let christmasGold = 0;

    // Get socket ID (player ID).
    let socketId = serializeId(socket.id);

    // Let the client know the socket ID and that we have succesfully established a connection.
    socket.emit(`handshake`, { socketId });

    // Define the player entity that stores all data for the player.
    let playerEntity;

    let initSocketForPlayer = async data => {
        // If the player entity already exists, ignore reconnect.
        if(playerEntity) return;
        if(!data.name) data.name = ``;

        // Check if the player IP is in the ban list.
        let isIPBanned = await Ban.findOne({ IP: socket.handshake.address });
        if(isIPBanned) {
            log(`cyan`, `Detected banned IP ${socket.handshake.address} attempting to connect. Disconnecting ${data.name}.`);
            socket.emit(`showCenterMessage`, `You have been banned... Contact us on Discord`, 1, 6e4);

            socket.banned = true;
            return socket.disconnect();
        }

        // Check to see if the player is using a VPN.
        // Note: This has to be disabled if proxying through cloudflare! Cloudflare proxies are blacklisted and will not return the actual ip. 
        axios.get(`http://check.getipintel.net/check.php?ip=${socket.handshake.address.substring(7)}&contact=dzony@gmx.de&flags=f&format=json`).then(res => {
            if(!res) return log(`red`, `There was an error checking while performing the VPN check request.`)

            if(res.data && res.data.status == `success` && parseInt(res.data.result) == 1) {
                socket.emit(`showCenterMessage`, `Disable VPN to play this game`, 1, 6e4);
                log(`cyan`, `VPN connection. Disconnecting IP: ${socket.handshake.address}.`);

                // Ban the IP.
                let ban = new Ban({
                    timestamp: new Date(),
                    IP: socket.handshake.address,
                    comment: `Auto VPN temp ban`
                });
                return ban.save(err => err ? log(err): socket.disconnect());
            }
        });

        if(!DEV_ENV) { 
            // Check if cookie has been blocked.
            if(data.cookie != undefined && data.cookie != ``) {
                if(Object.values(gameCookies).includes(data.cookie)) return log(`cyan`, `Trying to spam multiple players... ${socket.handshake.address}.`);
                gameCookies[socketId] = data.cookie;
            }
        }

        // Create player in the world.
        data.socketId = socketId;
        playerEntity = core.createPlayer(data);
        playerEntity.socket = socket;

        // Check if user is logged in, and if so, that they are coming from their last IP logged in with.
        if(!DEV_ENV && data.last_ip && !(playerEntity.socket.handshake.address.includes(data.lastip))) {
            log(`cyan`, `Player ${playerEntity.name} tried to connect from different IP than login. Kick | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            return playerEntity.socket.disconnect();
        }

        // Identify the server that the player is playing on.
        playerEntity.serverNumber = config.gamePorts.indexOf(parseInt(playerEntity.socket.handshake.headers.host.substr(-4))) + 1;
        playerEntity.sellCounter = 0;

        if(playerEntity.socket.request.headers[`user-agent`] && playerEntity.socket.handshake.address) log(`magenta`, `Creation of new player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | UA: ${playerEntity.socket.request.headers[`user-agent`]} | Origin: ${playerEntity.socket.request.headers.origin} | Server ${playerEntity.serverNumber}.`);

        // Log hackers if detected.
        if(data.hacker) {
            log(`cyan`, `Exploit detected (modified client script / wrong emit). Player name: ${playerEntity.name} | IP: ${socket.handshake.address}.`);
            let hacker = new Hacker({
                name: playerEntity.name,
                IP: socket.handshake.address
            });
            hacker.save(err => err ? log(`red`, err): playerEntity.socket.disconnect());
            return;
        }

        // Only start the restore process if the server start was less than 5 minutes ago.
        if(Date.now() - serverStartTimestamp < 3e5) {
            let playerSave = await PlayerRestore.findOne({ IP: socket.handshake.address });
            if(playerSave && Date.now() - playerSave.timestamp < 3e5) {
                // If username is seadog, set the name to proper seadog.
                if(playerEntity.name.startsWith(`seadog`)) playerEntity.name = playerSave.name;

                // Restore gold and xp.
                playerEntity.gold = playerSave.gold;
                playerEntity.experience = playerSave.xp;
                playerEntity.points = {
                    fireRate: playerSave.fireRate,
                    distance: playerSave.distance,
                    damage: playerSave.damage
                }

                // Restore leaderboard stats.
                playerEntity.score = playerSave.score;
                playerEntity.shipsSank = playerSave.shipsSank;
                playerEntity.deaths = playerSave.deaths;
                playerEntity.totalDamage = playerSave.totalDamage;

                // Refund ship if captain.
                if(playerSave.isCaptain) playerEntity.gold += core.boatTypes[playerSave.shipID].price;

                // Restore item & item stats.
                if(playerSave.itemID) playerEntity.itemID = playerSave.itemID;
                playerEntity.attackSpeedBonus = playerSave.bonus.fireRate;
                playerEntity.attackDistanceBonus = playerSave.bonus.distance;
                playerEntity.attackDamageBonus = playerSave.bonus.damage;
                playerEntity.movementSpeedBonus = playerSave.bonus.speed;

                // Delete the save information afterwards so that the player cannot exploit with multiple tabs.
                playerSave.delete();
            }
        }

         // Allocate player to the game.
        login.allocatePlayerToBoat(playerEntity, data.boatId, data.spawn);

        // Get snapshot.
        socket.on(`u`, data => playerEntity.parseSnap(data));

        let checkPlayerStatus = () => {
            if(playerEntity.parent.shipState == 1 || playerEntity.parent.shipState == 0) log(`cyan`, `Possible Exploit detected (buying from sea) ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
        }

        // Gather all stats and return them to the client.
        socket.on(`get-stats`, fn => {
            let stats = {
                shipsSank: playerEntity.shipsSank,
                shotsFired: playerEntity.shotsFired,
                shotsHit: playerEntity.shotsHit,
                shotAccuracy: playerEntity.shotsHit / playerEntity.shotsFired,
                overallCargo: playerEntity.overallCargo,
                crewOverallCargo: playerEntity.parent.overallCargo,
                overallKills: playerEntity.parent.overallKills
            }
            return fn(JSON.stringify(stats));
        });

        // Chat message handling.
        socket.on(`chat message`, async msgData => {
            // Check for spam.
            if(msgData.message.length > 65 && !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
                log(`cyan`, `Exploit detected (spam). Player: ${playerEntity.name} Adding IP ${playerEntity.socket.handshake.address} to banned IPs | Server ${playerEntity.serverNumber}.`);
                log(`cyan`, `Spam message: ${msgData.message}`);

                let ban = new Ban({
                    timestamp: new Date(),
                    IP: playerEntity.socket.handshake.address,
                    comment: `Auto chat spam temp ban`
                });
                ban.save(err => err ? log(`red`, err): playerEntity.socket.disconnect());
            }

            // Staff commands.
            if((msgData.message.startsWith(`//`) || msgData.message.startsWith(`!!`)) && playerEntity.isLoggedIn) {
                // If the player is not a staff member, disregard the command usage.
                if(!Admins.includes(playerEntity.name) && !Mods.includes(playerEntity.name) && !Devs.includes(playerEntity.name)) return;

                // Respective prefixes.
                if(msgData.message.startsWith(`!!`) && !Admins.includes(playerEntity.name) && !Devs.includes(playerEntity.name)) return;
                if(msgData.message.startsWith(`//`) && !Mods.includes(playerEntity.name)) return;

                // Parse the message for arguments and set the command.
                let args = msgData.message.toString().slice(2).split(` `);
                let command = args.shift();

                // If the user has not authenticated, only give them access to login command.
                if(!playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
                    let pwd = await md5(args[0]);
                    if(command == `login`) {
                        let isAdmin = thugConfig.Admins[playerEntity.name] == pwd;
                        let isMod = thugConfig.Mods[playerEntity.name] == pwd;
                        let isDev = thugConfig.Devs[playerEntity.name] == pwd;
            
                        // Log the player login and send them a friendly message confirming it.
                        log(!isAdmin && !isMod && !isDev ? `cyan`: `blue`, `${isAdmin ? `ADMIN`: isMod ? `MOD`: isDev ? `DEV`: `IMPERSONATOR`} ${(isAdmin || isMod || isDev ? `LOGGED IN`: `TRIED TO LOG IN`)}: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`)
                        if(isAdmin || isMod || isDev) playerEntity.socket.emit(`showCenterMessage`, `Logged in succesfully`, 3, 1e4);

                        // Authenticate the player object as privileged user.
                        isAdmin ? playerEntity.isAdmin = true: isMod ? playerEntity.isMod = true: isDev ? playerEntity.isDev = true: null;
                    }
                }
                else {
                    let isAdmin = playerEntity.isAdmin;
                    let isMod = playerEntity.isMod;
                    let isDev = playerEntity.isDev;

                    // Staff commands after authentication.
                    if(command == `say`) {
                        let msg = args.join(` `);
                        if(!msg) return;

                        log(`blue`, `ADMIN SAY: ${msg} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return io.emit(`showAdminMessage`, msg);
                    }
                    else if(command == `recompense` && (isAdmin || isDev)) {
                        let amt = args[0];

                        if(!amt || isNaN(parseInt(amt))) return;
                        core.players.forEach(player => player.gold += parseInt(amt));

                        log(`blue`, `ADMIN RECOMPENSED ${amt} GOLD | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return io.emit(`showAdminMessage`, `You have been recompensed for the server restart!`);
                    }
                    else if(command == `nick` && isAdmin) {
                        let nick = args[0];
                        if(!nick) {
                            playerEntity.name = nick;
                            return log(`blue`, `ADMIN NICK: ${nick} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        }
                    }
                    else if(command == `whois` && isAdmin) {
                        let user = args[0];
                        let output = `That player does not exist.`;
                        if(user.startsWith(`seadog`)) {
                            let player = Object.values(core.players).find(player => player.name == user);
                            if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                            log(`blue`, `ADMIN WHOIS SEADOG: ${input} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            output = player.id;
                        }
                        else {
                            let player = core.boats.find(boat => boat.crewName == user);
                            if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                            log(`blue`, `ADMIN WHOIS CAPTAIN: ${input} --> ${player.captainId} | PLAYER NAME: ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            output = player.captainId;
                        }
                        return playerEntity.socket.emit(`showCenterMessage`, output, 4, 1e4);
                    }
                    else if(command == `kick` && (isAdmin || isMod)) {
                        let kickUser = args.shift();
                        let kickReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name == kickUser);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                        if(!kickReason || kickReason == ``) kickReason == `No reason specified`;

                        player.socket.emit(`showCenterMessage`, `You have been kicked ${kickReason ? `. Reason: ${kickReason}`: ``}`, 1, 1e4);
                        playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);

                        log(`blue`, `${isAdmin ? `ADMIN`: `MOD`} KICK: | Player name: ${playerEntity.name} | ${kickReason} | IP: ${player.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return player.socket.disconnect();
                    }
                    else if(command == `ban` && (isAdmin || isMod)) {
                        let banUser = args.shift();
                        let banReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name == banUser);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                        if(!banReason || banReason == ``) banReason == `No reason specified`;

                        let ban = new Ban({
                            IP: player.socket.handshake.address,
                            comment: banReason
                        });

                        ban.save(err => err ? log(`red`, err): () => {
                            player.socket.disconnect();
                            playerEntity.socket.emit(`showCenterMessage`, `You permanently banned ${player.name}`, 3, 1e4);    
                        });

                        log(`blue`, `Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        return bus.emit(`report`, `Permanently Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n`: ``}IP: ${player.socket.handshake.address}\nServer ${player.serverNumber}.`);
                    }
                    else if(command == `tempban` && (isAdmin || isMod)) {
                        let tempbanUser = args.shift();
                        let tempbanReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name == tempbanUser);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                        if(!tempbanReason || tempbanReason == ``) tempbanReason == `No reason specified`;

                        let ban = new Ban({
                            IP: player.socket.handshake.address,
                            timestamp: new Date(),
                            comment: tempbanReason
                        });

                        ban.save(err => err ? log(`red`, err): () => {
                            player.socket.disconnect();
                            playerEntity.socket.emit(`showCenterMessage`, `You temporarily banned ${player.name}`, 3);
                        });

                        log(`blue`, `Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        return bus.emit(`report`, `Temporary Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n`: ``}IP: ${player.socket.handshake.address}\n Server ${player.serverNumber}.`);
                    }
                    else if(command == `save` && (isAdmin || isDev)) {
                        playerEntity.socket.emit(`showCenterMessage`, `Storing player data`, 3, 1e4);
                        for(let i in core.players) {
                            let player = core.players[i];

                            // Delete existing outstanding data if any.
                            let oldPlayerData = await PlayerRestore.findOne({ IP: socket.handshake.address });
                            if(oldPlayerData) oldPlayerData.delete();
                            
                            let playerSaveData = new PlayerRestore({
                                name: player.name,
                                ip: player.socket.handshake.address,
                                timestamp: new Date(),

                                gold: player.gold,
                                xp: player.experience,
                                points: {
                                    fireRate: player.fireRate,
                                    distance: player.distance,
                                    damage: player.damage
                                },

                                score: player.score,
                                shipsSank: player.shipsSank,
                                deaths: player.deaths,
                                totalDamage: player.totalDamage,
                                overallKills: player.overallKills,

                                isCaptain: player.isCaptain,
                                shipID: player.parent ? player.parent.shipclassId: null,

                                itemID: player.itemID ? player.itemID: null,
                                bonus: {
                                    fireRate: player.attackSpeedBonus,
                                    distance: player.attackDistanceBonus,
                                    damage: player.attackDamageBonus,
                                    speed: player.movementSpeedBonus
                                }
                            });
                            playerSaveData.save(err => err ? log(`red`, err): () => {
                                log(`blue`, `Stored data for player ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                                player.socket.disconnect();
                            });
                        }
                    }
                    else if(command == `report` && (isAdmin || isMod)) {
                        let reportUser = args.shift();
                        let reportReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name == reportUser);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                        if(reportIPs.includes(player.socket.handshake.address)) {
                            player.socket.emit(`showCenterMessage`, `You were warned...`, 1);

                            log(`blue`, `Reporter ${playerEntity.name} reported ${player.name} for the second time --> kick | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            bus.emit(`report`, `Second Report --> Kick`, `${getTimestamp()} Reporter ${playerEntity.name} reported ${reportedPlayer} for the second time --> kick\n${reportReason ? `Reason: ${reportReason} | `: ``}\nIP: ${player.socket.handshake.address}\nServer ${player.serverNumber}.`);

                            playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);
                            return player.socket.disconnect();
                        }
                        else {
                            reportIPs.push(player.socket.handshake.address);
                            player.socket.emit(`showCenterMessage`, `You have been reported. ${reportReason ? `Reason: ${reportReason} `: ``}Last warning!`, 1);
                            playerEntity.socket.emit(`showCenterMessage`, `You reported ${player.name}`, 3, 1e4);

                            log(`blue`, `Reporter ${playerEntity.name} reported ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            return bus.emit(`report`, `Second Report --> Kick`, `${getTimestamp()} Reporter ${playerEntity.name} reported ${reportedPlayer}\n${reportReason ? `Reason: ${reportReason}\n`: ``}IP: ${player.socket.handshake.address}\nServer ${player.serverNumber}.`);
                        }
                    }
                    else if(command == `mute` && (isAdmin || isMod)) {
                        let playerToMute = args.shift();
                        let muteReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name == playerToMute);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                        mutePlayer(player);
                        player.socket.emit(`showCenterMessage`, `You have been muted! ${muteReason ? `Reason: ${muteReason}`: ``}`, 1);
                        playerEntity.socket.emit(`showCenterMessage`, `You muted ${player.name}`, 3);

                        log(`blue`, `Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        return bus.emit(`report`, `Muted Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n`: ``}IP: ${player.socket.handshake.address}\n Server ${player.serverNumber}.`);
                    }
                }
            }
            if(!isSpamming(playerEntity, msgData.message)) {
                let msg = msgData.message.toString();

                if(msg.length <= 1) return;

                msg = xssFilters.inHTMLData(msg);
                msg = filter.clean(msg);

                if(msgData.recipient == `global`) {
                    io.emit(`chat message`, {
                        playerId: playerEntity.id,
                        playerName: playerEntity.name,
                        recipient: `global`,
                        message: charLimit(msg, 150)
                    });
                    bus.emit(`msg`, playerEntity.id, playerEntity.name, charLimit(msg, 150));
                }
                else if(msgData.recipient == `local` && entities[playerEntity.parent.id]) {
                    for(let i in entities[playerEntity.parent.id].children) {
                        let player = entities[playerEntity.parent.id].children[i];
                        player.socket.emit(`chat message`, {
                            playerID: playerEntity.id,
                            playerName: playerEntity.name,
                            recipient: `local`,
                            message: charLimit(msg, 150)
                        });
                    }
                }
                else if(msgData.recipient == `clan` && playerEntity.clan != `` && typeof playerEntity.clan != `undefined`) {
                    let clan = playerEntity.clan;
                    for(let i in entities) {
                        let entity = entities[i];
                        if(entity.netType == 0 && entity.clan == clan) {
                            entity.socket.emit(`chat message`, {
                                playerID: playerEntity.id,
                                playerName: playerEntity.name,
                                recipient: `clan`,
                                message: charLimit(msg, 150)
                            });
                        }
                    }
                }
                else if(msgData.recipient == `staff` && (playerEntity.isAdmin || playerEntity.isMod || playerEntity.isDev)) {
                    for(let i in core.players) {
                        let player = core.players[i];
                        if(player.isAdmin || player.isMod || player.isDev) player.socket.emit(`chat message`, {
                            playerID: playerEntity.id,
                            playerName: playerEntity.name,
                            recipient: `staff`,
                            message: charLimit(msg, 150)
                        });
                    }
                }
                else if(msgData.message.length > 1) {
                    socket.emit(`showCenterMessage`, `You have been muted`, 1);
                    log(`blue`, `Player ${playerEntity.name} was auto-muted | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                }
            }
        });

        playerNames = {}
        for(let id in core.players) {
            let playerName = xssFilters.inHTMLData(core.players[id].name);
            playerName = filter.clean(playerName);
            playerNames[id] = playerName;
        }
        socket.emit(`playerNames`, playerNames, socketId);

        socket.on(`changeWeapon`, index => {
            index = xssFilters.inHTMLData(index);
            index = parseInt(index);
            if(playerEntity != undefined && (index == 0 || index == 1 || index == 2)) {
                playerEntity.activeWeapon = index;
                playerEntity.isFishing = false;
            }
        });

        // Fired when player disconnects from the game.
        socket.on(`disconnect`, async data => {
            log(`magenta`, `Player ${playerEntity.name} disconnected from the game | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            if(!DEV_ENV) delete gameCookies[playerEntity.id];

            if(playerEntity.isLoggedIn && playerEntity.serverNumber == 1 && playerEntity.gold > playerEntity.highscore) {
                log(`magenta`, `Update highscore for player: ${playerEntity.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${playerEntity.gold} | IP: ${player.socket.handshake.address}`);
                playerEntity.highscore = playerEntity.gold;

                await User.updateOne({ name: playerEntity.name }, { highscore: playerEntity.gold });
            }

            if(playerEntity.parent.netType == 1 && (playerEntity.parent.shipState != 4 || playerEntity.parent.shipState != 3) && playerEntity.isCaptain && Object.keys(playerEntity.parent.children).length == 1 && playerEntity.parent.hp < playerEntity.parent.maxHp) {
                log(`magenta`, `Player ${playerEntity.name} tried to chicken out --> Ghost ship | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                // Lower the boat HP and remove it from the game.
                playerEntity.parent.hp = 1;
                setTimeout(() => {
                    core.removeEntity(playerEntity);
                    playerEntity.parent.updateProps();
                    core.removeEntity(playerEntity.parents);
                }, 15e3);
            }
            else {
                core.removeEntity(playerEntity);

                if(playerEntity && playerEntity.parent) {
                    // Delete the player entry from the boat.
                    delete playerEntity.parent.children[playerEntity.id];

                    // If the player was on a boat, physically delete it from the boat.
                    if(playerEntity.parent.netType == 1) {
                        playerEntity.parent.updateProps();
                        if(Object.keys(playerEntity.parent.children).length == 0) core.removeEntity(playerEntity.parent);
                    }
                }
            }
        });

        socket.on(`updateKrewName`, name => {
            // Do not allow any form of brackets in the name.
            console.log(name);
            name = name.replace(/[\[\]{}()/\\]/g, ``);
            console.log(name);

            if(name != null && name.length > 1) {
                log(`magenta`, `Update krew name: ${name} | Player name: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                if(name.length > 60) {
                    log(`cyan`, `Exploit detected (crew name length). Player ${playerEntity.name} kicked | Adding IP ${playerEntity.socket.handshake.address} to the ban list | Server ${playerEntity.serverNumber}.`);
                    if(playerEntity.socket.handshake.address.length > 5) {
                        let ban = new Ban({
                            ip: socket.handshake.address,
                            comment: `Exploit: crew name length`
                        });
                        return ban.save(err => err ? log(`red`, err): playerEntity.socket.disconnect());
                    }
                }

                // Filter the ship name.
                name = xssFilters.inHTMLData(name);
                name = filter.clean(name);
                name = name.substring(0, 20);

                console.log(playerEntity.captainId);
                console.log(playerEntity.id);

                // Make sure that the player is the captain of the krew.
                if(core.boats[playerEntity.parent.id] != undefined && playerEntity && playerEntity.parent && playerEntity.captainId == playerEntity.id) {
                    if(krewioData) krewioService.save(krewioData.user, { krewname: name }).then(data => krewioData = data);
                    core.boats[playerEntity.parent.id].crewName = name;
                }
            }
        });

        socket.on(`deletePickup`, pickupId => core.removeEntity(core.entities[pickupId]));

        // For testing performance.
        socket.on(`amountPickup`, type => {
            let typeEntity = type;
            let count = 0;
            for(let i in entities) if(entities[i].type == typeEntity) count++;
            socket.emit(count);
        });
        socket.on(`removeAllCrates`, () => {
            for(let i in entities) if(entities[i].type == 0) core.removeEntity(core.entities[i]);
        });
        socket.on(`minAmountCratesInSea`, amount => cratesInSea.min = amount);
        socket.on(`maxAmountCratesInSea`, amount => cratesInSea.max = amount);

        socket.on(`departure`, departureCounter => {
            // Check if player who sends exitIslandc ommand is docked at island.
            if(playerEntity.parent.anchorIslandId == undefined) log(`cyan`, `Exploit detected (docking at sea). Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            else {
                // Check if player has already clicked sail button. If yes, do nothing.
                if(playerEntity.parent.shipState == 3) {
                    for(let i in core.players) {
                        let player = core.players[i];
                        if(player && player.parent && ((player.parent.netType == 1 && player.parent.anchorIslandId == playerEntity.parent.anchorIslandId)
                        || (player.parent.netType == 5 && player.parent.id == playerEntity.parent.anchorIslandId))) {
                            if(player.parent.id != playerEntity.parent.id) {
                                // If conditions are fulfilled and parent.id is not my parent.id, let the krew list button glow.
                                player.socket.emit(`departureWarning`);
                            }
                        }
                    }

                    if(playerEntity && playerEntity.parent && playerEntity.parent.captainId == playerEntity.id) {
                        let boat = playerEntity.parent;
                        boat.shipState = 4;
                        boat.lastMoved = new Date();
                        boat.recruiting = true;
                        boat.dock_countdown = undefined;

                        if(departureCounter == 1) {
                            boat.departureTime = 25;
                            for(let i in boat.children) {
                                let player = boat.children[i];
                                if(player != undefined && player.netType == 0) player.socket.emit(`showAdinPlayCentered`); // Better way of implementing ads? Players can bypass this.
                            }
                        }
                    }
                }
            }
        });

        // If player chooses to depart from island.
        socket.on(`exitIsland`, data => {
            let boat = playerEntity.parent;

            // If captains ends to exit island request.
            if(playerEntity && playerEntity.parent && playerEntity.parent.captainId == playerEntity.id) {
                boat.exitIsland();

                for(let i in boat.children) {
                    let player = boat.children[i];
                    if(player != undefined && player.netType == 0) {
                        player.socket.emit(`exitIsland`, { captainId: boat.captainId });
                        player.sentDockingMsg = false;
                    }
                }
            }
        });

        // If player chooses to abandon ship.
        socket.on(`abandonShip`, data => {
            let motherShip = playerEntity.parent;

            // Only non-captains can abandon ship.
            if(motherShip) {
                if(motherShip.captainId != playerEntity.id) {
                    if(motherShip.shipState == 0) {
                        let boat = core.createBoat(playerEntity.id, (krewioData || {}).krewname, false);
                        boat.addChildren(playerEntity);
                        boat.setShipClass(0);
                        boat.exitMotherShip(motherShip);
                        boat.speed += parseFloat((playerEntity.movementSpeedBonus) / 10);
                        boat.updateProps();
                        boat.shipState = 0;
                    }
                    else entities[motherShip.anchorIsland] && entities[motherShip.anchorIslandId].addChildren

                    // Delete him from the previous krew.
                    delete motherShip.children[playerEntity.id];
                    motherShip.updateProps && motherShip.updateProps();

                    // Recaulcualte amount of killed ships (by all crew members).
                    let crewKillCount = 0;
                    let crewTradeCount = 0;
                    
                    for(let i in core.players) {
                        let player = core.players[i];
                        if(player.parent != undefined && motherShip.id == player.parent.id) {
                            crewKillCount += player.shipsSank;
                            crewTradeCount += player.overallCargo;
                        }
                    }
                    motherShip.overallKills = crewKillCount;
                    motherShip.overallCargo = crewTradeCount;
                }
            }
        });
        socket.on(`lockKrew`, lockBool => {
            if(playerEntity.isCaptain && lockBool) {
                playerEntity.parent.isLocked = true;
                playerEntity.parent.recruiting = false;
            }
            else if(playerEntity.isCaptain && !lockBool) {
                playerEntity.parent.isLocked = false;
                if(playerEntity.parent.shipState == 2 || playerEntity.parent.shipState == 3 || playerEntity.parent.shipState == 4) playerEntity.parent.recruiting = true;
            }
        });

        socket.on(`clan`, async(action, player, callback) => {
            // Only logged in players can perform clan actions.
            if(!playerEntity.isLoggedIn) return log(`cyan`, `Exploit: Player ${playerEntity.name} tried clan action without login | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            // Get the user performing the action.
            let user = await User.findOne({ name: playerEntity.name });

            // If player has a clan.
            if(playerEntity.clan && playerEntity.clan != ``) {
                // Get the clan from MongoDB.
                let clan = await Clan.findOne({ clan: user.clan });

                // Actions for all members.
                if(action == `getClanData`) {
                    let clanMemberDocs = await User.find({ clan: clan.name });
                    let clanRequestDocs = await User.find({ clanRequest: clan.name });

                    let clanMembers = [];
                    let clanRequests = [];

                    // Only push members to the members list (to prevent duplicates).
                    clanMemberDocs.forEach(document => !clan.leader.includes(document.name) && !clan.owners.includes(document.name) && !clan.assistants.includes(document.name) ? clanMembers.push(document.name): null);
                    clanRequestDocs.forEach(document => clanRequests.push(document.name));

                    let clanData = {
                        name: clan.name,
                        leader: clan.leader,
                        owners: clan.owners,
                        assistants: clan.assistants,
                        members: clanMembers,
                        requests: clanRequests
                    }
                    return callback(clanData);
                }
                else if(action == `leave`) {
                    // If he is the only person in the clan, delete the clan.
                    let clanMembers = await User.find({ clan: playerEntity.clan });
                    if(clan.leader == playerEntity.name && clanMembers.length == 1) clan.delete(err ? log(`red`, err): log(`magenta`, `CLAN DELETED | Leader ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`));
                    else {
                        for(let i in core.players) {
                            let player = core.players[i];
                            if(player.clan == clan.name) player.socket.emit(`showCenterMessage`, `${playerEntity.name} has left your clan.`, 1, 5e3);
                        }
                    }

                    // Dereference the player's clan.
                    playerEntity.clan = ``;
                    user.clan = ``;

                    user.save(err => err ? log(`red`, err): playerEntity.socket.emit(`showCenterMessage`, `You left clan [${clan.name}]`, 1, 5e3));
                    log(`magenta`, `CLAN LEFT | Player ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return callback(true);
                }

                // From this point on there should be a player passed to the emit.
                if(player && playerEntity.clanLeader || playerEntity.clanOwner || playerEntity.clanAssistant) {
                    let otherUser = User.findOne({ name: player });
                    let otherPlayer = Object.values(core.players).find(entity => entity.name == player);

                    // If the player is nonexistent or is not in the same clan.
                    if(!otherUser) return log(`red`, `CLAN UPDATE ERROR | Player ${playerEntity.name} tried to update nonexistent player ${otherPlayer} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
                    else if(action != `accept` && otherUser.clan != user.clan) return log(`red`, `CLAN UPDATE ERROR | Player ${playerEntity.name} tried to update player  ${otherPlayer} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);

                    // Actions for leader / owners / assistants.
                    if(action == `accept`) {
                        // If player is not in a clan and is currently requesting to join this clan.
                        if(otherUser.clan == `` && otherUser.clanRequest == clan.name && otherPlayer.clan == ``) {
                        }
                        else return callback(false);
                    }

                    if(playerEntity.clanLeader || playerEntity.clanOwner) {
                        // Actions for leader / owners.
                        if(action == `promote`) {
                            if(playerEntity.clanLeader && !clan.owners.includes(player) && clan.assistants.includes(player)) {
                                // Only clan leaders can promote to owner.
                                clan.owners.push(player);
                                clan.assistants.splice(clan.assistants.indexOf(player), 1);
                                callback(true);
                            }
                            else if(playerEntity.clanLeader || playerEntity.clanOwner && !clan.assistants.includes(player)) {
                                // Only clan leaders / clan owners can promote to assistant.
                                clan.assistants.push(player);
                                callback(true);
                            }
                            clan.save(err => err ? log(`red`, err): callback(false));
                        }
                        else if(action == `demote`) {}
                        else if(action == `kick`) {}
                    }
                }
            }
            else {
                if(action == `create`) {}
                else if(action == `request`) {}
            }
        });

        // Respawn.
        socket.on(`respawn`, callback => {
            if(playerEntity.parent.hp >= 1) return log(`cyan`, `Player ${playerEntity.name} tried to respawn while his boat still has health | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            // Check for timestamp of last respawn and ban if it was less than 2 seconds ago.
            if(socket.timestamp != undefined && Date.now() - socket.timestamp < 2e3) {
                log(`cyan`, `Exploit detected: multiple respawn | Player: ${playerEntity.name} | Adding IP ${playerEntity.socket.handshake.address} to bannedIPs | Server: ${playerEntity.serverNumber}.`);
                if(playerEntity.socket.handshake.address.length > 5) {
                    let ban = new Ban({
                        IP: socket.handshake.address,
                        comment: `Exploit: multiple respawn`
                    });
                    ban.save(err => err ? log(`red`, err): playerEntity.socket.disconnect());
                }
            }
            else {
                log(`magenta`, `Respawn by Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                // Remove gold on player death.
                playerEntity.gold = parseFloat(Math.max(0, (playerEntity.gold * 0.3).toFixed(0)));
                playerEntity.gold += 1300; // Give player gold for raft 2 after respawn.

                // Dequip item.
                playerEntity.dequip();
                playerEntity.itemId = -1;

                // Remove all cargo.
                playerEntity.cargoUsed = 0;
                for(let i in playerEntity.goods) playerEntity.goods[i] = 0;

                // Respawn player on the sea (on raft 2).
                login.allocatePlayerToBoat(playerEntity, data.boatId, `sea`);
                playerEntity.sentDockingMsg = false;

                // Set timestamp for next respawn.
                socket.timestamp = Date.now();
            }
        });

        // If player chooses to kick crew member.
        socket.on(`bootMember`, playerId => {
            let player = core.players[playerId];

            if(player) {
                let motherShip = player.parent;

                if(motherShip) {
                    // Only captains can boot.
                    if(motherShip.captainId == playerEntity.id && playerEntity.id != player.id) {
                        if(motherShip.shipState == 0) {
                            let boat = core.createBoat(player.id, (krewioData || {}).krewname, false);
                            boat.setShipClass(0);
                            boat.addChildren(player);
                            boat.exitMotherShip(motherShip);
                            
                            boat.speed += parseFloat(playerEntity.movementSpeedBonus / 10);
                            boat.turnspeed += parseFloat((0.05 * playerEntity.movementSpeedBonus) / 10);
                        }
                        else entities[motherShip.anchorIsland] && entities[motherShip.anchorIslandId].addChildren(player);

                        // Delete the player from the previous krew.
                        delete motherShip.children[playerId];
                        motherShip.updateProps();

                        // Recalcualte amount of killed ships (by all crew members).
                        let crewKillCount = 0;
                        let crewTradeCount = 0;

                        for(let i in core.players) {
                            let player = core.players[i];
                            if(player.parent != undefined && motherShip.id == otherPlayer.parent.id) {
                                crewKillCount += player.shipsSank;
                                crewTradeCount += player.overallCargo;
                            }
                        }
                        motherShip.overallKills = crewKillCount;
                        motherShip.overallCargo = crewOverallCargo;
                    }
                }
            }
        });

        socket.on(`transferShip`, playerId => {
            let player = core.players[playerId];
            if(player) {
                let motherShip = playerEntity.parent;
                if(motherShip.captainId == playerEntity.id && playerEntity.id != player.id && player.parent.id == motherShip.id) playerEntity.parent.captainId = playerId;
            }
        });

        socket.on(`joinKrew`, (boatId, callback) => {
            let boat = core.boats[boatId];
            if(boat != undefined && boat.isLocked != true) {
                let playerBoat = playerEntity.parent; // Player's boat, or anchored island if they do not own a boat.
                let krewCargoUsed = 0;

                for(let i in boat.children) krewCargoUsed += boat.children[i].cargoUsed;

                let joinCargoAmount = krewCargoUsed + playerEntity.cargoUsed;
                let maxShipCargo = core.boatTypes[boat.shipclassId].cargoSize;

                let emitJoinKrew = id => {
                    if(entities[id] && entities[id].socket && entities[id].parent && entities[id].parent.crewName) entities[id].socket.emit(`showCenterMessage`, `You have joined "${entities.id.parent.crewName}"`, 3);
                }

                let movedIds = {}

                let emitNewKrewMembers = () => {
                    let names = ``;
                    for(let i in movedIds) names += ` ${movedIds[i]},`;
                    names = names.replace(/,$/gi, ``).trim();

                    for(let id in boat.children) {
                        if(entities[id] && entities[id] && movedIds[id] == undefined) {
                            if(Object.keys(movedIds).length == 1) for(let i in movedIds) entities[id].socket.emit(`showCenterMessage`, `New krew member ${movedIds[i]} has joined your krew!`, 3);
                            else if(Object.keys(movedIds).length > 1) entities[id].socket.emit(`showCenterMessage`, `New krew members ${names} have joined your krew!`, 3);
                        }
                    }
                }
                // Event filtering.
                if(boat && (boat.shipState == 3 || boat.shipState == 2 || boat.shipState == -1 || boat.shipState == 4)
                && playerBoat && (playerBoat.shipState == 3 || playerBoat.shipState == 2 || boat.shipState == -1 || playerBoat.shipState == 4 || playerBoat.netType == 5)
                && boat != playerBoat) {
                    if(joinCargoAmount > maxShipCargo) {
                        playerEntity.socket.emit(`showCenterMessage`, `This krew does not have enough space for your cargo!`, 3);
                        callback(1);
                    }
                    else {
                        callback(0);

                        // If player doesn't own a ship.
                        if(playerBoat.netType == 5) {
                            boat.addChildren(playerEntity);
                            boat.updateProps();

                            emitJoinKrew(playerEntity.id);
                            movedIds[playerEntity.id] = playerEntity.name;
                        }
                        else {
                            // Check if there's enough capacity in target boat.
                            if(Object.keys(boat.children).length < boat.maxKrewCapacity) {
                                // Delete player from the old boat.
                                delete playerBoat.children[playerEntity.id];
                                playerBoat.updateProps();

                                // Add the player to the new boat.
                                boat.addChildren(playerEntity);
                                boat.updateProps();

                                // If the player was originally a captain.
                                if(playerBoat.captainId == playerEntity.id) {
                                    playerEntity.isCaptain = false;

                                    // Check if the boat has enough space for all players to join.
                                    if(Object.keys(playerBoat.children).length + Object.keys(boat.children).length <= boat.maxKrewCapacity) {
                                        for(let id in playerBoat.children) {
                                            let krewPlayer = playerBoat.children[id];
                                            boat.addChildren(krewPlayer);
                                            boat.updateProps();

                                            krewPlayer.isCaptain = false;
                                            delete playerBoat.children[krewPlayer.id];
                                            playerBoat.updateProps();

                                            emitJoinKrew(krewPlayer.id);
                                            movedIds[id] = krewPlayer.name;
                                        }
                                        core.removeEntity(playerBoat);
                                    }
                                    else {
                                        delete playerBoat.children[playerEntity.id];
                                        playerBoat.updateProps();

                                        emitJoinKrew(playerEntity.id);
                                        movedIds[playerEntity.id] = playerEntity.name;

                                        if(Object.keys(playerBoat.children).length == 0) core.removeEntity(playerBoat);
                                    }
                                }
                            }
                        }
                        emitNewKrewMembers();

                        // Recalculate amount of killed ships and traded cargo (by all crew members).
                        let crewKillCount = 0;
                        let crewTradeCount = 0;

                        for(let i in core.players) {
                            let player = core.players[i];
                            if(player.parent != undefined && playerEntity.parent.id == player.parent.id) {
                                crewKillCount += player.shipsSank;
                                crewTradeCount += player.overallCargo;
                            }
                        }
                        playerEntity.parent.overallKills = crewKillCount;
                        playerEntity.parent.overallCargo = crewTradeCount;
                    }
                }
            }
        });

        // When ship enters docking area.
        socket.on(`dock`, () => {
            if(playerEntity.parent.shipState == 1 && playerEntity.parent.captainId == playerEntity.id) playerEntity.parent.dock_countdown = new Date();
        });

        // When ship docks completely (anchors) in the island.
        socket.on(`anchor`, () => {
            if(playerEntity.parent.dock_countdown < new Date() - 8e3 && playerEntity.parent.shipState == 1 && playerEntity.parent.captainId == playerEntity.id) playerEntity.parent.shipState = 2;
        });

        // When player buys an item.
        socket.on(`purchase`, (item, callback) => {
            checkPlayerStatus();
            log(`magenta`, `Player ${playerEntity.name} is buying `, item, ` while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            // Check if id is an integer > 0.
            if(!isNormalInteger(item.id)) return;

            // Ship
            if(item.type == 0 && playerEntity.parent.shipState != 4) {
                if(playerEntity) {
                    let ships = {}

                    let cargoUsed = 0;
                    for(let i in playerEntity.goods) cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
                    playerEntity.cargoUsed = cargoUsed;

                    // Put together item.id and item.type and send them back to the client.
                    let response = item.type + item.id;
                    callback(response);

                    playerEntity.otherQuestLevel = playerEntity.otherQuestLevel == undefined ? 0: playerEntity.otherQuestLevel;

                    // Give the rewards for the quests.
                    if(playerEntity.gold >= core.boatTypes[item.id].price) {
                        let questLists = [
                            [`04`, `05`, `06`, `07`, `015`, `016`], // Trader or boat.
                            [`08`, `09`, `010`, `012`, `013`, `018`, `019`], // Destroyer, calm spirit, or royal fortune.
                            [`014`, `020`] // Queen Barb's Justice
                        ]

                        if(questLists[0].includes(response) && playerEntity.otherQuestLevel == 0) {
                            playerEntity.socket.emit(`showCenterMessage`, `Achievement: Peaceful Sailor: +5,000 Gold & 500 XP`)
                            playerEntity.gold += 5e3;
                            playerEntity.experience += 500;
                            playerEntity.otherQuestLevel++;
                        }
                        if(questLists[1].includes(response) && playerEntity.otherQuestLevel == 0) {
                            playerEntity.socket.emit(`showCenterMessage`, `Achievement: Peaceful Sailor: +10,000 Gold & 1,000 XP`)
                            playerEntity.gold += 1e4;
                            playerEntity.experience += 1e3;
                            playerEntity.otherQuestLevel++;
                        }
                        if(questLists[2].includes(response) && playerEntity.otherQuestLevel == 0) {
                            playerEntity.socket.emit(`showCenterMessage`, `Achievement: Peaceful Sailor: +50,000 Gold & 5,000 XP`)
                            playerEntity.gold += 5e4;
                            playerEntity.experience += 5e3;
                            playerEntity.otherQuestLevel++;
                        }
                    }
                    playerEntity.purchaseShip(item.id, (krewioData || {}).krewname);

                    // Calculate other quest level of captain.
                    for(let i in core.players) {
                        let player = core.players[i];
                        if(otherPlayer.parent != undefined && playerEntity.parent.id == player.parent.id && player.isCaptain) playerEntity.parent.otherQuestLevel = otherQuestLevel;
                    }
                    playerEntity.parent.otherQuestLevel = otherQuestLevel;
                }
            }
            else if(item.type == 1) {
                // Item.
                callback(item.id);

                // Check conditions for buying demolisher.
                if(item.id == `11` &&  playerEntity.gold >= 1e5) {
                    if(playerEntity.overallCargo >= 1e3 && playerEntity.shipsSank >= 10) {
                        playerEntity.purchaseItem(item.id);
                        log(`magenta`, `Player ${playerEntity.name} is buying item`, item, ` (Demolisher) while having ${Math.floor(playerEntity.gold)} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    }
                }
                else if(item.id == `14` && playerEntity.gold >= 15e4) {
                    // Player can buy this item only once.
                    if(!playerEntity.statsReset) {
                        // Reset stats.
                        for(let i in playerEntity.points) playerEntity.points[i] = 0;
                        playerEntity.availablepoints = playerEntity.level;
                        playerEntity.statsReset = true;
                        playerEntity.purchaseItem(item.id);
                        log(`magenta`, `Player ${playerEntity.name} is buying item `, item, ` (Fountain of Youth) while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    }
                }
                else {
                    playerEntity.purchaseItem(item.id);
                    log(`magenta`, `Player ${playerEntity.name} is buying item `, item, ` while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
                }
            }

            // Recalculate amount of killed ships and traded cargo (by all crew members).
            let crewKillCount = 0;
            let crewTradeCount = 0;

            for(let i in core.players) {
                let player = core.players[i];
                if(player.parent != undefined && playerEntity.parent.id == player.parent.id) {
                    crewKillCount += player.shipsSank;
                    crewTradeCount += player.overallCargo;
                }
            }
            playerEntity.parent.overallKills = crewKillCount;
            playerEntity.parent.overallCargo = crewTradeCount;
        });

        // Get ships in shop.
        socket.on(`getShips`, callback => {
            if(playerEntity && playerEntity.parent) {
                let ships = {}
                let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

                if(!island || island.netType != 5) return (callback && callback.call && callback(`Oops, it seems you are not at an island.`));

                let cargoUsed = 0;
                for(let i in playerEntity.goods) cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
                playerEntity.cargoUsed = cargoUsed;

                for(let i in core.boatTypes) {
                    if((!island.onlySellOwnShips && (core.boatTypes[i].availableAt == undefined || core.boatTypes[i].availableAt.indexOf(island.name) != -1))
                    || (core.boatTypes[i].availableAt && core.boatTypes[i].availableAt.indexOf(island.name) != -1)) {
                        ships[i] = core.boatTypes[i];
                        ships[i].purchasable = 
                            playerEntity.gold >= ships[i].price
                            && ships[i].cargoSize >= playerEntity.cargoUsed;
                    }
                }
                callback && callback.call && callback(undefined, ships);
            }
            callback && callback.call && callback(`Oops, it seems you don't have a boat.`);
        });

        // Get items in shop.
        socket.on(`getItems`, callback => {
            if(playerEntity && playerEntity.parent) {
                let items = {}
                let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

                if(!island || island.netType != 5) return (callback && callback.call && callback(`Oops, it seems you are not in an island.`));

                for(let i in core.itemTypes) {
                    let itemProb = Math.random().toFixed(2);

                    if(playerEntity.itemId == core.itemTypes[i].id || (playerEntity.checkedItemsList && playerEntity.rareItemsFound.includes(core.itemTypes[i].id))) itemProb = 0;
                    if(playerEntity.checkedItemsList && !playerEntity.rareItemsFound.includes(core.itemTypes[i].id)) itemProb = 1;

                    if(itemProb <= core.itemTypes[i].rarity
                    && (core.itemTypes[i].availableAt == undefined || core.itemTypes[i].availableAt.indexOf(island.name) != -1
                    || (core.itemTypes[i].availableAt && core.itemTypes[i].availableAt.indexOf(island.name) != -1))) {
                        items[i] = core.itemTypes[i];

                        if(!playerEntity.checkedItemsList && core.itemTypes[i].rarity != 1) playerEntity.rareItemsFound.push(core.itemTypes[i].id);
                        items[i].purchasable = false;

                        if(playerEntity.gold >= items[i].price) items[i].purchasable = true;
                    }
                }
                playerEntity.checkedItemsList = true;
                callback && callback.call && callback(undefined, items);
            }
            callback && callback.call && callback(`Oops, it seems you don't have items.`);
        });

        // Get goods in shop.
        socket.on(`getGoodsStore`, callback => {
            if(playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId) {
                if(core.entities[playerEntity.parent.anchorIslandId] == undefined) return callback && callback.call && callback(`Oops, it sems you don't have an anchored boat.`);
            }

            let data = {
                cargo: core.boatTypes[playerEntity.parent.shipclassId].cargoSize,
                gold: playerEntity.gold,
                goods: playerEntity.goods,
                goodsPrice: core.entities[playerEntity.parent.anchorIslandId] ? core.entities[playerEntity.parent.anchorIslandId].goodsPrice: 0,
                cargoUsed: 0
            }

            for(let i in playerEntity.parent.children) {
                let child = playerEntity.parent.children[i];
                if(child && child.netType == 0 && core.entities[child.id] != undefined) {
                    let cargoUsed = 0;
                    for(let i in child.goods) cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
                    data.cargoUsed += cargoUsed;

                    if(core.entities[child.id]) core.entities[child.id].cargoUsed = cargoUsed;
                }
                callback && callback.call && callback(undefined, data);
            }
            callback && callback.call && callback(`Oops, it seems you don't have an anchored boat.`);
        });

        // When player buys goods.
        socket.on(`buy-goods`, (transaction, callback) => {
            // Add a timestamp to stop hackers from spamming buy / sell emits.
            if(Date.now() - playerEntity.goodsTimestamp < 800) {
                playerEntity.sellCounter++;
                if(playerEntity.sellCounter > 3) {
                    log(`cyan`, `Player ${playerEntity.name} is spamming buy / sell emits --> Kicking | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    playerEntity.socket.disconnect();
                }
            }
            else playerEntity.sellCounter = 0;
            playerEntity.goodsTimestamp = Date.now();
            
            checkPlayerStatus();
            log(`magenta`, `Operation: ${transaction.action} - `, transaction, ` | Player: ${playerEntity.name} | Gold: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            
            if(playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId && (playerEntity.parent.shipState == 3 || playerEntity.parent.shipState == 4)) {
                Object.assign(transaction, {
                    goodsPrice: entities[playerEntity.parent.anchorIslandId].goodsPrice,
                    gold: playerEntity.gold,
                    goods: playerEntity.goods,
                    cargo: core.boatTypes[playerEntity.parent.shipclassId].cargoSize,
                    cargoUsed: 0
                });

                for(let i in playerEntity.parent.children) {
                    let child = playerEntity.parent.children[i];
                    if(child && child.netType == 0 && core.entities[child.id] != undefined) {
                        let cargoUsed = 0;
                        for(let i in child.goods) cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
                        transaction.cargoUsed += cargoUsed;
                    }
                }
                transaction.quantity = parseInt(transaction.quantity);

                // Start quantity validation.
                let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];
                if(transaction.action == `buy`) {
                    playerEntity.lastIsland = island.name;
                    let max = parseInt(transaction.gold / transaction.goodsPrice[transaction.good]);
                    let maxCargo = (transaction.cargo - transaction.cargoUsed) / core.goodsTypes[transaction.good].cargoSpace;

                    if(max > maxCargo) max = maxCargo;
                    max = Math.floor(max);
                    if(transaction.action.quantity > max) transaction.quantity = max;
                }
                if(transaction.quantity.action == `sell` && transaction.quantity > transaction.goods[transaction.good]) transaction.quantity = transaction.goods[transaction.good];
                if(transaction.quantity < 0) transaction.quantity = 0;

                // Start transaction.
                if(transaction.action == `buy`) {
                    // Remove gold and add goods.
                    let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
                    transaction.gold -= gold;
                    transaction.goods[transaction.good] += transaction.quantity;
                }
                else if(transaction.action == `sell`) {
                    // Add gold and remove goods.
                    // This is a stub of validation to stop active exploits, consider to expand this to only player-owned goods.
                    if(transaction.cargoUsed < transaction.quantity) {
                        log(`cyan`, `Exploit detected (sell more than you have). Kicking player ${playerEntity.name} | IP: ${playerEntity.socket.hanshake.address} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}`);
                        return playerEntity.socket.disconnect();
                    }

                    let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
                    transaction.gold += gold;
                    transaction.goods[transaction.good] -= transaction.quantity;

                    if(playerEntity.lastIsland != island.name) playerEntity.overallCargo += gold;
                    if(transaction.goods[transaction.good] < 0 || playerEntity.goods[transaction.good] < 0) {
                        log(`cyan`, `Exploit detected (sell wrong goods) | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return playerEntity.socket.disconnect();
                    }

                    // Trading achievement.
                    playerEntity.tradeLevel = playerEntity.tradeLevel == undefined ? 0: playerEntity.tradeLevel;
                    if(playerEntity.overallCargo >= 1e3 && playerEntity.tradeLevel == 0) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading beginner: +1,000 Gold +100 XP`, 3);
                        transaction.gold += 1e3;
                        
                        playerEntity.experience += 100;
                        playerEntity.tradeLevel++;
                    }
                    else if(playerEntity.overallCargo >= 6e3 && playerEntity.tradeLevel == 1) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                        transaction.gold += 2e3;
                        
                        playerEntity.experience += 200;
                        playerEntity.tradeLevel++;
                    }
                    else if(playerEntity.overallCargo >= 15e3 && playerEntity.tradeLevel == 2) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                        transaction.gold += 5e3;
                        
                        playerEntity.experience += 500;
                        playerEntity.tradeLevel++;
                    }
                    else if(playerEntity.overallCargo >= 3e4 && playerEntity.tradeLevel == 3) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                        transaction.gold += 1e4;
                        
                        playerEntity.experience += 1e3;
                        playerEntity.tradeLevel++;
                    }
                }

                // Calculate amount of traded cargo (by all crew numbers).
                let crewTradeCount = 0;
                for(let i in core.players) {
                    let player = core.players[i];
                    if(player.parent != undefined && playerEntity.parent.id == player.parent.id) crewTradeCount += player.overallCargo; 
                }
                playerEntity.parent.overallCargo = crewTradeCount;

                // Update player.
                playerEntity.gold = transaction.gold;
                playerEntity.goods = transaction.goods;

                // Update player highscore in MongoDB.
                if(playerEntity.isLoggedIn == true && playerEntity.serverNumber == 1 && playerEntity.lastIsland != island.name && playerEntity.gold > playerEntity.highscore) {
                    log(`magenta`, `Update highscore for player ${playerEntity.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address}.`);
                    playerEntity.highscore = playerEntity.gold;

                    User.findOne({ username: playerEntity.name }, { highscore: playerEntity.highscore });
                }

                callback && callback.call && callback(undefined, {
                    gold: transaction.gold,
                    goods: transaction.goods
                });

                for(let i in playerEntity.parent.children) {
                    let child = playerEntity.parent.children[i];
                    if(child && child.netType == 0 && core.entities[child.id] != undefined) {
                        cargoUsed = 0;
                        for(let i in child.goods) cargoUsed += child.goods[i] & core.goodsTypes[i].cargoSpace;

                        transaction.cargoUsed += cargoUsed;
                        core.entities[child.id].cargoUsed = cargoUsed;
                        if(child.id != playerEntity.id) child.socket.emit(`cargoUpdated`);
                    }
                }
                return log(`cyan`, `After Operation ${transaction.action} | Player: ${playerEntity.name} | Gold: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`)
            }
            callback && callback.call && callback(new Error(`Oops, it seems that you don't have a boat.`));
        });

        // Return experience points to player.
        socket.on(`getExperiencePoints`, callback => {
            if(playerEntity && playerEntity.parent) {
                playerEntity.updateExperience();

                let obj = {
                    experience: playerEntity.experience,
                    points: playerEntity.points,
                    availablePoints: playerEntity.availablePoints
                }

                callback && callback.call && callback(undefined, obj);
            }
            callback && callback.call && callback(`Oops, it seems that you don't have a boat.`);
        });

        // Allocate points to player.
        socket.on(`allocatePoints`, (points, callback) => {
            // Check amount of already allocated points.
            let countPoints = 0;
            for(let i in playerEntity.points) countPoints += playerEntity.points[i];

            // Validate the player's stats.
            if(countPoints > 50) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
            if(playerEntity.availablePoints > 50) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);

            // Check if player has available points and if he has already allocated 51 points.
            if(playerEntity && playerEntity.parent  && playerEntity.availablePoints > 0 && playerEntity.availablePoints <= 50 && countPoints < 51) {
                log(`magenta`, `Points allocated: `, points, ` | Overall allocated points: ${countPoints + 1} | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);

                let countAllocatedPoints = 0;
                for(let i in points) {
                    let point = points[i];
                    countAllocatedPoints += point;

                    if(point < 0 || !Number.isInteger(point) || !(i == `fireRate` || i == `distance` || i == `damage`) || countAllocatedPoints > 1) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
                    else if(point != undefined && typeof point == `number` && playerEntity.availablePoints > 0 && point <= playerEntity.availablePoints) {
                        playerEntity.points[i] += point;
                        playerEntity.availablePoints -= point;
                    }
                }

                playerEntity.updateExperience();
                callback && callback.call && callback(undefined);
            }
            callback  && callback.call && callback(`Oops, it seems that you don't have a boat.`);
        });

        // Bank data.
        socket.on(`bank`, async data => {
            if(playerEntity.isLoggedIn) {
                if(playerEntity.parent.name == `Labrador` || (playerEntity.parent.anchorIslandId && core.Landmarks[playerEntity.parent.anchorIslandId].name == `Labrador`)) {
                    let setBankData = async() => {
                        let bankData = {
                            myGold: playerEntity.bank.deposit,
                            totalGold: 0
                        }

                        // Get the sum of all bank accounts from MongoDB.
                        let users = await User.find({}).filter(bankDeposit > 5e4);
                        users.forEach(document => bankData.totalGold += document.bankDeposit - 5e4);
                        socket.emit(`setBankData`, bankData);
                    }

                    if(data) {
                        if(data.deposit && playerEntity.gold >= data.deposit && data.deposit >= 1 && data.deposit <= 15e4 && typeof data.deposit == `number` && data.deposit + playerEntity.bank.deposit <= 15e4) {
                            let integerDeposit = Math.trunc(data.deposit);
                            playerEntity.gold -= integerDeposit;

                            // Handle the deposit.
                            if(playerEntity.bank.deposit >= 5e4) {
                                // If there is already 50K in the bank, don't save the deposit to MongoDB.
                                playerEntity.bank.deposit += integerDeposit;
                            }
                            else if(playerEntity.bank.deposit + integerDeposit > 5e4) {
                                // If the player does not have 50K in the bank, but the deposit will exceed that amount, then store up to 50K in MongoDB and the rest in memory.
                                let excessAmount = (playerEntity.bank.deposit + integerDeposit) - 5e4;
                                playerEntity.bank.deposit += integerDeposit;

                                await User.updateOne({ username: playerEntity.name }, { bankDeposit: 5e4 });
                            }
                            else {
                                // If the player does not have 50K in the bank, but the deposit will not exceed that amount, then store the new value in MongoDB.
                                playerEntity.bank.deposit += integerDeposit;
                                await User.updateOne({ username: playerEntity.name }, { bankDeposit: playerEntity.bank.deposit });
                            }
                            setBankData();
                            log(`magenta`, `Bank deposit | Player: ${playerEntity.name} | Deposit: ${integerDeposit} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
                        }
                        else if(data.takeDeposit && playerEntity.bank.deposit >= data.takeDeposit && data.takeDeposit >= 1 && data.takeDeposit <= 15e4 && typeof data.takeDeposit == `number`) {
                            let integerDeposit = Math.trunc(data.takeDeposit);

                            // Take 10% fee for bank transaction.
                            playerEntity.gold += integerDeposit * 0.9
                            playerEntity.bankDeposit  -= integerDeposit;

                            // Update in MongoDB if player bank deposit is below or equal to 50K.
                            if(playerEntity.bank.deposit <= 5e4) await User.updateOne({ username: playerEntity.name }, { bankDeposit: playerEntity.bankDeposit });
                            setBankData();
                        }
                        else setBankData();
                    }
                }
            }
            else socket.emit(`setBankData`, { warn: 1 });
        });

        // Clan map marker.
        socket.on(`addMarker`, data => {
            if(playerEntity.clan != `` && playerEntity.clan != undefined) {
                if(playerEntity.markermapCount < new Date - 5e3) {
                    if(data.x && data.y && typeof data.x == `number` && typeof data.y == `number` && data.x > 0 && data.y > 0 && data.x < worldsize && data.y < worldsize) {
                        playerEntity.markerMapCount = new Date();
                        let clan = playerEntity.clan;
                        for(let i in entities) {
                            if(entities[i].netType == 0 && entities[i].clan == clan) {
                                entities[i].socket.emit(`chat message`, {
                                    playerId: playerEntity.id,
                                    playerName: playerEntity.name,
                                    recipient: `clan`,
                                    message: `Attention to the map!`
                                });
                                entities[i].socket.emit(`clanMarker`, data);
                            }
                        }
                    }
                }
            }
        });

        socket.on(`christmas`, () => {
            if(christmasGold > 1e4) {
                log(`cyan`, `Exploit detected: Gift spam | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                return playerEntity.socket.disconnect();
            }

            playerEntity.socket.emit(`showCenterMessage`, `Christmas presents...`, 3);
            playerEntity.gold += 10;
            christmasGold += 10;
        });
    }

    // Catch players with local script modification.
    socket.on(`createPIayer`, data => {
        data.hacker = true;
        log(`Possible exploit detected (modified client script). Player name: ${data.name} | IP: ${socket.handshake.address}`);
        createThePlayer(data); // If hackers appear once again, can be changed to ban.
    });

    // Assing player data sent from the client.
    socket.on(`createPlayer`, data => {
        createThePlayer(data);
    });

    let createThePlayer = data => {
            if (data.token && data.name) {
              // decode base64 token
              let buff = new Buffer.from(data.token, 'base64');
              let decodedToken = buff.toString('ascii');
        
              const options = {
                url: 'https://' + process.env.AUTH0_DOMAIN + '/api/v2/users/' + decodedToken,
                headers: {"Content-Type": "application/json", "Authorization": "Bearer " + auth0AccessToken}
              }
        
              function callback (error, response, body) {
                if (!error && response.statusCode === 200) {
                  try {
                    let info = JSON.parse(body);
                    // validate if user sent the correct token
                    if (info.user_id === decodedToken) {
                      var name = info.username;
                      if(!info.username || info.username === '') {
                        name = info.name;
                        if(!info.name || info.name === '') {
                          name = info.nickname;
                        }
                      }
        
                      name = xssFilters.inHTMLData(name);
                      name = filter.clean(name);
                      name = name.substring(0, 24);
                      data.name = name;
                      data.last_ip = info.last_ip
                      if (Object.keys(core.players).length !== 0) {
                        for (let player in core.players) {
                          if (core.players[player].name === name) {
                            log(`cyan`, `Player ${name} tried to login multiple times`);
                            return;
                          }
                        }
                        initSocketForPlayer(data);
                      } else {
                        initSocketForPlayer(data);
                      }
                    }
                    else {
                      data.name = undefined
                      initSocketForPlayer(data);    
                      log(`cyan`, `Player tried to login with invalid username. Creating player as seadog`);
                    }
                  } catch (e) {
                    log(`red`, `Error IN AUTH0 CALLBACK`, e);
                  }
                }
                else {
                  data.name = undefined
                  initSocketForPlayer(data);
                  // TODO: add proper logging
                  log(`cyan`, `Player passed wrong cookie or Auth0 get user info failed. Creating player as seadog`);
                }
              }
        
              function somes() {
                types = request(options, callback);
              }
              somes()
            }
            else {
              initSocketForPlayer(data)
            }
    }

    // Send full world information - force full dta. First snapshot (compress with lz-string).
    socket.emit(`s`, lzString.compress(JSON.stringify(core.compressor.getSnapshot(true))));
});


// check if string is an integer greater than 0
let isNormalInteger = function (str) {
  let n = ~~Number(str);
  return String(n) === str && n >= 0;
};

let serializeId = function (id) {
  return id.substring(2, 6);
};

// emit a snapshot every 100 ms
let snapCounter = 0;
exports.send = function () {
  snapCounter = snapCounter > 10 ? 0 : snapCounter + 1;
  let msg;

  // if more than 10 snapShots are queued, then send the entire world's Snapshot. Otherwise, send delta
  msg = snapCounter === 10 ? core.compressor.getSnapshot(false) : core.compressor.getDelta();

  if(msg) {
    // compress snapshot data with lz-string
    msg = lzString.compress(JSON.stringify(msg));
    io.emit('s', msg);
  }
}

exports.io = io;

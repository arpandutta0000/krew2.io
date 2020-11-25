// Require modules.
const xssFilters = require(`xss-filters`);
const axios = require(`axios`);

// Server startup config.
global.cratesInSea = {
    min: 480,
    max: 1100
}
let reportIPs = [];

// Admin panel.
const thugConfig = require(`./config/thugConfig.js`);

// Auth login.
let login = require(`./auth/login.js`);

// Profanity filter.
let Filter = require(`bad-words`), filter = new Filter();
let additionalBadWords = [`idiot`, `2chOld`, `Yuquan`];
filter.addWords(...additionalBadWords);

// Server for socket.io
let http = require(`http`);
let https = require(`https`);

// Mongoose API wrapper for MongoDB.
const mongoConnection = require(`./utils/mongoConnection.js`);

// Mongoose Models
const User = require(`./models/user.model.js`);
const Clan = require(`./models/clan.model.js`);
const Ban = require(`./models/ban.model.js`);
const Hacker = require(`./models/hacker.model.js`);
const PlayerRestore = require(`./models/playerRestore.model.js`);

// Utils.
const log = require(`./utils/log.js`);
const sha256 = require(`./utils/sha256.js`);
const md5 = require(`./utils/md5.js`);
const { isSpamming, mutePlayer } = require(`./utils/spam.js`);

// Log the time that the server started up.
let serverStartTimestamp = Date.now();
log(`UNIX Timestamp for server start: ${serverStartTimestamp}.`);

// Configure the socket.
if(global.io == undefined) {
    let server = process.env.NODE_ENV == `prod` ? https.createServer({
        key: fs.existsSync(config.ssl.key) ? fs.readFileSync(config.ssl.key): null,
        cert: fs.existsSync(config.ssl.cert) ? fs.readFileSync(config.ssl.cert): null,
        requestCert: false,
        rejectUnauthorized: false
    }): http.createServer();

    global.io = require(`socket.io`)(server, { origins: `*:*` });
    server.listen(process.env.port);
}

// Alphanumeric string checker.
const isAlphanumeric = str => {
    let regex = /^[a-z0-9]+$/i
    return regex.test(str);
}

// Discord webhook.
const webhook = require(`webhook-discord`);
let Hook = new webhook.Webhook(process.env.WEBHOOK_URL);

log(`Socket.IO is running on port ${process.env.port}.`);

// Define serverside account perms.
const staff = {
    admins: [`devclied`, `LeoLeoLeo`, `DamienVesper`, `ITSDABOMB`, `harderman`],
    mods: [`Fiftyyyyyy`, `Sloth`, `Sj`, `TheChoco`, `Kekmw`, `Headkeeper`],
    devs: [`Yaz_`]
}

// Socket connection between client and server.
io.on(`connection`, async socket => {
    let krewioData;

    // Get socket ID (player ID).
    let socketID = serializeId(socket.id);

    // Let the client know the socket ID and that we have succesfully established a connection.
    socket.emit(`handshake`, { socketID });

    // Define the player entity that stores all data for the player.
    let playerEntity;

    let initPlayerSocket = async data => {
        // Player entity already exists, so don't create another one else it will duplicate itself.
        if(playerEntity) return;

        // Check if the player IP is in the ban list.
        let isIPBanned = await Ban.findOne({ IP: socket.handshake.address });
        if(isIPBanned) {
            log(`Detected banned IP ${socket.handshake.address} attempting to connect. Disconnecting ${data.name}.`);
            socket.emit(`showCenterMessage`, `You have been banned... Contact us on Discord`, 1, 6e4);

            socket.banned = true;
            return socket.disconnect();
        }

        // Check to see if the player is using a VPN.
        axios.get(`http://check.getipintel.net/check.php?ip=${socket.handshake.address.substring(7)}&contact=dzony@gmx.de&flags=f&format=json`).then((err, res) => {
            if(err) return log(err);

            if(res.data && res.data.status == `success` && parseInt(res.data.result) == 1) {
                socket.emit(`showCenterMessage`, `Disable VPN to play this game`, 1, 6e4);
                log(`VPN connection. Disconnecting IP: ${socket.handshake.address}.`);

                // Ban the IP.
                let ban = new Ban({
                    timestamp: new Date(),
                    IP: socket.handshake.address,
                    comment: `Auto VPN temp ban`
                });
                return ban.save(err => err ? log(err): socket.disconnect());
            }
        });

        // Check if cookie has been blocked.
        if(data.cookie != undefined && data.cookie != ``) {
            if(Object.values(gameCookies).includes(data.cookie)) return log(`Trying to spam multiple players... ${socket.handshake.address}.`);
            gameCookies[socketID] = data.cookie;
        }

        // Create player in the world.
        data.socketID = socketID;
        playerEntity = core.createPlayer(data);
        playerEntity.socket = socket;

        // Check if user is logged in, and if so, that they are coming from their last IP logged in with.
        if(data.lastIP && !(playerEntity.socket.handshake.address.includes(data.lastIP))) {
            log(`Player ${playerEntity.name} tried to connect from different IP than login. Kick | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            return playerEntity.socket.disconnect();
        }

        // Identify the server that the player is playing on.
        playerEntity.serverNumber = playerEntity.socket.handshake.headers.host.substr(-4) == `2001` ? 1: 2;
        playerEntity.sellCounter = 0;

        if(playerEntity.socket.request.headers.user-agent && playerEntity.socket.handshake.address) log(`Creation of new player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | UA: ${playerEntity.socket.request.headers.user-agent} | Origin: ${playerEntity.socket.request.headers.origin} | Server ${playerEntity.serverNumber}.`);

        // Log hackers if detected.
        if(data.hacker) {
            log(`Exploit detected (modified client script / wrong emit). Player name: ${playerEntity.name} | IP: ${socket.handshake.address}.`);
            let hacker = new Hacker({
                name: playerEntity.name,
                IP: socket.handshake.address
            });
            hacker.save(err => err ? log(err): playerEntity.socket.disconnect());
        }

        // Only start the restore process if the server start was less than 5 minutes ago.
        if(Date.now() - serverStartTimestamp < 3e5) {
            let playerSave = await PlayerRestore.findOne({ IP: socket.handshake.address });
            if(playerStore && Date.now() - playerStore.timestamp < 3e5) {
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
    }

    // Allocate player to the game.
    login.allocatePlayerToBoat(playerEntity, data.boatID, data.spawn);

    // Get snapshot.
    socket.on(`u`, data => playerEntity.parseSnap(data));

    let checkPlayerStatus = () => {
        if(playerEntity.parent.shipState == 1 || playerEntity.parent.shipState == 0) log(`Possible Exploit detected (buying from sea) ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
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
    socket.on(`chatMessage`, async msgData => {
        // Check for spam.
        if(msgData.message.length > 65 && !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
            log(`Exploit detected (spam). Player: ${playerEntity.name} Adding IP ${playerEntity.socket.handshake.address} to banned IPs | Server ${playerEntity.serverNumber}.`);
            log(`Spam message: ${msgData.message}`);

            let ban = new Ban({
                timestamp: new Date(),
                IP: playerEntity.socket.handshake.address,
                comment: `Auto chat spam temp ban`
            });
            ban.save(err => err ? log(err): playerEntity.socket.disconnect());
        }

        // Staff commands.
        if((msgData.message.startsWith(`//`) || msgData.message.startsWith(`!!`)) && playerEntity.isLoggedIn) {
            // If the player is not a staff member, disregard the command usage.
            if(!staff.admins.includes(playerEntity.name) && !staff.mods.includes(playerEntity.name) && !staff.devs.includes(playerEntity.name)) return;

            // Respective prefixes.
            if(msgData.message.startsWith(`!!`) && !staff.admins.includes(playerEntity.name) && !staff.devs.includes(playerEntity.name)) return;
            if(msgData.message.startsWith(`//`) && !staff.mods.includes(playerEntity.name)) return;

            // Parse the message for arguments and set the command.
            let args = msgData.message.toString().slice(2).split(/+/g);
            let command = args.shift();


            // If the user has not authenticated, only give them access to login command.
            if(!playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
                let pwd = await md5(args[0]);
                if(command == `login`) {
                    let isAdmin = thugConfig.staff.admins[playerEntity.name] == pwd;
                    let isMod = thugConfig.staff.mods[playerEntity.name] == pwd;
                    let isDev = thugConfig.staff.devs[playerEntity.name] == pwd;
        
                    // Log the player login and send them a friendly message confirming it.
                    log(`${isAdmin ? `ADMIN`: isMod ? `MOD`: isDev ? `DEV`: `IMPERSONATOR`} ${(isAdmin || isMod || isDev ? `LOGGED IN`: `TRIED TO LOG IN`)}: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`)
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

                    log(`ADMIN SAY: ${msg} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return io.emit(`showAdminMessage`, msg);
                }
                else if(command == `recompense` && (isAdmin || isDev)) {
                    let amt = args[0];

                    if(!amt || isNaN(parseInt(amt))) return;
                    core.players.forEach(player => player.gold += parseInt(amt));

                    log(`ADMIN RECOMPENSED ${amt} GOLD | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return io.emit(`showAdminMessage`, `You have been recompensed for the server restart!`);
                }
                else if(command == `nick` && isAdmin) {
                    let nick = args[0];
                    if(!nick) {
                        playerEntity.name = nick;
                        return log(`ADMIN NICK: ${nick} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    }
                }
                else if(command == `whois` && isAdmin) {
                    let user = args[0];
                    let output = `That player does not exist.`;
                    if(user.startsWith(`seadog`)) {
                        let player = core.players.find(player => player.name == user);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                        log(`ADMIN WHOIS SEADOG: ${input} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        output = player.id;
                    }
                    else {
                        let player = core.boats.find(boat => boat.crewName == user);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                        log(`ADMIN WHOIS CAPTAIN: ${input} --> ${player.captainID} | PLAYER NAME: ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        output = player.captainID;
                    }
                    return playerEntity.socket.emit(`showCenterMessage`, output, 4, 1e4);
                }
                else if(command == `kick` && (isAdmin || isMod)) {
                    let kickUser = args.shift();
                    let kickReason = args.join(` `);

                    let player = core.players.find(player => player.name == kickUser);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                    if(!kickReason || kickReason == ``) kickReason == `No reason specified`;

                    player.socket.emit(`showCenterMessage`, `You have been kicked ${kickReason ? `. Reason: ${kickReason}`: ``}`, 1, 1e4);
                    playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);

                    log(`${isAdmin ? `ADMIN`: `MOD`} KICK: | Player name: ${playerEntity.name} | ${kickReason} | IP: ${player.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return player.socket.disconnect();
                }
                else if(command == `ban` && (isAdmin || isMod)) {
                    let banUser = args.shift();
                    let banReason = args.join(` `);

                    let player = core.players.find(player => player.name == kickUser);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                    if(!banReason || banReason == ``) banReason == `No reason specified`;

                    let ban = new Ban({
                        IP: player.socket.handshake.address,
                        comment: banReason
                    });

                    ban.save(err => err ? log(err): () => {
                        player.socket.disconnect();
                        playerEntity.socket.emit(`showCenterMessage`, `You permanently banned ${player.name}`, 3, 1e4);    
                    });

                    log(`Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    return Hook.warn(`Permanently Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id} | ${muteReason ? `Reason: ${muteReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                }
                else if(command == `tempban` && (isAdmin || isMod)) {
                    let tempbanUser = args.shift();
                    let tempbanReason = args.join(` `);

                    let player = core.players.find(player => player.name == tempbanUser);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                    if(!tempbanReason || tempbanReason == ``) tempbanReason == `No reason specified`;

                    let ban = new Ban({
                        IP: player.socket.handshake.address,
                        timestamp: new Date(),
                        comment: tempbanReason
                    });

                    ban.save(err => err ? log(err): () => {
                        player.socket.disconnect();
                        playerEntity.socket.emit(`showCenterMessage`, `You temporarily banned ${player.name}`, 3);
                    });

                    log(`Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    return Hook.warn(`Temporary Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id} | ${muteReason ? `Reason: ${muteReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                }
                else if(command == `save` && (isAdmin || isDev)) {
                    playerEntity.socket.emit(`showCenterMessage`, `Storing player data`, 3, 1e4);
                    core.players.forEach(async player => {
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
                            shipID: player.parent ? player.parent.shipClassID: null,

                            itemID: player.itemID ? player.itemID: null,
                            bonus: {
                                fireRate: player.attackSpeedBonus,
                                distance: player.attackDistanceBonus,
                                damage: player.attackDamageBonus,
                                speed: player.movementSpeedBonus
                            }
                        });
                        playerSaveData.save(err => err ? log(err): () => {
                            log(`Stored data for player ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            player.socket.disconnect();
                        });
                    });
                }
                else if(command == `report` && (isAdmin || isMod)) {
                    let reportUser = args.shift();
                    let reportReason = args.join(` `);

                    let player = core.players.find(player => player.name == reportUser);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                    if(reportIPs.includes(player.socket.handshake.address)) {
                        player.socket.emit(`showCenterMessage`, `You have been warned...`, 1);

                        log(`Reporter ${playerEntity.name} reported ${player.name} for the second time --> kick | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        Hook.warn(`Second Report --> Kick`, `${getTimestamp()} Reporter ${playerEntity.name} reported ${reportedPlayer} for the second time --> kick | ${reportReason ? `Reason: ${reportReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);

                        playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);
                        return player.socket.disconnect();
                    }
                    else {
                        reportIPs.push(player.socket.handshake.address);
                        player.socket.emit(`showCenterMessage`, `You have been reported. ${reportReason ? `Reason: ${reportReason} `: ``}Last warning!`, 1);
                        playerEntity.socket.emit(`showCenterMessage`, `You reported ${player.name}`, 3, 1e4);

                        log(`Reporter ${playerEntity.name} reported ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        return Hook.warn(`Second Report --> Kick`, `${getTimestamp()} Reporter ${playerEntity.name} reported ${reportedPlayer} | ${reportReason ? `Reason: ${reportReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    }
                }
                else if(command == `mute` && (isAdmin || isMod)) {
                    let mutePlayer = args.shift();
                    let muteReason = args.join(` `);

                    let player = core.players.find(player => player.name == mutePlayer);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                    mutePlayer(player);
                    player.socket.emit(`showCenterMessage`, `You have been muted! ${muteReason ? `Reason: ${muteReason}`: ``}`, 1);
                    playerEntity.socket.emit(`showCenterMessage`, `You muted ${player.name}`, 3);

                    log(`Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    return Hook.warn(`Muted Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id} | ${muteReason ? `Reason: ${muteReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                }
            }
        }
        if(!isSpamming(playerEntity, msgData.message)) {
            let msg = xssFiltersq.inHTMLData(msgData.message);
            msg = filter.clean(msg);

            if(msgData.recipient == `global`) {
                io.emit(`chat message`, {
                    playerID: playerEntity.id,
                    playerName: playerEntity.name,
                    recipient: `global`,
                    message: charLimit(msg, 150)
                });
            }
            else if(msgData.recipient == `local` && entities[playerEntity.parent.id]) {
                entities[playerEntity.parent.id].children.forEach(player => {
                    player.socket.emit(`chat message`, {
                        playerID: playerEntity.id,
                        playerName: playerEntity.name,
                        recipient: `local`,
                        message: charLimit(msg, 150)
                    });
                });
            }
            else if(msgData.recipient == `clan` && playerEntity.clan != `` && typeof playerEntity.clan != `undefined`) {
                let clan = playerEntity.clan;
                entities.forEach(entity => {
                    if(entity.netType == 0 && entity.clan == clan) {
                        entity.socket.emit(`chat message`, {
                            playerID: playerEntity.id,
                            playerName: playerEntity.name,
                            recipient: `clan`,
                            message: charLimit(msg, 150)
                        });
                    }
                });
            }
            else if(msgData.recipient == `staff` && (playerEntity.isAdmin || playerEntity.isMod || playerEntity.isDev)) {
                core.players.forEach(player => {
                    if(player.isAdmin || player.isMod || player.isDev) player.socket.emit(`chat message`, {
                        playerID: playerEntity.id,
                        playerName: playerEntity.name,
                        recipient: `staff`,
                        message: charLimit(msg, 150)
                    });
                });
            }
            else if(msgData.message.length > 1) socket.emit(`showCenterMessage`, `You have been muted`, 1);
        }
    });

    socket.emit(`playerNames`, playerNames, socketID);

    socket.on(`changeWeapon`, index => {
        index = xssFilters.inHTMLData(index);
        index = parseInt(index);
        if(playerEntity != undefined && (index == 0 || index == 1 || index == 2)) {
            playerEntity.activeWeapon = index;
            playerEntity.isFishing = false;
        }
    });

    // Fired when player disconnects from the game.
    socket.on(`disconnect`, data => {
        log(`Player: ${playerEntity.name} disconnected from the game | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
        if(!DEV_ENV) delete gameCookies[playerEntity.id];

        if(playerEntity.isLoggedIn == true && playerEntity.serverNumber == 1 && playerEntity.gold > playerEntity.highscore) {
            log(`Update highscore for player: ${playerEntity.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${playerEntity.gold} | IP: ${player.socket.handshake.address}`);
            playerEntity.highscore = playerEntity.gold;

            User.updateOne({ name: playerEntity.name }, { highscore: playerEntity.gold });
        }

        if(playerEntity.parent.netType == 1 && playerEntity.parent.shipState != 4 || playerEntity.parent.shipState != 3 && playerEntity.isCaptain && Object.keys(playerEntity.parent.children).length == 1 && playerEntity.parent.hp < playerEntity.parent.maxHP) {
            log(`Player ${playerEntity.name} tried to chicken out --> Ghost ship | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            // Make the ship a one-hitter and remove it from the game after fifteen seconds.
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
                    if(Object.keys(playerEntity.parent.children).length == 0) core.removeEntity(playerEntity.parent());
                }
            }
        }
    });

    socket.on(`updateKrewName`, name => {
        // Do not allow any form of brackets in the name.
        name = name.replace(/[\[\]{}()/\\]/g, ``);

        if(name != null && name.length > 1) {
            log(`Update krew name: ${name} | Player name: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            if(name.length > 60) {
                log(`Exploit detected (crew name length). Player ${playerEntity.name} kicked | Adding IP ${playerEntity.socket.handshake.address} to the ban list | Server ${playerEntity.serverNumber}.`);
                if(playerEntity.socket.handshake.address.length > 5) {
                    let ban = new Ban({
                        ip: socket.handshake.address,
                        comment: `Exploit: crew name length`
                    });
                    return ban.save(err => err ? log(err): playerEntity.socket.disconnect());
                }

                // Filter the ship name.
                name = xssFilters.inHTMLData(name);
                name = filter.clean(name);
                name = name.substring(0, 20);

                // Make sure that the player is the captain of the krew.
                let boat = playerEntity.parent;
                if(core.boats[boat.id] != undefined && playerEntity && playerEntity.parent && playerEntity.captainID == playerEntity.id) {
                    if(krewioData) krewioService.save(krewioData.user, { krewname: name }).then(data => krewioData = data);
                    core.boats[boat.id].crewName = name;
                }
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
    socket.on(`minCratesInSea`, amount => cratesInSea.min = amount);
    socket.on(`maxCratesInSea`, amount => cratesInSea.max = amount);

    socket.on(`departure`, departureCounter => {
        // Check if player who sends exitIslandc ommand is docked at island.
        if(playerEntity.parent.anchorIslandId == undefined) log(`Exploit detected (docking at sea). Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
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
                    boat.dockCountdown = undefined;

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
        if(playerEntity.isCaptain == true && lockBool == true) {
            playerEntity.parent.isLocked = true;
            playerEntity.parent.recruiting = false;
        }
        else if(playerEntity.isCaptain == true && lockBool == false) {
            playerEntity.parent.isLocked = false;
            if(playerEntity.parent.shipState == 2 || playerEntity.parent.shipState == 3 || playerEntity.parent.shipState == 4) playerEntity.parent.recruiting = true;
        }
    });

    socket.on(`clan`, async (action, player, callback) => {
        // Only logged in players can perform clan actions.
        if(!playerEntity.isLoggedIn) return log(`Exploit: Player ${playerEntity.name} tried clan action without login | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

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
                if(clan.leader == playerEntity.name && clanMembers.length == 1) clan.delete(err ? log(err): log(`CLAN DELETED | Leader ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`));
                else {
                    for(let i in core.players) {
                        let player = core.players[i];
                        if(player.clan == clan.name) player.socket.emit(`showCenterMessage`, `${playerEntity.name} has left your clan.`, 1, 5e3);
                    }
                }

                // Dereference the player's clan.
                playerEntity.clan = ``;
                user.clan = ``;

                user.save(err => err ? log(err): playerEntity.socket.emit(`showCenterMessage`, `You left clan [${clan.name}]`, 1, 5e3));
                log(`CLAN LEFT | Player ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                return callback(true);
            }

            // From this point on there should be a player passed to the emit.
            if(player && playerEntity.clanLeader || playerEntity.clanOwner || playerEntity.clanAssistant) {
                let otherUser = User.findOne({ name: player });
                let otherPlayer = core.players.find(entity => entity.name == player);

                // If the player is nonexistent or is not in the same clan.
                if(!otherUser) return log(`CLAN UPDATE ERROR | Player ${playerEntity.name} tried to update nonexistent player ${otherPlayer} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
                else if(action != `accept` && otherUser.clan != user.clan) return log(`CLAN UPDATE ERROR | Player ${playerEntity.name} tried to update player  ${otherPlayer} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);

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
                        clan.save(err => err ? log(err): callback(false));
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
        if(playerEntity.parent.hp >= 1) return log(`Player ${playerEntity.name} tried to respawn while his boat still has HP | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

        // Check for timestamp of last respawn and ban if it was less than 2 seconds ago.
        if(socket.timestamp != undefined && Date.now() - socket.timestamp < 2e3) {
            log(`Exploit detected: multiple respawn | Player: ${playerEntity.name} | Adding IP ${playerEntity.socket.handshake.address} to bannedIPs | Server: ${playerEntity.serverNumber}.`);
            if(playerEntity.socket.handshake.address.length > 5) {
                let ban = new Ban({
                    IP: socket.handshake.address,
                    comment: `Exploit: multiple respawn`
                });
                ban.save(err => err ? log(err): playerEntity.socket.disconnect());
            }
        }
        else {
            log(`Respawn by Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

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
            login.allocatePlayerToBoat(playerEntity, data.boatId);
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
        if(playerEntity.parent.shipState == 1 && playerEntity.parent.captainId == playerEntity.id) playerEntity.parent.dockCountdown = new Date();
    });

    // When ship docks completely (anchors) in the island.
    socket.on(`anchor`, () => {});
});

module.exports.io = io;
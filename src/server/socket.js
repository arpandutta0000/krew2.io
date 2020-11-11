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


// Log the time that the server started up.
let serverStartTimestamp = Date.now();
console.log(`UNIX Timestamp for server start: ${serverStartTimestamp}.`);

// Configure the socket.
const socketIO = require(`socket.io`);
if(global.io == undefined) {
    let server = process.env.NODE_ENV == `prod` ? https.createServer({
        key: fs.existsSync(config.ssl.key) ? fs.readFileSync(config.ssl.key): null,
        cert: fs.existsSync(config.ssl.cert) ? fs.readFileSync(config.ssl.cert): null,
        requestCert: false,
        rejectUnauthorized: false
    }): http.createServer();

    global.io = socketIO()(server, { origins: `*:*` });
    server.listen(proces.env.port);
}

// Utils.
const getTimestamp = require(`./utils/getTimestamp.js`);
const sha256 = require(`./utils/sha256.js`);
const md5 = require(`./utils/md5.js`);
const { isSpamming, mutePlayer } = require(`./utils/spam.js`);

// Alphanumeric string checker.
const isAlphanumeric = str => {
    let regex = /^[a-z0-9]+$/i
    return regex.test(str);
}

// Discord webhook.
const webhook = require(`webhook-discord`);
let Hook = new webhook.Webhook(process.env.WEBHOOK_URI);

console.log(`Socket.IO is running on port ${process.env.port}.`);

// Define serverside account perms.
const staff = {
    admins: [`devclied`, `LeoLeoLeo`, `DamienVesper`, `ITSDABOMB`, `harderman`],
    mods: [`Fiftyyyyyy`, `Sloth`, `Sj`, `TheChoco`],
    devs: [`Yaz_`]
}

// Socket connection between client and server.
io.on(`connection`, async socket => {
    let krewioData;

    // Get socket ID (player ID).
    let socketID = serializeId(socket.id);

    // Let the client know what that ID is and that we have succesfully established a connection.
    socket.emit(`handshake`, { socketID });

    // Define the player entity that stores all data for the player.
    let playerEntity;

    let initPlayerSocket = data => {
        // Player entity already exists, so don't create another one else it will duplicate itself.
        if(playerEntity) return;

        // Check if the player IP is in the ban list.
        let isIPBanned = await Ban.findOne({ IP: socket.handshake.address });
        if(isIPBanned) {
            console.log(`${getTimestamp()} Detected banned IP ${socket.handshake.address} attempting to connect. Disconnecting ${data.name}.`);
            socket.emit(`showCenterMessage`, `You have been banned... Contact us on Discord`, 1, 6e4);

            socket.banned = true;
            return socket.disconnect();
        }

        // Check to see if the player is using a VPN.
        axios.get(`http://check.getipintel.net/check.php?ip=${socket.handshake.address.substring(7)}&contact=dzony@gmx.de&flags=f&format=json`).then((err, res) => {
            if(err) return console.log(err);

            if(res.data && res.data.status == `success` && parseInt(res.data.result) == 1) {
                socket.emit(`showCenterMessage`, `Disable VPN to play this game`, 1, 6e4);
                console.log(`${getTimestamp()} VPN connection. Disconnecting IP: ${socket.handshake.address}.`);

                // Ban the IP.
                let ban = new Ban({
                    timestamp: new Date(new Date().toISOString()),
                    IP: socket.handshake.address,
                    comment: `Auto VPN temp ban`
                });
                return ban.save(err ? console.log(err): socket.disconnect());
            }
        });

        // Check if cookie has been blocked.
        if(data.cookie != undefined && data.cookie != ``) {
            if(Object.values(gameCookies).includes(data.cookie)) return console.log(`${getTimestamp()} Trying to spam multiple players... ${socket.handshake.address}.`);
            gameCookies[socketID] = data.cookie;
        }

        // Create player in the world.
        data.socketID = socketID;
        playerEntity = core.createPlayer(data);
        playerEntity.socket = socket;

        // Check if user is logged in, and if so, that they are coming from their last IP logged in with.
        if(data.lastIP && !(playerEntity.socket.handshake.address.includes(data.lastIP))) {
            console.log(`${getTimestamp()} Player ${playerEntity.name} tried to connect from different IP than login. Kick | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            return playerEntity.socket.disconnect();
        }

        // Identify the server that the player is playing on.
        playerEntity.serverNumber = playerEntity.socket.handshake.headers.host.substr(-4) == `2001` ? 1: 2;
        playerEntity.sellCounter = 0;

        if(playerEntity.socket.request.headers.user-agent && playerEntity.socket.handshake.address) console.log(`${getTimestamp()} Creation of new player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | UA: ${playerEntity.socket.request.headers.user-agent} | Origin: ${playerEntity.socket.request.headers.origin} | Server ${playerEntity.serverNumber}.`);

        // Log hackers if detected.
        if(data.hacker) {
            console.log(`${getTimestamp()} Exploit detected (modified client script / wrong emit). Player name: ${playerEntity.name} | IP: ${socket.handshake.address}.`);
            let hacker = new Hacker({
                name: playerEntity.name,
                IP: socket.handshake.address
            });
            hacker.save(err ? console.log(err): playerEntity.socket.disconnect());
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
        if(playerEntity.parent.shipState == 1 || playerEntity.parent.shipState == 0) console.log(`${getTimestamp()} Possible Exploit detected (buying from sea) ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
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
            console.log(`${getTimestamp()} Exploit detected (spam). Player: ${playerEntity.name} Adding IP ${playerEntity.socket.handshake.address} to banned IPs | Server ${playerEntity.serverNumber}.`);
            console.log(`Spam message: ${msgData.message}`);

            let ban = new Ban({
                timestamp: new Date(new Date().toISOString()),
                IP: playerEntity.socket.handshake.address,
                comment: `Auto chat spam temp ban`
            });
            ban.save(err ? console.log(err): playerEntity.socket.disconnect());
        }

        // Staff commands.
        if((msgData.message.startsWith(`//`) || msgData.message.startsWith(`!!`)) && playerEntity.isLoggedIn) {
            // If the player is not a staff member, disregard the command usage.
            if(!staff.admins.includes(playerEntity.name) && !staff.mods.includes(playerEntity.name) && !staff.devs.includes(playerEntity.name)) return;

            // Respective prefixes.
            if(msgData.message.startsWith(`!!`) && !staff.admins.includes(playerEntity.name) && !staff.devs.includes(playerEntity.name)) return;
            if(msgData.emssage.startsWith(`//`) && !staff.mods.includes(playerEntity.name)) return;

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
                    console.log(`${getTimestamp()} ${isAdmin ? `ADMIN`: isMod ? `MOD`: isDev ? `DEV`: `IMPERSONATOR`} ${(isAdmin || isMod || isDev ? `LOGGED IN`: `TRIED TO LOG IN`)}: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`)
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

                    console.log(`${getTimestamp()} ADMIN SAY: ${msg} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return io.emit(`showAdminMessage`, msg);
                }
                else if(command == `recompense` && (isAdmin || isDev)) {
                    let amt = args[0];

                    if(!amt || isNaN(parseInt(amt))) return;
                    core.players.forEach(player => player.gold += parseInt(amt));

                    console.log(`${getTimestamp()} ADMIN RECOMPENSED ${amt} GOLD | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return io.emit(`showAdminMessage`, `You have received gold recompense for server retart!`);
                }
                else if(command == `nick` && isAdmin) {
                    let nick = args[0];
                    if(!nick) {
                        playerEntity.name = nick;
                        return console.log(`${getTimestamp()} ADMIN SET NAME: ${nick} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    }
                }
                else if(command == `whois` && isAdmin) {
                    let user = args[0];
                    let output = `That player does not exist.`;
                    if(user.startsWith(`seadog`)) {
                        let player = core.players.find(player => player.name == user);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                        console.log(`${getTimestamp()} ADMIN WHOIS SEADOG: ${input} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        output = player.id;
                    }
                    else {
                        let player = core.boats.find(boat => boat.crewName == user);
                        if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                        console.log(`${getTimestamp()} ADMIN WHOIS CAPTAIN: ${input} --> ${player.captainID} | PLAYER NAME: ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        output = player.captainID;
                    }
                    return playerEntity.socket.emit(`showCenterMessage`, output, 4, 1e4);
                }
                else if(command == `kick` && (isAdmin || isMod)) {
                    let kickUser = args.shift();
                    let kickReason = args.join(` `);

                    let player = core.players.find(player => player.name == kickUser);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                    player.socket.emit(`showCenterMessage`, `You have been kicked ${kickReason ? `. Reason: ${kickReason}`: ``}`, 1, 1e4);
                    playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);

                    console.log(`${getTimestamp()} ${isAdmin ? `ADMIN`: `MOD`} KICK: | Player name: ${playerEntity.name} | ${kickReason} | IP: ${player.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return player.socket.disconnect();
                }
                else if(command == `ban` && (isAdmin || isMod)) {
                    let banUser = args.shift();
                    let banReason = args.join(` `);

                    let player = core.players.find(player => player.name == kickUser);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);


                    let ban = new Ban({
                        IP: player.socket.handshake.address,
                        comment: banReason ? banReason: `banned by admin / mod`
                    });
                    ban.save(err ? console.log(err): () => {
                        player.socket.disconnect();
                        playerEntity.socket.emit(`showCenterMessage`, `You permanently banned ${player.name}`, 3, 1e4);    
                    });

                    console.log(`${getTimestamp()} Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    return Hook.warn(`Permanently Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id} | ${muteReason ? `Reason: ${muteReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                }
                else if(command == `tempban` && (isAdmin || isMod)) {
                    let tempbanUser = args.shift();
                    let tempbanReason = args.join(` `);

                    let player = core.players.find(player => player.name == tempbanUser);
                    if(!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                    let ban = new Ban({
                        IP: player.socket.handshake.address,
                        timestamp: new Date(),
                        comment: tempbanReason ? tempbanReason: `tempbanned by admin / mod`
                    });

                    ban.save(err ? console.log(err): () => {
                        player.socket.disconnect();
                        playerEntity.socket.emit(`showCenterMessage`, `You temporarily banned ${player.name}`, 3);
                    });

                    console.log(`${getTimestamp()} Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    return Hook.warn(`Temporary Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id} | ${muteReason ? `Reason: ${muteReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                }
                else if(command == `save` && (isAdmin || isDev)) {
                    playerEntity.socket.emit(`showCenterMessage`, `Storing player data`, 3, 1e4);
                    core.players.forEach(player => {
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
                        playerSaveData.save(err ? console.log(err): () => {
                            console.log(`Stored data for player ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
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

                        console.log(`${getTimestamp()} Reporter ${playerEntity.name} reported ${player.name} for the second time --> kick | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        Hook.warn(`Second Report --> Kick`, `${getTimestamp()} Reporter ${playerEntity.name} reported ${reportedPlayer} for the second time --> kick | ${reportReason ? `Reason: ${reportReason} | `: ``}IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);

                        playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);
                        return player.socket.disconnect();
                    }
                    else {
                        reportIPs.push(player.socket.handshake.address);
                        player.socket.emit(`showCenterMessage`, `You have been reported. ${reportReason ? `Reason: ${reportReason} `: ``}Last warning!`, 1);
                        playerEntity.socket.emit(`showCenterMessage`, `You reported ${player.name}`, 3, 1e4);

                        console.log(`${getTimestamp()} Reporter ${playerEntity.name} reported ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
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

                    console.log(`${getTimestamp()} Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
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
        console.log(`${getTimestamp()} Player: ${playerEntity.name} disconnected from the game | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
        if(!DEV_ENV) delete gameCookies[playerEntity.id];

        if(playerEntity.isLoggedIn == true && playerEntity.serverNumber == 1 && playerEntity.gold > playerEntity.highscore) {
            console.log(`${getTimestamp()} Update highscore for player: ${playerEntity.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${playerEntity.gold} | IP: ${player.socket.handshake.address}`);
            playerEntity.highscore = playerEntity.gold;

            User.updateOne({ name: playerEntity.name }, { highscore: playerEntity.gold });
        }

        if(playerEntity.parent.netType == 1 && playerEntity.parent.shipState != 4 || playerEntity.parent.shipState != 3 && playerEntity.isCaptain && Object.keys(playerEntity.parent.children).length == 1 && playerEntity.parent.hp < playerEntity.parent.maxHP) {
            console.log(`${getTimestamp()} Player ${playerEntity.name} tried to chicken out --> Ghost ship | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

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
            console.log(`${getTimestamp()} Update krew name: ${name} | Player name: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            if(name.length > 60) {
                console.log(`${getTimestamp()} Exploit detected (crew name). Player ${playerEntity.name} kicked | Adding IP ${playerEntity.socket.handshake.address} to the ban list | Server ${playerEntity.serverNumber}.`);
                if(playerEntity.socket.handshake.address.length > 5) {
                    let ban = new Ban({ ip: socket.handshake.address });
                    return ban.save(err ? console.log(err): playerEntity.socket.disconnect());
                }

                // Filter the ship name.
                name = xssFilters.inHTMLData(name);
                name = filter.clean(name);
                name = name.substring(0, 20);

                // Make sure that the player is the captain of the krew.
                let boat = playerENtity.parent;
                if(core.boats[boat.id] != undefined && playerEntity && playerEntity.parent && playerEntity.captainID == playerEntity.id) {
                    if(krewioData) krewioService.save(krewioData.user, { krewname: name }).then(data => krewioData = data);
                    core.boats[boat.id].crewName = name;
                }
            }
        }
    });
});
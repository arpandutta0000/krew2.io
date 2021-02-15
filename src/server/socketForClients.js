/* Import Modules */
const axios = require(`axios`);
const bus = require(`./utils/messageBus.js`);
const config = require(`./config/config.js`);
const Filter = require(`bad-words`);
const filter = new Filter();
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);
const log = require(`./utils/log.js`);
const login = require(`./auth/login.js`);
lzString = require(`../client/assets/js/lz-string.min`);
const md5 = require(`./utils/md5.js`);
const mongoose = require(`mongoose`);
const thugConfig = require(`./config/thugConfig.js`);
const xssFilters = require(`xss-filters`);
const dotenv = require(`dotenv`).config();

const { exec } = require(`child_process`);

let worldsize = 2500;

global.maxAmountCratesInSea = config.maxAmountCratesInSea;
global.minAmountCratesInSea = config.minAmountCratesInSea;

let reportIPs = [];
let serverRestart = false;
let currentTime = (new Date().getUTCMinutes() > 35 && new Date().getUTCMinutes() < 55) ? `night` : `day`;

// Bots in testing environment.
const createBots = require(`./bots.js`);
if (config.mode === `dev` && process.env.TESTING_ENV) createBots();

// Log when server starts.
let serverStartTimestamp = Date.now();
log(`green`, `UNIX Timestamp for server start: ${serverStartTimestamp}.`);

// Additional bad words that need to be filtered.
filter.addWords(...config.additionalBadWords);

// Configure socket.
if (!global.io) {
    let server = process.env.NODE_ENV === `prod`
        ? https.createServer({
            key: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/privkey.pem`),
            cert: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/fullchain.pem`),
            requestCert: false,
            rejectUnauthorized: false
        })
        : http.createServer();

    global.io = require(`socket.io`)(server, {
        cors: {
            origin: DEV_ENV ? `http://localhost:8080` : `https://${config.domain}`,
            methods: [`GET`, `POST`],
            credentials: true
        },
        maxHttpBufferSize: 1e9,
        pingTimeout: 1e4
    });
    server.listen(process.env.port);
}

// Connect to db
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => log(`green`, `Socket.IO server has connected to database.`));

// Mongoose Models
let User = require(`./models/user.model.js`);
let Clan = require(`./models/clan.model.js`);
let Ban = require(`./models/ban.model.js`);
let Mute = require(`./models/mute.model.js`);
let Hacker = require(`./models/hacker.model.js`);
let PlayerRestore = require(`./models/playerRestore.model.js`);

// Log socket.io starting.
log(`green`, `Socket.IO is listening on port to socket port ${process.env.port}`);

// Globally define serverside admins / mods / devs.
Admins = config.admins;
Mods = config.mods;
Devs = config.devs;

const gameCookies = {};

setInterval(() => {
    if (currentTime === `day`) currentTime = `night`;
    else currentTime = `day`;

    io.emit(`cycle`, currentTime);
}, 12e5);

// Delete all mutes on server start.
Mute.deleteMany(() => log(`cyan`, `Deleted all mutes.`));

// Socket connection handling on server.
io.on(`connection`, async socket => {
    let krewioData;
    // let christmasGold = 0;

    // Get socket ID (player ID).
    let socketId = serializeId(socket.id);

    // Let the client know the socket ID and that we have succesfully established a connection.
    socket.emit(`handshake`, {
        socketId
    });

    // Define the player entity that stores all data for the player.
    let playerEntity;

    let initSocketForPlayer = async data => {
        // If the player entity already exists, ignore reconnect.
        if (!process.env.TESTING_ENV && (playerEntity || socket.request.headers.origin === undefined || socket.request.headers[`user-agent`] === `node-XMLHttpRequest`)) {
            log(`cyan`, `Exploit detected: Faulty connection. Disconnecting IP ${socket.handshake.address}.`);

            let ban = new Ban({
                username: data.name,
                IP: socket.handshake.address,
                timestamp: new Date(),
                comment: `Auto exploit temp ban`
            });
            ban.save();
            return socket.disconnect();
        }

        if (!data.name) data.name = ``;
        else data.name = filter.clean(xssFilters.inHTMLData(data.name));

        // Check if the player IP is in the ban list.
        let isIPBanned = await Ban.findOne({
            IP: socket.handshake.address
        });
        let isAccountBanned = await Ban.findOne({
            username: data.name
        });

        if (isIPBanned || isAccountBanned) {
            if (isIPBanned && new Date() - new Date(isIPBanned.timestamp) > 36e5) isIPBanned.delete();
            else if (isAccountBanned && new Date() - new Date(isAccountBanned.timestamp) > 36e5) isAccountBanned.delete();
            else {
                log(`cyan`, `Detected banned IP ${socket.handshake.address} attempting to connect. Disconnecting ${data.name ? data.name : `seadog`}.`);
                socket.emit(`showCenterMessage`, `You have been banned... Contact us on Discord`, 1, 6e4);

                socket.banned = true;
                return socket.disconnect();
            }
        }
        // Check to see if the player is using a VPN.
        // Note: This has to be disabled if proxying through cloudflare! Cloudflare proxies are blacklisted and will not return the actual ip.

        // VPNs are all IPv4.
        if (config.mode === `prod`) {
            axios.get(`https://check.getipintel.net/check.php?ip=${socket.handshake.address.substring(7)}&contact=dzony@gmx.de&flags=f&format=json`).then(res => {
                if (!res) return log(`red`, `There was an error checking while performing the VPN check request.`);

                if (res.data) {
                    let result = parseInt(res.data.result);
                    if (result === 1) {
                        // Ban the IP.
                        let ban = new Ban({
                            username: data.name,
                            IP: socket.handshake.address,
                            timestamp: new Date(),
                            comment: `Auto VPN temp ban`
                        });
                        return ban.save(() => {
                            socket.emit(`showCenterMessage`, `Disable VPN to play this game`, 1, 6e4);
                            log(`cyan`, `VPN connection. Banning IP: ${socket.handshake.address}.`);

                            socket.disconnect();
                        });
                    } else if (result === -2) log(`yellow`, `IPv6 detected. Allowing user to pass VPN detection | IP: ${socket.handshake.address}`);
                    else log(`magenta`, `VPN connection not detected. Allowing IP: ${socket.handshake.address}.`);
                }
            }).catch(() => log(`red`, `VPN Checking Ratelimited | IP: ${socket.handshake.address}.`));
        }

        // Check if max player count has been reached.
        if (Object.keys(core.players).length > config.maxPlayerCount) {
            socket.emit(`showCenterMessage`, `This server is full!`, 1, 6e4);
            return socket.disconnect();
        }

        if (serverRestart) {
            socket.emit(`showCenterMessage`, `Server is restarting.`, 1, 6e4);
            return socket.disconnect();
        }

        if (!DEV_ENV) {
            // Check if cookie has been blocked.
            if (data.cookie !== undefined && data.cookie !== ``) {
                if (Object.values(gameCookies).includes(data.cookie)) return log(`cyan`, `Trying to spam multiple players... ${socket.handshake.address}.`);
                gameCookies[socketId] = data.cookie;
            }
        }

        // No same account usage.
        for (let i in core.players) {
            let player = core.players[i];
            if (player.name === data.name) {
                socket.emit(`showCenterMessage`, `Your account has already connected to the game!`, 1, 6e4);
                log(`cyan`, `${player.name} tried to connect with multiple accounts. Disconnecting IP: ${socket.handshake.address}.`);

                // Disconnect the player.
                return socket.disconnect();
            }
        }

        // Create player in the world.
        data.socketId = socketId;
        playerEntity = core.createPlayer(data);
        playerEntity.socket = socket;

        User.findOne({
            username: playerEntity.name
        }).then(user => {
            if (user) {
                playerEntity.bank.deposit = user.bankDeposit ? user.bankDeposit : 0;
                playerEntity.highscore = user.highscore ? user.highscore : 0;
                playerEntity.clan = user.clan ? user.clan : undefined;
                playerEntity.clanRequest = user.clanRequest ? user.clanRequest : undefined;

                if (playerEntity.clan) {
                    Clan.findOne({
                        name: playerEntity.clan
                    }).then(clan => {
                        if (clan) {
                            if (clan.name.length > 4) {
                                clan.delete();
                                user.clan = undefined;
                                playerEntity.clan = undefined;
                                user.save();
                            }
                            playerEntity.clanOwner = clan.owner === playerEntity.name;
                            playerEntity.clanLeader = clan.leaders.includes(playerEntity.name);
                        } else {
                            log(`red`, `Player ${playerEntity.name} tried to get nonexistent clan ${playerEntity.clan}.`);
                            user.clan = undefined;
                            playerEntity.clan = undefined;
                            user.save();
                        }
                    });
                }

                // Check if user is logged in, and if so, that they are coming from their last IP logged in with.
                // if (user.lastIP && !(playerEntity.socket.handshake.address === user.lastIP)) {
                //     log(`cyan`, `Player ${playerEntity.name} tried to connect from a different IP than what they logged in with. Kick | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                //     return playerEntity.socket.disconnect();
                // }
            }
        });

        // Identify the server that the player is playing on.
        playerEntity.serverNumber = config.gamePorts.indexOf(parseInt(playerEntity.socket.handshake.headers.host.substr(-4))) + 1;
        playerEntity.sellCounter = 0;

        if (playerEntity.socket.request.headers[`user-agent`] && playerEntity.socket.handshake.address) log(`magenta`, `Creation of new player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | UA: ${playerEntity.socket.request.headers[`user-agent`]} | Origin: ${playerEntity.socket.request.headers.origin} | Server ${playerEntity.serverNumber}.`);

        // Log hackers if detected.
        if (data.hacker) {
            log(`cyan`, `Exploit detected (modified client script / wrong emit). Player name: ${playerEntity.name} | IP: ${socket.handshake.address}.`);
            let hacker = new Hacker({
                name: playerEntity.name,
                IP: socket.handshake.address
            });
            hacker.save(() => playerEntity.socket.disconnect());
            return;
        }

        // Only start the restore process if the server start was less than 5 minutes ago.
        if (Date.now() - serverStartTimestamp < 3e5) {
            let playerSave = await PlayerRestore.findOne({
                IP: socket.handshake.address
            });
            if (playerSave && new Date() - playerSave.timestamp < 3e5) {
                // If username is seadog, set the name to proper seadog.
                playerEntity.name = playerSave.username;

                // Restore gold and xp.
                playerEntity.gold = playerSave.gold;
                playerEntity.experience = playerSave.experience;
                playerEntity.points = playerSave.points;

                // Restore leaderboard stats.
                playerEntity.score = playerSave.score;
                playerEntity.shipsSank = playerSave.shipsSank;

                // Refund ship if captain.
                if (playerSave.isCaptain) {
                    playerEntity.gold += core.boatTypes[playerSave.shipId].price;
                    playerEntity.socket.emit(`showCenterMessage`, `You have been recompensed for your ship!`, 3);
                }

                // Restore item & item stats.
                if (playerSave.itemId) {
                    playerEntity.socket.emit(`showCenterMessage`, `You have been equipped with your previous item!`, 3);
                    playerEntity.itemId = playerSave.itemId;

                    playerEntity.attackSpeedBonus = playerSave.bonus.fireRate;
                    playerEntity.attackDistanceBonus = playerSave.bonus.distance;
                    playerEntity.attackDamageBonus = playerSave.bonus.damage;
                    playerEntity.movementSpeedBonus = playerSave.bonus.speed;
                }

                // Restore achievements.
                playerEntity.overall_cargo = playerSave.overallCargo;
                playerEntity.other_quest_level = playerSave.otherQuestLevel;

                // Delete the save information afterwards so that the player cannot exploit with multiple tabs.
                log(`blue`, `Restored data for ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                playerSave.delete();
            }
        }

        // Allocate player to the game.
        login.allocatePlayerToBoat(playerEntity, data.boatId, data.spawn);

        // Get snapshot.
        socket.on(`u`, data => playerEntity.parseSnap(data));

        // Ping event
        socket.on(`ping`, () => {
            socket.emit(`pong`);
        });

        let checkPlayerStatus = () => {
            if (playerEntity.parent.shipState === 1 || playerEntity.parent.shipState === 0) log(`cyan`, `Possible Exploit detected (buying from sea) ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
        };

        // Emit the time to the player.
        if (currentTime === `night`) playerEntity.socket.emit(`cycle`, currentTime);

        // Gather all stats and return them to the client.
        socket.on(`get-stats`, fn => {
            let stats = {
                shipsSank: playerEntity.shipsSank,
                shotsFired: playerEntity.shotsFired,
                shotsHit: playerEntity.shotsHit,
                shotAccuracy: playerEntity.shotsHit / playerEntity.shotsFired,
                overall_cargo: playerEntity.overall_cargo,
                crew_overall_cargo: playerEntity.parent ? playerEntity.parent.overall_cargo : undefined,
                overall_kills: playerEntity.parent ? playerEntity.parent.overall_kills : undefined
            };
            return fn(JSON.stringify(stats));
        });

        // Chat message handling.
        socket.on(`chat message`, async msgData => {
            // Catch client modifications.
            if (!msgData.message || !msgData.recipient || typeof msgData.message !== `string` || typeof msgData.recipient !== `string`) return;
            if (msgData.message.length < 1) return;

            if (!playerEntity.isMuted) {
                playerEntity.isMuted = false;
                clearInterval(playerEntity.muteTimeout);
            }

            // Check for spam.
            if (msgData.message.length > 65 && !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
                log(`cyan`, `Exploit detected (spam). Player: ${playerEntity.name} Adding IP ${playerEntity.socket.handshake.address} to banned IPs | Server ${playerEntity.serverNumber}.`);
                log(`cyan`, `Spam message: ${msgData.message}`);

                let ban = new Ban({
                    username: playerEntity.name,
                    timestamp: new Date(),
                    IP: playerEntity.socket.handshake.address,
                    comment: `Auto chat spam temp ban`
                });
                ban.save(() => playerEntity.socket.disconnect());
            }

            // Staff commands.
            const user = await User.findOne({ username: playerEntity.name });
            if (user &&(msgData.message.startsWith(`//`) || msgData.message.startsWith(`!!`))) {
                // If the player is not a staff member, disregard the command usage.
                if (!Admins.includes(playerEntity.name) && !Mods.includes(playerEntity.name) && !Devs.includes(playerEntity.name) &&
                    !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) return;

                // Respective prefixes.
                if (msgData.message.startsWith(`!!`) && !Admins.includes(playerEntity.name) && !Devs.includes(playerEntity.name) &&
                    !playerEntity.isAdmin && !playerEntity.isDev) return;
                if (msgData.message.startsWith(`//`) && !Mods.includes(playerEntity.name) && !playerEntity.isMod) return;

                // Parse the message for arguments and set the command.
                let args = msgData.message.toString().slice(2).split(` `);
                let command = args.shift().toLowerCase();

                // If the user has not authenticated, only give them access to login command.
                if (!playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
                    if (command === `login`) {
                        // let staffPassword = args.shift();

                        // if (!staffPassword) return playerEntity.socket.emit(`showCenterMessage`, `You did not enter your password!`, 1, 1e4);
                        // staffPassword = md5(staffPassword);

                        // let isAdmin = thugConfig.Admins[playerEntity.name] === staffPassword;
                        // let isMod = thugConfig.Mods[playerEntity.name] === staffPassword;
                        // let isDev = thugConfig.Devs[playerEntity.name] === staffPassword;

                        let isAdmin = Admins.includes(playerEntity.name);
                        let isMod = Mods.includes(playerEntity.name);
                        let isDev = Devs.includes(playerEntity.name);

                        // Log the player login and send them a friendly message confirming it.
                        if (isAdmin || isMod || isDev) {
                            log(!isAdmin && !isMod && !isDev ? `cyan` : `blue`, `${isAdmin ? `Admin` : isMod ? `Mod` : `Dev`} ${(isAdmin || isMod || isDev ? `logged in` : `tried to log in`)}: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                            playerEntity.socket.emit(`showCenterMessage`, `Logged in succesfully`, 3, 1e4);

                            // Authenticate the player object as privileged user.
                            isAdmin ? playerEntity.isAdmin = true : isMod ? playerEntity.isMod = true : isDev ? playerEntity.isDev = true : null;
                        } else return playerEntity.socket.emit(`showCenterMessage`, `Invalid password.`);
                    }
                } else {
                    log(`blue`, `Player ${playerEntity.name} ran command ${command} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                    let isAdmin = playerEntity.isAdmin;
                    let isMod = playerEntity.isMod;
                    let isDev = playerEntity.isDev;

                    // Staff commands after authentication.
                    if (command === `say` && isAdmin) {
                        let msg = args.join(` `);
                        if (!msg) return;

                        log(`blue`, `${isAdmin ? `ADMIN` : `MOD`} SAY: ${msg} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return io.emit(`showAdminMessage`, xssFilters.inHTMLData(msg));
                    } else if (command === `recompense` && (isAdmin || isDev)) {
                        let amt = args[0];

                        if (!amt || isNaN(parseInt(amt))) return;
                        for (let i in core.players) {
                            core.players[i].gold += parseInt(amt);
                        }
                        for (let i in core.players) {
                            let curPlayer = core.players[i];
                            if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} gave ${amt} gold to all players.`, 4, 1e4);
                        }

                        log(`blue`, `ADMIN RECOMPENSED ${amt} GOLD | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return io.emit(`showAdminMessage`, `You have been recompensed for the server restart!`);
                    } else if (command === `nick` && isAdmin) {
                        let nick = args[0];
                        if (nick) {
                            playerEntity.name = nick;
                            return log(`blue`, `ADMIN NICK: ${nick} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        }
                    } else if (command === `whois` && isAdmin) {
                        let user = args[0];
                        let output = `That player does not exist.`;
                        if (user.startsWith(`seadog`)) {
                            let player = Object.values(core.players).find(player => player.name === user);
                            if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);

                            log(`blue`, `ADMIN WHOIS SEADOG: ${input} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            output = player.id;
                        } else {
                            let player = Object.values(core.boats).find(boat => boat.crewName === user);
                            if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);

                            log(`blue`, `ADMIN WHOIS CAPTAIN: ${input} --> ${player.captainId} | PLAYER NAME: ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            output = player.captainId;
                        }
                        return playerEntity.socket.emit(`showCenterMessage`, output, 4, 1e4);
                    } else if (command === `kick` && (isAdmin || isMod)) {
                        let kickUser = args.shift();
                        let kickReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name === kickUser);
                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
                        else if (player.isAdmin || player.isMod || player.isDev) return playerEntity.socket.emit(`showCenterMessage`, `That player is a staff member!`, 1, 1e4);
                        if (!kickReason || kickReason === ``) kickReason === `No reason specified`;

                        player.socket.emit(`showCenterMessage`, `You have been kicked ${kickReason ? `. Reason: ${kickReason}` : `.`}`, 1, 1e4);
                        playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);

                        for (let i in core.players) {
                            let curPlayer = core.players[i];
                            if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} kicked ${player.name}.`, 4, 1e4);
                        }

                        log(`blue`, `${isAdmin ? `ADMIN` : `MOD`} KICK: | Player name: ${playerEntity.name} | ${kickReason} | IP: ${player.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        bus.emit(`report`, `Kick Player`, `Admin / Mod ${playerEntity.name} kicked ${player.name} --> ${player.id}\n${kickReason ? `Reason: ${kickReason}\n` : ``}\nServer ${player.serverNumber}.`);
                        return player.socket.disconnect();
                    } else if (command === `ban` && (isAdmin || isMod)) {
                        let banUser = args.shift();
                        let banReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name === banUser);
                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
                        else if (player.isAdmin || player.isMod || player.isDev) return playerEntity.socket.emit(`showCenterMessage`, `That player is a staff member!`, 1, 1e4);
                        if (!banReason || banReason === ``) banReason === `No reason specified`;

                        let isBanned = await Ban.findOne({
                            username: player.name
                        });
                        if (isBanned) return playerEntity.socket.emit(`showCenterMessage`, `That player is already banned!`, 1, 1e4);

                        let ban = new Ban({
                            username: player.name,
                            IP: player.socket.handshake.address,
                            comment: banReason
                        });

                        ban.save(() => {
                            player.socket.emit(`showCenterMessage`, `You have been banned!`, 1, 6e4);
                            player.socket.disconnect();
                            playerEntity.socket.emit(`showCenterMessage`, `You permanently banned ${player.name}`, 3, 1e4);

                            for (let i in core.players) {
                                let curPlayer = core.players[i];
                                if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} banned ${player.name}.`, 4, 1e4);
                            }
                        });

                        log(`blue`, `Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        return bus.emit(`report`, `Permanently Ban Player`, `Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id}\n${banReason ? `Reason: ${banReason}\n` : ``}\nServer ${player.serverNumber}.`);
                    } else if (command === `tempban` && (isAdmin || isMod)) {
                        let tempbanUser = args.shift();
                        let tempbanReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name === tempbanUser);
                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
                        else if (player.isAdmin || player.isMod || player.isDev) return playerEntity.socket.emit(`showCenterMessage`, `That player is a staff member!`, 1, 1e4);
                        if (!tempbanReason || tempbanReason === ``) tempbanReason === `No reason specified`;

                        let ban = new Ban({
                            username: player.name,
                            IP: player.socket.handshake.address,
                            timestamp: new Date(),
                            comment: tempbanReason
                        });

                        ban.save(() => {
                            player.socket.emit(`showCenterMessage`, `You have been temporarily banned.`, 1, 6e4);
                            player.socket.disconnect();
                            playerEntity.socket.emit(`showCenterMessage`, `You temporarily banned ${player.name}.`, 3, 1e4);
                            for (let i in core.players) {
                                let curPlayer = core.players[i];
                                if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} temporarily banned ${player.name}.`, 4, 1e4);
                            }
                        });

                        log(`blue`, `Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        return bus.emit(`report`, `Temporary Ban Player`, `Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id}\n${tempbanReason ? `Reason: ${tempbanReason}\n` : ``}\n Server ${player.serverNumber}.`);
                    } else if (command === `unban` && (isAdmin || isMod)) {
                        let unbanUser = args.shift();

                        let player = await Ban.findOne({
                            username: unbanUser
                        });

                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player is not banned!`, 3, 1e4);

                        player.delete(() => {
                            playerEntity.socket.emit(`showCenterMessage`, `You unbanned ${unbanUser}.`, 3, 1e4);

                            for (let i in core.players) {
                                let curPlayer = core.players[i];
                                if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} unbanned ${player.username}.`, 4, 1e4);
                            }

                            log(`blue`, `Admin / Mod ${playerEntity.name} unbanned ${player.username} | IP: ${player.IP}.`);
                            return bus.emit(`report`, `Unban Player`, `Admin / Mod ${playerEntity.name} unbanned ${player.username}.`);
                        });
                    } else if ((command === `reload` || command === `update`) && (isAdmin || isDev) && !serverRestart) {
                        serverRestart = true;
                        playerEntity.socket.emit(`showCenterMessage`, `Started server restart process.`, 3, 1e4);

                        for (let i in core.players) {
                            let curPlayer = core.players[i];
                            if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} started a server restart.`, 4, 1e4);
                        }

                        io.emit(`showCenterMessage`, `Server is restarting in 1 minute!`, 4, 1e4);
                        setTimeout(() => io.emit(`showCenterMessage`, `Server is restarting in 30 seconds!`, 4, 1e4), 3e4);
                        setTimeout(() => io.emit(`showCenterMessage`, `Server is restarting in 10 seconds!`, 4, 1e4), 5e4);

                        setTimeout(() => {
                            for (let i in core.players) {
                                let player = core.players[i];

                                // Delete existing outstanding data if any.
                                PlayerRestore.findOne({
                                    IP: player.socket.handshake.address
                                }).then(oldPlayerData => {
                                    PlayerRestore.findOne({
                                        username: player.name
                                    }).then(oldAccountData => {
                                        User.findOne({
                                            username: player.name
                                        }).then(user => {
                                            if (oldPlayerData) oldPlayerData.delete();
                                            if (oldAccountData) oldAccountData.delete();

                                            let playerSaveData = new PlayerRestore({
                                                username: player.name,
                                                IP: player.socket.handshake.address,
                                                timestamp: new Date(),

                                                gold: player.gold,
                                                experience: player.experience,
                                                points: player.points,

                                                score: player.score,
                                                shipsSank: player.shipsSank,
                                                deaths: player.deaths ? player.deaths : 0,
                                                overall_kills: player.overall_kills ? player.overall_kills : 0,

                                                isCaptain: player.isCaptain,
                                                shipId: player.parent ? player.parent.captainId === player.id ? player.parent.shipclassId : undefined : undefined,

                                                itemId: player.itemId ? player.itemId : undefined,
                                                bonus: {
                                                    fireRate: player.attackSpeedBonus,
                                                    distance: player.attackDistanceBonus,
                                                    damage: player.attackDamageBonus,
                                                    speed: player.movementSpeedBonus
                                                },

                                                overallCargo: player.overall_cargo,
                                                otherQuestLevel: parseInt(player.other_quest_level ? player.other_quest_level : 0)
                                            });

                                            if (user) {
                                                if (player.serverNumber === 1 && player.gold > player.highscore) {
                                                    log(`magenta`, `Updated highscore for player: ${player.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${parseInt(player.gold)} | IP: ${player.socket.handshake.address}.`);
                                                    player.highscore = parseInt(player.gold);

                                                    user.highscore = player.highscore;
                                                    user.save();
                                                }
                                            }

                                            playerSaveData.save(() => {
                                                log(`blue`, `Stored data for player ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                                                player.socket.emit(`showCenterMessage`, `Server is restarting. Please refresh your page to rejoin the game.`, 4, 6e4);
                                                player.socket.disconnect();
                                                core.removeEntity(player);
                                            });
                                        });
                                    });
                                });
                            }
                            if (!DEV_ENV) {
                                exec(`sh /opt/krew2.io/src/server/scripts/${command}.sh`, (err, stdout, stderr) => {
                                    if (err) log(`red`, err);
                                });
                            } else {
                                log(`red`, `Warning, cannot automatically restart in development.`);
                                serverRestart = false;
                            }
                        }, 6e4);
                    } else if (command === `report` && (isAdmin || isMod)) {
                        let reportUser = args.shift();
                        let reportReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name === reportUser);
                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);

                        if (reportIPs.includes(player.socket.handshake.address)) {
                            player.socket.emit(`showCenterMessage`, `You were warned...`, 1);

                            log(`blue`, `Reporter ${playerEntity.name} reported ${player.name} for the second time --> kick | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            bus.emit(`report`, `Second Report --> Kick`, `Reporter ${playerEntity.name} reported ${reportedPlayer} for the second time --> kick\n${reportReason ? `Reason: ${reportReason} | ` : ``}\nServer ${player.serverNumber}.`);

                            for (let i in core.players) {
                                let curPlayer = core.players[i];
                                if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} reported ${player.name}.`, 4, 1e4);
                            }

                            playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);
                            return player.socket.disconnect();
                        } else {
                            reportIPs.push(player.socket.handshake.address);
                            player.socket.emit(`showCenterMessage`, `You have been reported. ${reportReason ? `Reason: ${reportReason} ` : ``}Last warning!`, 1);
                            playerEntity.socket.emit(`showCenterMessage`, `You reported ${player.name}`, 3, 1e4);

                            for (let i in core.players) {
                                let curPlayer = core.players[i];
                                if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} reported ${player.name} for the second time.`, 4, 1e4);
                            }

                            log(`blue`, `Reporter ${playerEntity.name} reported ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                            return bus.emit(`report`, `Second Report --> Kick`, `Reporter ${playerEntity.name} reported ${reportedPlayer}\n${reportReason ? `Reason: ${reportReason}\n` : ``}\nServer ${player.serverNumber}.`);
                        }
                    } else if (command === `mute` && (isAdmin || isMod)) {
                        let playerToMute = args.shift();
                        let muteReason = args.join(` `);

                        let player = Object.values(core.players).find(player => player.name === playerToMute);
                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
                        else if (player.isAdmin || player.isMod || player.isDev) return playerEntity.socket.emit(`showCenterMessage`, `That player is a staff member!`, 1, 1e4);

                        mutePlayer(player, muteReason || `No reason specified`);

                        player.socket.emit(`showCenterMessage`, `You have been muted! ${muteReason ? `Reason: ${muteReason}` : ``}`, 1);
                        playerEntity.socket.emit(`showCenterMessage`, `You muted ${player.name}`, 3);

                        for (let i in core.players) {
                            let curPlayer = core.players[i];
                            if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} muted ${player.name}.`, 4, 1e4);
                        }

                        log(`blue`, `Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        return bus.emit(`report`, `Muted Player`, `Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n` : ``}\nServer ${player.serverNumber}.`);
                    } else if (command === `online` && isAdmin) {
                        let playerToCheck = args.shift();

                        let player = Object.values(core.players).find(player => player.name === playerToCheck);
                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player is not online!`, 1, 1e4);
                        else return playerEntity.socket.emit(`showCenterMessage`, `That player is currently online!`, 3, 1e4);
                    } else if (command === `unmute` && (isAdmin || isMod)) {
                        let unmuteUser = args.shift();

                        let player = Object.values(core.players).find(player => player.name === unmuteUser);

                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
                        else if (!player.isMuted) return playerEntity.socket.emit(`showCenterMessage`, `That player is not muted!`, 1, 1e4);

                        for (let i in core.players) {
                            let mutedPlayer = core.players[i];
                            if (mutedPlayer.name === player.name) {
                                mutedPlayer.isMuted = false;
                                playerEntity.socket.emit(`showCenterMessage`, `You unmuted ${unmuteUser}.`, 3, 1e4);
                                mutedPlayer.socket.emit(`showCenterMessage`, `You have been unmuted.`, 4, 1e4);

                                for (let i in core.players) {
                                    let curPlayer = core.players[i];
                                    if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} unmuted ${player.name}.`, 4, 1e4);
                                }

                                log(`blue`, `Admin / Mod ${playerEntity.name} unmuted ${player.name} | IP: ${player.socket.handshake.address}.`);
                                return bus.emit(`report`, `Unban Player`, `Admin / Mod ${playerEntity.name} unmuted ${player.name}.`);
                            }
                        }
                    } else if (command === `clear` && isAdmin) {
                        playerEntity.socket.emit(`showCenterMessage`, `You have cleared the chat.`, 3, 1e4);

                        io.emit(`showCenterMessage`, `An admin has cleared the chat!`, 1, 1e4);
                        io.emit(`clear`);

                        for (let i in core.players) {
                            let curPlayer = core.players[i];
                            if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} cleared the chat.`, 4, 1e4);
                        }

                        log(`blue`, `Admin ${playerEntity.name} cleared global chat | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return bus.emit(`report`, `Chat Clear`, `Admin ${playerEntity.name} cleared the global chat.`);
                    } else if (command === `cycle` && isAdmin) {
                        if (currentTime === `night`) currentTime = `day`;
                        else currentTime = `night`;

                        playerEntity.socket.emit(`showCenterMessage`, `Succesfully set the time to ${currentTime}!`, 3, 1e4);
                        io.emit(`cycle`, currentTime);

                        for (let i in core.players) {
                            let curPlayer = core.players[i];
                            if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} changed the time to ${currentTime}.`, 4, 1e4);
                        }

                        log(`blue`, `Player ${playerEntity.name} changed the time to ${currentTime} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return bus.emit(`report`, `Time Set`, `Admin ${playerEntity.name} set the time to ${currentTime}.`);
                    } else if (command === `give` && (playerEntity.name === `BR88C` || playerEntity.name === `DamienVesper`)) {
                        let giveUser = args.shift();
                        let giveAmount = args[0] ? parseInt(args.shift()) : undefined;

                        let player = Object.values(core.players).find(player => player.name === giveUser);
                        if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);

                        if (!giveAmount || isNaN(giveAmount)) return playerEntity.socket.emit(`showCenterMessage`, `You did not specify a valid amount!`, 1, 1e4);

                        for (let i in core.players) {
                            let curPlayer = core.players[i];

                            if (player.name === curPlayer.name) {
                                curPlayer.gold += giveAmount;
                                curPlayer.socket.emit(`showCenterMessage`, `You have received ${giveAmount} gold!`, 4, 1e4);
                            } else if (curPlayer.name !== playerEntity.name && (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isDev)) curPlayer.socket.emit(`showCenterMessage`, `${playerEntity.name} gave ${player.name} ${giveAmount} gold.`, 4, 1e4);
                        }
                        log(`blue`, `Player ${playerEntity.name} gave ${giveUser} ${giveAmount} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return bus.emit(`report`, `Give Gold`, `Admin ${playerEntity.name} gave ${giveUser} ${giveAmount} gold.`);
                    }
                }
            } else if (!playerEntity.isMuted && !isSpamming(playerEntity, msgData.message)) {
                // Find the user and check if he is IP muted.
                let isIPMuted = await Mute.findOne({
                    IP: playerEntity.socket.handshake.address
                });
                if (isIPMuted) return playerEntity.socket.emit(`showCenterMessage`, `You have been muted!`, 1);

                let msg = msgData.message.toString();

                msg = filter.clean(xssFilters.inHTMLData(msg));

                if (msgData.recipient === `global`) {
                    io.emit(`chat message`, {
                        playerId: playerEntity.id,
                        playerName: playerEntity.name,
                        playerClan: playerEntity.clan ? playerEntity.clan : undefined,
                        recipient: `global`,
                        message: charLimit(msg, 150)
                    });
                    if (config.mode === `prod`) bus.emit(`msg`, playerEntity.id, playerEntity.name, playerEntity.serverNumber, charLimit(msg, 150));
                } else if (msgData.recipient === `local` && entities[playerEntity.parent.id]) {
                    for (let i in entities[playerEntity.parent.id].children) {
                        let player = entities[playerEntity.parent.id].children[i];
                        player.socket.emit(`chat message`, {
                            playerId: playerEntity.id,
                            playerName: playerEntity.name,
                            playerClan: playerEntity.clan ? playerEntity.clan : undefined,
                            recipient: `local`,
                            message: charLimit(msg, 150)
                        });
                    }
                } else if (msgData.recipient === `clan` && playerEntity.clan) {
                    let clan = playerEntity.clan;
                    for (let i in entities) {
                        let entity = entities[i];
                        if (entity && entity.netType === 0 && entity.clan === clan) {
                            entity.socket.emit(`chat message`, {
                                playerId: playerEntity.id,
                                playerName: playerEntity.name,
                                playerClan: playerEntity.clan ? playerEntity.clan : undefined,
                                recipient: `clan`,
                                message: charLimit(msg, 150)
                            });
                        }
                    }
                } else if (msgData.recipient === `staff` && (Admins.includes(playerEntity.name) || Mods.includes(playerEntity.name) || Devs.includes(playerEntity.name) || playerEntity.isAdmin || playerEntity.isMod || playerEntity.isDev)) {
                    for (let i in core.players) {
                        let player = core.players[i];
                        if (Admins.includes(player.name) || Mods.includes(player.name) || Devs.includes(player.name)) player.socket.emit(`chat message`, {
                            playerId: playerEntity.id,
                            playerName: playerEntity.name,
                            playerClan: playerEntity.clan ? playerEntity.clan : undefined,
                            recipient: `staff`,
                            message: charLimit(msg, 150)
                        });
                    }
                } else if (msgData.message.length > 1) {
                    playerEntity.socket.emit(`showCenterMessage`, `You have been muted!`, 1);
                    log(`yellow`, `Player ${playerEntity.name} was muted and tried to speak | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                }
            }
        });

        playerNames = {};
        for (let id in core.players) playerNames[id] = filter.clean(xssFilters.inHTMLData(core.players[id].name));
        socket.emit(`playerNames`, playerNames, socketId);

        socket.on(`changeWeapon`, index => {
            index = xssFilters.inHTMLData(index);
            index = parseInt(index);
            if (playerEntity !== undefined && (index === 0 || index === 1 || index === 2)) {
                playerEntity.activeWeapon = index;
                playerEntity.isFishing = false;
            }
        });

        // Fired when player disconnects from the game.
        socket.on(`disconnect`, async data => {
            log(`magenta`, `Player ${playerEntity.name} disconnected from the game | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            if (!DEV_ENV) delete gameCookies[playerEntity.id];

            if (playerEntity.serverNumber === 1 && playerEntity.gold > playerEntity.highscore) {
                log(`magenta`, `Updated highscore for player: ${playerEntity.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${parseInt(playerEntity.gold)} | IP: ${playerEntity.socket.handshake.address}.`);
                playerEntity.highscore = parseInt(playerEntity.gold);

                const user = await User.findOne({ username: playerEntity.name });
                if (!user) return;

                user.highscore = playerEntity.highscore;
                user.save();
            }

            if (playerEntity.parent && playerEntity.parent.netType === 1 && (playerEntity.parent.shipState !== 4 || playerEntity.parent.shipState !== 3) && playerEntity.isCaptain && Object.keys(playerEntity.parent.children).length === 1 && playerEntity.parent.hp < playerEntity.parent.maxHp) {
                log(`magenta`, `Player ${playerEntity.name} tried to chicken out --> Ghost ship | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                // Lower the boat HP and remove it from the game.
                playerEntity.parent.hp = 1;
                setTimeout(() => {
                    core.removeEntity(playerEntity);
                    playerEntity.parent.updateProps();
                    core.removeEntity(playerEntity.parent);
                }, 15e3);
            } else {
                core.removeEntity(playerEntity);

                if (playerEntity && playerEntity.parent) {
                    // Delete the player entry from the boat.
                    delete playerEntity.parent.children[playerEntity.id];

                    // If the player was on a boat, physically delete it from the boat.
                    if (playerEntity.parent.netType === 1) {
                        playerEntity.parent.updateProps();
                        if (Object.keys(playerEntity.parent.children).length === 0) core.removeEntity(playerEntity.parent);
                    }
                }
            }
        });

        socket.on(`updateKrewName`, name => {
            // Do not allow any form of brackets in the name.
            name = name.replace(/[\[\]{}()/\\]/g, ``);

            if (name !== null && name.length > 1) {
                if (name.length > 60) {
                    log(`cyan`, `Exploit detected (crew name length). Player ${playerEntity.name} kicked | Adding IP ${playerEntity.socket.handshake.address} to the ban list | Server ${playerEntity.serverNumber}.`);
                    if (playerEntity.socket.handshake.address.length > 5) {
                        let ban = new Ban({
                            username: player.name,
                            IP: socket.handshake.address,
                            comment: `Exploit: crew name length`
                        });
                        return ban.save(() => playerEntity.socket.disconnect());
                    }
                }

                // Filter the ship name.
                name = filter.clean(xssFilters.inHTMLData(name)).substring(0, 20);

                log(`magenta`, `Update krew name: ${name} | Player name: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                // Make sure that the player is the captain of the krew.
                if (core.boats[playerEntity.parent.id] !== undefined && playerEntity && playerEntity.parent && playerEntity.parent.captainId === playerEntity.id) {
                    if (krewioData) krewioService.save(krewioData.user, {
                        krewname: name
                    }).then(data => krewioData = data);
                    core.boats[playerEntity.parent.id].crewName = name;
                }
            }
        });

        socket.on(`deletePickup`, pickupId => core.removeEntity(core.entities[pickupId]));

        // For testing performance.
        socket.on(`amountPickup`, type => {
            let typeEntity = type;
            let count = 0;
            for (let i in entities)
                if (entities[i].type === typeEntity) count++;
            socket.emit(count);
        });
        socket.on(`removeAllCrates`, () => {
            for (let i in entities)
                if (entities[i].type === 0) core.removeEntity(core.entities[i]);
        });
        socket.on(`minAmountCratesInSea`, amount => cratesInSea.min = amount);
        socket.on(`maxAmountCratesInSea`, amount => cratesInSea.max = amount);

        socket.on(`departure`, async departureCounter => {
            // Check if player who sends exitIsland command is docked at island.
            if (playerEntity.parent.anchorIslandId === undefined) log(`cyan`, `Exploit detected (docking at sea). Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            else {
                // Check if player has already clicked sail button. If yes, do nothing.
                if (playerEntity.parent.shipState === 3) {
                    for (let i in core.players) {
                        let player = core.players[i];
                        if (player && player.parent && ((player.parent.netType === 1 && player.parent.anchorIslandId === playerEntity.parent.anchorIslandId) ||
                                (player.parent.netType === 5 && player.parent.id === playerEntity.parent.anchorIslandId))) {
                            if (player.parent.id !== playerEntity.parent.id) {
                                // If conditions are fulfilled and parent.id is not my parent.id, let the krew list button glow.
                                player.socket.emit(`departureWarning`);
                            }
                        }
                    }

                    if (playerEntity && playerEntity.parent && playerEntity.parent.captainId === playerEntity.id) {
                        let boat = playerEntity.parent;
                        boat.shipState = 4;
                        boat.lastMoved = new Date();
                        boat.recruiting = true;
                        boat.dock_countdown = undefined;

                        if (departureCounter === 1) {
                            boat.departureTime = 5;
                            for (let i in boat.children) {
                                let player = boat.children[i];
                                if (!DEV_ENV && player !== undefined && player.netType === 0) player.socket.emit(`showAdinPlayCentered`); // Better way of implementing ads? Players can bypass this.

                                if (player.serverNumber === 1 && player.gold > player.highscore) {
                                    log(`magenta`, `Updated highscore for player ${player.name} | Old highscore: ${player.highscore} | New highscore: ${parseInt(player.gold)} | IP: ${playerEntity.socket.handshake.address}.`);
                                    player.highscore = parseInt(player.gold);

                                    // Update player highscore in MongoDB.
                                    const user = await User.findOne({ username: playerEntity.name });
                                    if (!user) return;
                                    user.highscore = player.highscore;
                                    user.save();
                                }
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
            if (playerEntity && playerEntity.parent && playerEntity.parent.captainId === playerEntity.id) {
                boat.exitIsland();

                for (let i in boat.children) {
                    let player = boat.children[i];
                    if (player !== undefined && player.netType === 0) {
                        player.socket.emit(`exitIsland`, {
                            captainId: boat.captainId
                        });
                        player.sentDockingMsg = false;
                    }
                }
            }
        });

        // If player chooses to abandon ship.
        socket.on(`abandonShip`, data => {
            let motherShip = playerEntity.parent;

            // Only non-captains can abandon ship.
            if (motherShip) {
                if (motherShip.captainId !== playerEntity.id) {
                    if (motherShip.shipState === 0) {
                        let boat = core.createBoat(playerEntity.id, (krewioData || {}).krewname, false);
                        boat.addChildren(playerEntity);
                        boat.setShipClass(0);
                        boat.exitMotherShip(motherShip);

                        boat.speed += parseFloat(playerEntity.movementSpeedBonus / 10);
                        boat.turnspeed += parseFloat((0.05 * playerEntity.movementSpeedBonus) / 10);

                        boat.updateProps();
                        boat.shipState = 0;
                    } else {
                        entities[motherShip.anchorIslandId] && entities[motherShip.anchorIslandId].addChildren(playerEntity);

                        let boat = core.createBoat(playerEntity.id, (krewioData || {}).krewname, false);
                        boat.addChildren(playerEntity);
                        boat.setShipClass(0);

                        boat.updateProps();
                        boat.shipState = 3;
                    }

                    // Delete him from the previous krew.
                    delete motherShip.children[playerEntity.id];
                    motherShip.updateProps && motherShip.updateProps();

                    // Recaulcualte amount of killed ships (by all crew members).
                    let crewKillCount = 0;
                    let crewTradeCount = 0;

                    for (let i in core.players) {
                        let player = core.players[i];
                        if (player.parent && motherShip.id === player.parent.id) {
                            crewKillCount += player.shipsSank;
                            crewTradeCount += player.overall_cargo;
                        }
                    }
                    motherShip.overall_kills = crewKillCount;
                    motherShip.overall_cargo = crewTradeCount;
                }
            }
        });
        socket.on(`lock-krew`, lockBool => {
            if (playerEntity.isCaptain && lockBool) {
                playerEntity.parent.isLocked = true;
                playerEntity.parent.recruiting = false;
            } else if (playerEntity.isCaptain && !lockBool) {
                playerEntity.parent.isLocked = false;
                if (playerEntity.parent.shipState === 2 || playerEntity.parent.shipState === 3 || playerEntity.parent.shipState === 4) playerEntity.parent.recruiting = true;
            }
        });

        socket.on(`clan`, async (action, callback) => {
            // Only logged in players can perform clan actions.
            const user = await User.findOne({ username: playerEntity.name });
            if (!user) {
                log(`cyan`, `Exploit: Player ${playerEntity.name} tried clan action without login | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                return callback(false);
            }

            // Get the user performing the action.
            let user = await User.findOne({
                username: playerEntity.name
            });

            // If player has a clan.
            if (user && user.clan) {
                // Get the clan from MongoDB.
                let clan = await Clan.findOne({
                    name: user.clan
                });

                // If the clan doesn't exist (result of some bug).
                if (!clan) {
                    user.clan = undefined;
                    user.clanRequest = undefined;

                    user.save(() => {
                        log(`red`, `ERROR FINDING CLAN | Player ${playerEntity.name} | Clan ${playerEntity.clan} | Clan does not exist! Setting player clan to undefined...`);
                        return callback(false);
                    });
                }

                // Actions for all members.
                if (action === `get-data`) {
                    let clanMemberDocs = await User.find({
                        clan: clan.name
                    });
                    let clanRequestDocs = await User.find({
                        clanRequest: clan.name
                    });

                    let clanMembers = [];
                    let clanRequests = [];

                    // Push members and requests to the list.
                    for (const document of clanMemberDocs) clanMembers.push(document.username);
                    for (const document of clanRequestDocs) clanRequests.push(document.username);

                    let clanData = {
                        clanOwner: clan.owner,
                        clanLeader: clan.leaders,
                        clanMembers
                    };

                    if (clan.leaders.includes(playerEntity.name) || clan.owner === playerEntity.name) clanData.clanRequests = clanRequests;
                    return callback(clanData);
                } else if (action === `leave`) {
                    if (clan.owner === playerEntity.name) {
                        let clanMembers = await User.find({
                            clan: clan.name
                        });

                        if (clanMembers.length === 1) {
                            // Delete the clan from the player.
                            user.clan = undefined;
                            user.clanRequest = undefined;

                            clan.delete(() => {
                                user.save(() => {
                                    log(`magenta`, `CLAN DELETED | Owner ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                                    playerEntity.clan = undefined;
                                    playerEntity.clanRequest = undefined;

                                    return callback(true);
                                });
                            });
                        } else {
                            // Dereference the player's clan.
                            user.clan = undefined;
                            user.clanRequest = undefined;

                            playerEntity.clan = undefined;
                            playerEntity.clanRequest = undefined;

                            // If he is a leader, remove him from the leaders' list.
                            if (clan.leaders.includes(playerEntity.name)) clan.leaders.splice(clan.leaders.indexOf(playerEntity.name), 1);

                            // Save the changes and callback to the player.
                            user.save(async () => {
                                // Get the new clan members.
                                let newClanMembers = await User.find({
                                    clan: clan.name
                                });

                                if (clan.leaders.length !== 0) clan.owner = clan.leaders[0];
                                else {
                                    clan.owner = newClanMembers.limit(1).username;
                                    clan.leaders.push(clan.owner);
                                }

                                clan.save(() => {
                                    log(`magenta`, `CLAN LEFT | Player ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                                    return callback(true);
                                });
                            });
                        }
                    } else {
                        // Dereference the player's clan.
                        user.clan = undefined;
                        user.clanRequest = undefined;

                        user.save(() => {
                            playerEntity.clan = undefined;
                            playerEntity.clanRequest = undefined;

                            playerEntity.socket.emit(`showCenterMessage`, `You left clan [${clan.name}].`, 4, 5e3);

                            for (let i in core.players) {
                                let player = core.players[i];
                                if (player.clan === clan.name) player.socket.emit(`showCenterMessage`, `${playerEntity.name} has left your clan.`, 4, 5e3);
                            }

                            log(`magenta`, `CLAN LEFT | Player ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                            return callback(true);
                        });
                    }
                }

                // From this point on there should be a player passed to the emit.
                else if (action.id && (clan.leaders.includes(playerEntity.name) || clan.owner === playerEntity.name)) {
                    let otherUser = await User.findOne({
                        username: action.id
                    });

                    // If the player is nonexistent or is not in the same clan.
                    if (!otherUser) return log(`red`, `CLAN UPDATE ERROR | Player ${playerEntity.name} tried to update nonexistent player ${action.id} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                    // Actions for leader / owners / assistants.
                    if (action.action && action.action === `accept`) {
                        // If player is not in a clan and is currently requesting to join this clan.
                        if (!otherUser.clan && otherUser.clanRequest === user.clan) {
                            otherUser.clan = user.clan;
                            otherUser.clanRequest = undefined;

                            otherUser.save(() => {
                                for (let i in core.players) {
                                    let player = core.players[i];
                                    if (player.clan === user.clan && player.name !== action.id && player.name !== playerEntity.name && !player.clanLeader && !player.clanOwner) player.socket.emit(`showCenterMessage`, `Player ${otherUser.username} joined your clan.`, 4, 5e3);
                                    else if (player.clan === user.clan && (player.clanLeader || player.clanOwner)) player.socket.emit(`showCenterMessage`, `Player ${playerEntity.name} accepted ${otherUser.username} into the clan.`, 4, 5e3);
                                    else if (player.name === action.id) {
                                        player.clan = user.clan;
                                        player.clanRequest = undefined;
                                        player.socket.emit(`showCenterMessage`, `${playerEntity.name} accepted your request to join [${playerEntity.clan}].`, 3, 5e3);
                                    }
                                }
                                playerEntity.socket.emit(`showCenterMessage`, `You accepted ${otherUser.username} to join your clan.`, 3, 5e3);
                                log(`magenta`, `${playerEntity.name} accepted player ${otherUser.username} to joining clan ${playerEntity.clan} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                                return callback(true);
                            });
                        } else return callback(false);
                    } else if (action.action && action.action === `decline`) {
                        otherUser.clanRequest = undefined;
                        otherUser.clan = undefined;

                        otherUser.save(() => {
                            for (let i in core.players) {
                                let player = core.players[i];
                                if (player.name === action.id) {
                                    player.clan = undefined;
                                    player.clanRequest = undefined;
                                    player.socket.emit(`showCenterMessage`, `${playerEntity.name} rejected your request to join [${playerEntity.clan}].`, 1, 5e3);
                                }
                            }

                            playerEntity.socket.emit(`showCenterMessage`, `You rejected ${otherUser.username}'s request to join the clan.`, 4, 5e3);

                            log(`magenta`, `${playerEntity.name} declined player ${otherUser.username} from joining clan ${playerEntity.clan} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                            return callback(true);
                        });
                    } else if (action.action && action.action === `promote`) {
                        if (clan.owner === playerEntity.name && !clan.leaders.includes(action.id)) {
                            // Only clan owner can promote to leaders.
                            clan.leaders.push(action.id);
                            clan.save(() => {
                                for (let i in core.players) {
                                    let player = core.players[i];
                                    if (player.clan === clan.name) player.socket.emit(`showCenterMessage`, `${action.id} was promoted to a clan leader by ${playerEntity.name}.`, 4, 5e3);
                                    else if (player.name === action.id) {
                                        player.clanLeader = true;
                                        player.socket.emit(`showCenterMessage`, `${playerEntity.name} promoted you to be a clan leader!`, 3, 5e3);
                                    }
                                }
                                return callback(true);
                            });
                        } else callback(false);
                    } else if (action.action && action.action === `kick`) {
                        otherUser.clan = undefined;
                        otherUser.clanRequest = undefined;

                        if (clan.leaders.includes(action.id)) clan.leaders.splice(clan.leaders.indexOf(action.id), 1);
                        otherUser.save(() => {
                            clan.save(() => {
                                for (let i in core.players) {
                                    let player = core.players[i];
                                    if (player.clan === clan.name && player.name !== action.id) player.socket.emit(`showCenterMessage`, `${otherUser.username} has been kicked from your clan.`, 4, 5e3);
                                    else if (player.name === action.id) {
                                        player.socket.emit(`showCenterMessage`, `${playerEntity.name} kicked you from the clan`, 1, 5e3);
                                        player.clanLeader = false;

                                        player.clan = undefined;
                                        player.clanRequest = undefined;
                                    }
                                }

                                log(`magenta`, `${playerEntity.name} kicked member ${otherUser.username} from clan ${playerEntity.clan} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                                return callback(true);
                            });
                        });
                    }
                }
            } else {
                if (action.action && action.action === `create`) {
                    let clanExists = await Clan.findOne({
                        name: action.id
                    });
                    if (clanExists) {
                        log(`cyan`, `Player ${playerEntity.name} tried to create duplicate clan ${action.id} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return callback(409);
                    }

                    action.id = filter.clean(xssFilters.inHTMLData(action.id));

                    let newClan = new Clan({
                        name: action.id.substr(0, 4),
                        owner: playerEntity.name,
                        leaders: [playerEntity.name]
                    });

                    user.clan = action.id;

                    newClan.save(() => {
                        user.save(() => {
                            playerEntity.clanOwner = true;
                            playerEntity.clanLeader = true;

                            playerEntity.clan = action.id;
                            playerEntity.clanRequest = undefined;

                            log(`magenta`, `Player ${playerEntity.name} created new clan ${action.id} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                            return callback(true);
                        });
                    });
                } else if (action.action && action.action === `join`) {
                    if (playerEntity.clanRequest || playerEntity.clan) return callback(false);

                    let clan = await Clan.findOne({
                        name: action.id
                    });

                    if (!clan) return callback(404);

                    user.clanRequest = action.id;
                    playerEntity.clanRequest = action.id;

                    user.save(() => {
                        log(`magenta`, `Player ${playerEntity.name} requested to join clan ${action.id} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        callback(true);
                        for (let i in core.players) {
                            let player = core.players[i];
                            if (player.clan === action.id) player.socket.emit(`showCenterMessage`, `Player ${playerEntity.name} wants to join your clan.`, 4, 5e3);
                        }
                    });
                } else if (action.action && action.action === `cancel-request`) {
                    user.clanRequest = undefined;
                    playerEntity.clanRequest = undefined;

                    user.save(() => {
                        log(`magenta`, `Player ${playerEntity.name} cancelled a request to join clan ${action.id} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        callback(true);
                    });
                }
            }
        });

        // Respawn.
        socket.on(`respawn`, callback => {
            if (playerEntity.parent.hp >= 1) return log(`cyan`, `Player ${playerEntity.name} tried to respawn while his boat still has health | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            // Check for timestamp of last respawn and ban if it was less than 2 seconds ago.
            if (socket.timestamp !== undefined && Date.now() - socket.timestamp < 2e3) {
                log(`cyan`, `Exploit detected: multiple respawn | Player: ${playerEntity.name} | Adding IP ${playerEntity.socket.handshake.address} to bannedIPs | Server ${playerEntity.serverNumber}.`);
                if (playerEntity.socket.handshake.address.length > 5) {
                    let ban = new Ban({
                        username: player.name,
                        IP: socket.handshake.address,
                        comment: `Exploit: multiple respawn`
                    });
                    ban.save(() => playerEntity.socket.disconnect());
                }
            } else {
                log(`magenta`, `Respawn by Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                // Remove gold on player death.
                playerEntity.gold = parseFloat(Math.max(0, (playerEntity.gold * 0.3).toFixed(0)));
                playerEntity.gold += 1300; // Give player gold for raft 2 after respawn.

                // Dequip item.
                playerEntity.dequip();
                playerEntity.itemId = -1;

                // Remove all cargo.
                playerEntity.cargoUsed = 0;
                for (let i in playerEntity.goods) playerEntity.goods[i] = 0;

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

            if (player) {
                let motherShip = playerEntity.parent;

                if (motherShip) {
                    // Only captains can boot, and they cannot boot themselves.
                    if (motherShip.captainId === playerEntity.id && playerEntity.id !== player.id) {
                        let boat = core.createBoat(player.id, (krewioData || {}).krewname, false);
                        boat.setShipClass(0);
                        boat.addChildren(player);
                        boat.updateProps();
                        boat.shipState = 0;

                        if (motherShip.shipState === 0) {
                            boat.exitMotherShip(motherShip);

                            boat.speed += parseFloat(playerEntity.movementSpeedBonus / 10);
                            boat.turnspeed += parseFloat((0.05 * playerEntity.movementSpeedBonus) / 10);
                        } else entities[motherShip.anchorIslandId] && entities[motherShip.anchorIslandId].addChildren(player);

                        // Delete the player from the previous krew.
                        delete motherShip.children[playerId];
                        motherShip.updateProps();

                        // Recalcualte amount of killed ships (by all crew members).
                        let crewKillCount = 0;
                        let crewTradeCount = 0;

                        for (let i in core.players) {
                            let player = core.players[i];
                            if (player.parent && motherShip.id === player.parent.id) {
                                crewKillCount += player.shipsSank;
                                crewTradeCount += player.overall_cargo;
                            }
                        }
                        motherShip.overall_kills = crewKillCount;
                        motherShip.overall_cargo = crewTradeCount;
                    }
                }
            }
        });

        socket.on(`transferShip`, playerId => {
            let player = core.players[playerId];
            if (player) {
                let motherShip = playerEntity.parent;
                if (motherShip.captainId === playerEntity.id && playerEntity.id !== player.id && player.parent.id === motherShip.id) playerEntity.parent.captainId = playerId;
            }
        });

        socket.on(`joinKrew`, (boatId, callback) => {
            let boat = core.boats[boatId];
            if (boat && !boat.isLocked) {
                let playerBoat = playerEntity.parent; // Player's boat, or anchored island if they do not own a boat.

                let krewCargoUsed = 0;
                for (let i in boat.children) krewCargoUsed += boat.children[i].cargoUsed;

                let joinCargoAmount = krewCargoUsed + playerEntity.cargoUsed;
                let maxShipCargo = core.boatTypes[boat.shipclassId].cargoSize;

                let emitJoinKrew = id => {
                    if (entities[id] && entities[id].socket && entities[id].parent && entities[id].parent.crewName) entities[id].socket.emit(`showCenterMessage`, `You have joined "${entities[id].parent.crewName}"`, 3);
                };

                let movedIds = {};

                let emitNewKrewMembers = () => {
                    let names = ``;
                    for (let i in movedIds) names += ` ${movedIds[i]},`;
                    names = names.replace(/,$/gi, ``).trim();

                    for (let id in boat.children) {
                        if (entities[id] && entities[id] && !movedIds[id]) {
                            if (Object.keys(movedIds).length === 1)
                                for (let i in movedIds) entities[id].socket.emit(`showCenterMessage`, `New krew member ${movedIds[i]} has joined your krew!`, 3);
                            else if (Object.keys(movedIds).length > 1) entities[id].socket.emit(`showCenterMessage`, `New krew members ${names} have joined your krew!`, 3);
                        }
                    }
                };
                // Event filtering.
                if (boat && (boat.shipState === 3 || boat.shipState === 2 || boat.shipState === -1 || boat.shipState === 4) &&
                    playerBoat && (playerBoat.shipState === 3 || playerBoat.shipState === 2 || playerBoat.shipState === -1 || playerBoat.shipState === 4 || playerBoat.netType === 5) &&
                    boat !== playerBoat) {
                    if (joinCargoAmount > maxShipCargo) {
                        callback(1);
                    } else {
                        callback(0);

                        // If player doesn't own a ship.
                        if (playerBoat.netType === 5) {
                            boat.addChildren(playerEntity);
                            boat.updateProps();

                            if (Object.keys(boat.children).length < boat.maxKrewCapacity) emitJoinKrew(playerEntity.id);
                            movedIds[playerEntity.id] = playerEntity.name;
                        } else {
                            // Check if there's enough capacity in target boat.
                            if (Object.keys(boat.children).length < boat.maxKrewCapacity) {
                                // Delete player from the old boat.
                                delete playerBoat.children[playerEntity.id];
                                playerBoat.updateProps();

                                // Add the player to the new boat.
                                boat.addChildren(playerEntity);
                                boat.updateProps();

                                // If the player was originally a captain.
                                if (playerBoat.captainId === playerEntity.id) {
                                    playerEntity.isCaptain = false;

                                    // Check if the boat has enough space for all players to join.
                                    if (Object.keys(playerBoat.children).length + Object.keys(boat.children).length <= boat.maxKrewCapacity) {
                                        for (let id in playerBoat.children) {
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
                                    } else {
                                        delete playerBoat.children[playerEntity.id];
                                        playerBoat.updateProps();

                                        emitJoinKrew(playerEntity.id);
                                        movedIds[playerEntity.id] = playerEntity.name;

                                        if (Object.keys(playerBoat.children).length === 0) core.removeEntity(playerBoat);
                                    }
                                }
                            }
                        }
                        emitNewKrewMembers();

                        // Recalculate amount of killed ships and traded cargo (by all crew members).
                        let crewKillCount = 0;
                        let crewTradeCount = 0;

                        for (let i in core.players) {
                            let player = core.players[i];
                            if (player.parent && playerEntity.parent.id === player.parent.id) {
                                crewKillCount += player.shipsSank;
                                crewTradeCount += player.overall_cargo;
                            }
                        }
                        playerEntity.parent.overall_kills = crewKillCount;
                        playerEntity.parent.overall_cargo = crewTradeCount;
                    }
                }
            }
        });

        // When ship enters docking area.
        socket.on(`dock`, () => {
            if (playerEntity.parent.shipState === 1 && playerEntity.parent.captainId === playerEntity.id) playerEntity.parent.dock_countdown = new Date();
        });

        // When ship docks completely (anchors) in the island.
        socket.on(`anchor`, () => {
            if (playerEntity.parent.dock_countdown < new Date() - 8e3 && playerEntity.parent.shipState === 1 && playerEntity.parent.captainId === playerEntity.id) playerEntity.parent.shipState = 2;
        });

        // When player buys an item.
        socket.on(`purchase`, (item, callback) => {
            checkPlayerStatus();
            log(`magenta`, `Player ${playerEntity.name} is buying `, item, ` while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            // Check if id is an integer > 0.
            if (!isNormalInteger(item.id)) return;

            // If it is a ship.
            if (item.type === 0 && playerEntity.parent.shipState !== 4) {
                if (playerEntity) {
                    let ships = {};

                    let cargoUsed = 0;
                    for (let i in playerEntity.goods) cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
                    playerEntity.cargoUsed = cargoUsed;

                    let totalCargoUsed = 0;
                    for (let i in playerEntity.parent.children) totalCargoUsed += playerEntity.parent.children[i].cargoUsed;

                    // If there is not enough cargo for the players on the new boat, then do not buy it.
                    if (totalCargoUsed > core.boatTypes[item.id].cargoSize) return callback(false);

                    // Put together item.id and item.type and send them back to the client.
                    let response = item.type + item.id;
                    callback(response);

                    playerEntity.other_quest_level = playerEntity.other_quest_level === undefined ? 0 : playerEntity.other_quest_level;

                    // Give the rewards for the quests.
                    if (playerEntity.gold >= core.boatTypes[item.id].price) {
                        let questLists = [
                            [`04`, `05`, `06`, `07`, `08`, `09`], // Boat and Trader
                            [`010`, `011`, `012`, `013`, `014`, `015`, `016`, `017`, `018`, `019`, `020`], // Destroyer, Baby Fancy, Royal Fortune, Calm Spirit, Junkie, and Raider
                            [`021`, `022`, `023`, `024`] // Queen Barb's Justice, Black Oyster, and Fortune Trader
                        ];

                        if (questLists[0].includes(response) && playerEntity.other_quest_level === 0) {
                            playerEntity.socket.emit(`showCenterMessage`, `Achievement: Beginner Sailor: +5,000 Gold & 500 XP`);
                            playerEntity.gold += 5e3;
                            playerEntity.experience += 500;
                            playerEntity.other_quest_level++;
                        }
                        if (questLists[1].includes(response) && playerEntity.other_quest_level === 1) {
                            playerEntity.socket.emit(`showCenterMessage`, `Achievement: Accomplished Sailor: +10,000 Gold & 1,000 XP`);
                            playerEntity.gold += 1e4;
                            playerEntity.experience += 1e3;
                            playerEntity.other_quest_level++;
                        }
                        if (questLists[2].includes(response) && playerEntity.other_quest_level === 2) {
                            playerEntity.socket.emit(`showCenterMessage`, `Achievement: Legendary Sailor: +50,000 Gold & 5,000 XP`);
                            playerEntity.gold += 5e4;
                            playerEntity.experience += 5e3;
                            playerEntity.other_quest_level++;
                        }
                    }
                    playerEntity.purchaseShip(item.id, (krewioData || {}).krewname);

                    // Calculate other quest level of captain.
                    let other_quest_level;
                    for (let i in core.players) {
                        let player = core.players[i];
                        if (player.parent && playerEntity.parent.id === player.parent.id && player.isCaptain) other_quest_level = player.other_quest_level;
                    }
                    playerEntity.parent.other_quest_level = other_quest_level;
                }
            } else if (item.type === 1) {
                // Item.
                callback(item.id);

                // Check conditions for buying demolisher.
                if (item.id === `11` && playerEntity.gold >= 1e5) {
                    if (playerEntity.overall_cargo >= 1e3 && playerEntity.shipsSank >= 10) {
                        playerEntity.purchaseItem(item.id);
                        log(`magenta`, `Player ${playerEntity.name} is buying item`, item, ` (Demolisher) while having ${Math.floor(playerEntity.gold)} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    }
                } else if (item.id === `14` && playerEntity.gold >= 15e4) {
                    // Player can buy this item only once.
                    if (!playerEntity.statsReset) {
                        // Reset stats.
                        for (let i in playerEntity.points) playerEntity.points[i] = 0;
                        playerEntity.availablepoints = playerEntity.level;
                        playerEntity.statsReset = true;
                        playerEntity.purchaseItem(item.id);
                        log(`magenta`, `Player ${playerEntity.name} is buying item `, item, ` (Fountain of Youth) while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    }
                } else {
                    playerEntity.purchaseItem(item.id);
                    log(`magenta`, `Player ${playerEntity.name} is buying item `, item, ` while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                }
            }

            // Recalculate amount of killed ships and traded cargo (by all crew members).
            let crewKillCount = 0;
            let crewTradeCount = 0;

            for (let i in core.players) {
                let player = core.players[i];
                if (player.parent !== undefined && playerEntity.parent.id === player.parent.id) {
                    crewKillCount += player.shipsSank;
                    crewTradeCount += player.overall_cargo;
                }
            }
            playerEntity.parent.overall_kills = crewKillCount;
            playerEntity.parent.overall_cargo = crewTradeCount;
        });

        // Get ships in shop.
        socket.on(`getShips`, callback => {
            if (playerEntity && playerEntity.parent) {
                let ships = {};
                let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

                if (!island || island.netType !== 5) return (callback && callback.call && callback(`Oops, it seems you are not at an island.`));

                let cargoUsed = 0;
                for (let i in playerEntity.goods) cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
                playerEntity.cargoUsed = cargoUsed;

                for (let i in core.boatTypes) {
                    if ((!island.onlySellOwnShips && (core.boatTypes[i].availableAt === undefined || core.boatTypes[i].availableAt.indexOf(island.name) !== -1)) ||
                        (core.boatTypes[i].availableAt && core.boatTypes[i].availableAt.indexOf(island.name) !== -1)) {
                        ships[i] = core.boatTypes[i];
                        ships[i].purchasable =
                            playerEntity.gold >= ships[i].price &&
                            ships[i].cargoSize >= playerEntity.cargoUsed;
                    }
                }
                callback && callback.call && callback(undefined, ships);
            }
            callback && callback.call && callback(`Oops, it seems you don't have a boat.`);
        });

        // Get items in shop.
        socket.on(`getItems`, callback => {
            if (playerEntity && playerEntity.parent) {
                let items = {};
                let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

                if (!island || island.netType !== 5) return (callback && callback.call && callback(`Oops, it seems you are not in an island.`));

                for (let i in core.itemTypes) {
                    let itemProb = Math.random().toFixed(2);

                    if (playerEntity.itemId === core.itemTypes[i].id || (playerEntity.checkedItemsList && playerEntity.rareItemsFound.includes(core.itemTypes[i].id))) itemProb = 0;
                    if (playerEntity.checkedItemsList && !playerEntity.rareItemsFound.includes(core.itemTypes[i].id)) itemProb = 1;

                    if (itemProb <= core.itemTypes[i].rarity &&
                        (core.itemTypes[i].availableAt === undefined || core.itemTypes[i].availableAt.indexOf(island.name) !== -1 ||
                            (core.itemTypes[i].availableAt && core.itemTypes[i].availableAt.indexOf(island.name) !== -1))) {
                        items[i] = core.itemTypes[i];

                        if (!playerEntity.checkedItemsList && core.itemTypes[i].rarity !== 1) playerEntity.rareItemsFound.push(core.itemTypes[i].id);
                        items[i].purchasable = false;

                        if (playerEntity.gold >= items[i].price) items[i].purchasable = true;
                    }
                }
                playerEntity.checkedItemsList = true;
                callback && callback.call && callback(undefined, items);
            }
            callback && callback.call && callback(`Oops, it seems like you do not have items.`);
        });

        // Get goods in shop.
        socket.on(`getGoodsStore`, callback => {
            if (playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId) {
                if (!core.entities[playerEntity.parent.anchorIslandId]) return callback && callback.call && callback(`Oops, it seems like you do not have an anchored boat.`);

                let data = {
                    cargo: core.boatTypes[playerEntity.parent.shipclassId].cargoSize,
                    gold: playerEntity.gold,
                    goods: playerEntity.goods,
                    goodsPrice: core.entities[playerEntity.parent.anchorIslandId].goodsPrice,
                    cargoUsed: 0
                };

                for (let i in playerEntity.parent.children) {
                    let child = playerEntity.parent.children[i];
                    if (child && child.netType === 0 && core.entities[child.id]) {
                        let cargoUsed = 0;
                        for (let i in child.goods) cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
                        data.cargoUsed += cargoUsed;
                        core.entities[child.id].cargoUsed = cargoUsed;
                    }
                }
                callback && callback.call && callback(undefined, data);
            }
            callback && callback.call && callback(`Oops, it seems you don't have an anchored boat.`);
        });

        // When player buys goods.
        socket.on(`buy-goods`, (transaction, callback) => {
            // Add a timestamp to stop hackers from spamming buy / sell emits.
            if (playerEntity.goodsTimestamp && Date.now() - playerEntity.goodsTimestamp < 800) {
                playerEntity.sellCounter++;
                if (playerEntity.sellCounter > 3) {
                    log(`cyan`, `Player ${playerEntity.name} is spamming buy / sell emits --> Kicking | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return playerEntity.socket.disconnect();
                }
            } else playerEntity.sellCounter = 0;

            playerEntity.goodsTimestamp = Date.now();
            checkPlayerStatus();

            log(`magenta`, `Operation: ${transaction.action} - `, transaction, ` | Player: ${playerEntity.name} | Gold: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            if (playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId && (playerEntity.parent.shipState === 3 || playerEntity.parent.shipState === 4)) {
                Object.assign(transaction, {
                    goodsPrice: entities[playerEntity.parent.anchorIslandId].goodsPrice,
                    gold: playerEntity.gold,
                    goods: playerEntity.goods,
                    cargo: core.boatTypes[playerEntity.parent.shipclassId].cargoSize,
                    cargoUsed: 0
                });

                for (let i in playerEntity.parent.children) {
                    let child = playerEntity.parent.children[i];
                    if (child && child.netType === 0 && core.entities[child.id]) {
                        let cargoUsed = 0;
                        for (let i in child.goods) cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
                        transaction.cargoUsed += cargoUsed;
                        core.entities[child.id].cargoUsed = cargoUsed;
                    }
                }
                transaction.quantity = parseInt(transaction.quantity);

                // Start quantity validation.
                let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];
                if (transaction.action === `buy`) {
                    playerEntity.last_island = island.name;
                    let max = parseInt(transaction.gold / transaction.goodsPrice[transaction.good]);
                    let maxCargo = (transaction.cargo - transaction.cargoUsed) / core.goodsTypes[transaction.good].cargoSpace;

                    if (max > maxCargo) max = maxCargo;
                    max = Math.floor(max);
                    if (transaction.action.quantity > max) transaction.quantity = max;
                }
                if (transaction.quantity.action === `sell` && transaction.quantity > transaction.goods[transaction.good]) transaction.quantity = transaction.goods[transaction.good];
                if (transaction.quantity < 0) transaction.quantity = 0;

                // Start transaction.
                if (transaction.action === `buy`) {
                    // Remove gold and add goods.
                    let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
                    transaction.gold -= gold;
                    transaction.goods[transaction.good] += transaction.quantity;
                } else if (transaction.action === `sell`) {
                    // Add gold and remove goods.
                    // This is a stub of validation to stop active exploits, consider to expand this to only player-owned goods.
                    if (transaction.cargoUsed < transaction.quantity) {
                        log(`cyan`, `Exploit detected (sell more than you have). Kicking player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}`);
                        return playerEntity.socket.disconnect();
                    }

                    let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
                    transaction.gold += gold;
                    transaction.goods[transaction.good] -= transaction.quantity;

                    if (playerEntity.last_island !== island.name) playerEntity.overall_cargo += gold;
                    if (transaction.goods[transaction.good] < 0 || playerEntity.goods[transaction.good] < 0) {
                        log(`cyan`, `Exploit detected (sell wrong goods) | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        return playerEntity.socket.disconnect();
                    }

                    // Trading achievement.
                    playerEntity.trade_level = !playerEntity.trade_level ? 0 : playerEntity.trade_level;
                    if (playerEntity.overall_cargo >= 1e3 && playerEntity.trade_level === 0) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading beginner: +1,000 Gold +100 XP`, 3);
                        transaction.gold += 1e3;

                        playerEntity.experience += 100;
                        playerEntity.trade_level++;
                    } else if (playerEntity.overall_cargo >= 6e3 && playerEntity.trade_level === 1) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                        transaction.gold += 2e3;

                        playerEntity.experience += 200;
                        playerEntity.trade_level++;
                    } else if (playerEntity.overall_cargo >= 15e3 && playerEntity.trade_level === 2) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                        transaction.gold += 5e3;

                        playerEntity.experience += 500;
                        playerEntity.trade_level++;
                    } else if (playerEntity.overall_cargo >= 3e4 && playerEntity.trade_level === 3) {
                        playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                        transaction.gold += 1e4;

                        playerEntity.experience += 1e3;
                        playerEntity.trade_level++;
                    }
                }

                // Calculate amount of traded cargo (by all crew numbers).
                let crewTradeCount = 0;
                for (let i in core.players) {
                    let player = core.players[i];
                    if (player.parent !== undefined && playerEntity.parent.id === player.parent.id) crewTradeCount += player.overall_cargo;
                }
                playerEntity.parent.overall_cargo = crewTradeCount;

                // Update player.
                playerEntity.gold = transaction.gold;
                playerEntity.goods = transaction.goods;

                callback && callback.call && callback(undefined, {
                    gold: transaction.gold,
                    goods: transaction.goods
                });

                for (let i in playerEntity.parent.children) {
                    let child = playerEntity.parent.children[i];
                    if (child && child.netType === 0 && core.entities[child.id] !== undefined) {
                        cargoUsed = 0;
                        for (let i in child.goods) cargoUsed += child.goods[i] & core.goodsTypes[i].cargoSpace;

                        transaction.cargoUsed += cargoUsed;
                        core.entities[child.id].cargoUsed = cargoUsed;
                        if (child.id !== playerEntity.id) child.socket.emit(`cargoUpdated`);
                    }
                }
                return log(`cyan`, `After Operation ${transaction.action} | Player: ${playerEntity.name} | Gold: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            }
            callback && callback.call && callback(new Error(`Oops, it seems that you don't have a boat.`));
        });

        // Return experience points to player.
        socket.on(`getExperiencePoints`, callback => {
            if (playerEntity && playerEntity.parent) {
                playerEntity.updateExperience();

                let obj = {
                    experience: playerEntity.experience,
                    points: playerEntity.points,
                    availablePoints: playerEntity.availablePoints
                };

                callback && callback.call && callback(undefined, obj);
            }
            callback && callback.call && callback(`Oops, it seems that you don't have a boat.`);
        });

        // Allocate points to player.
        socket.on(`allocatePoints`, (points, callback) => {
            // Check amount of already allocated points.
            let countPoints = 0;
            for (let i in playerEntity.points) countPoints += playerEntity.points[i];

            // Validate the player's stats.
            if (countPoints > 50) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            if (playerEntity.availablePoints > 50) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

            // Check if player has available points and if he has already allocated 51 points.
            if (playerEntity && playerEntity.parent && playerEntity.availablePoints > 0 && playerEntity.availablePoints <= 50 && countPoints < 51) {
                log(`magenta`, `Points allocated: `, points, ` | Overall allocated points: ${countPoints + 1} | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

                let countAllocatedPoints = 0;
                for (let i in points) {
                    let point = points[i];
                    countAllocatedPoints += point;

                    if (point < 0 || !Number.isInteger(point) || !(i === `fireRate` || i === `distance` || i === `damage`) || countAllocatedPoints > 1) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    else if (point !== undefined && typeof point === `number` && playerEntity.availablePoints > 0 && point <= playerEntity.availablePoints) {
                        playerEntity.points[i] += point;
                        playerEntity.availablePoints -= point;
                    }
                }

                playerEntity.updateExperience();
                callback && callback.call && callback(undefined);
            }
            callback && callback.call && callback(`Oops, it seems that you don't have a boat.`);
        });

        // Bank data.
        socket.on(`bank`, async data => {
            // If the player is logged in, allow them to use bank, else show warning that they need to log in.
            const user = await User.findOne({ username: playerEntity.name });
            if (user) {
                if (playerEntity.parent.name === `Labrador` || (playerEntity.parent.anchorIslandId && core.Landmarks[playerEntity.parent.anchorIslandId].name === `Labrador`)) {
                    // Function to callback the bank data to the player.
                    let setBankData = async () => {
                        let bankData = {
                            my: playerEntity.bank.deposit,
                            total: 0
                        };

                        // Get the sum of all bank accounts from MongoDB.
                        let users = await User.find({});
                        for (const document of users) bankData.total += parseInt(document.bankDeposit);

                        socket.emit(`setBankData`, bankData);
                    };

                    if (data) {
                        if (data.deposit && parseInt(playerEntity.gold) >= parseInt(data.deposit) && data.deposit >= 1 && data.deposit <= 15e4 && typeof data.deposit === `number` && data.deposit + playerEntity.bank.deposit <= 15e4) {
                            let integerDeposit = parseInt(data.deposit);
                            playerEntity.gold -= integerDeposit;

                            // Handle the deposit.
                            playerEntity.bank.deposit += integerDeposit;

                            const user = await User.findOne({ username: playerEntity.name });
                            user.bankDeposit = playerEntity.bank.deposit > 5e4 ? 5e4 : parseInt(playerEntity.bank.deposit);
                            user.save();

                            setBankData();
                            log(`magenta`, `Bank deposit | Player: ${playerEntity.name} | Deposit: ${integerDeposit} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        } else if (data.takedeposit && parseInt(playerEntity.bank.deposit) >= parseInt(data.takedeposit) && data.takedeposit >= 1 && data.takedeposit <= 15e4 && typeof data.takedeposit === `number`) {
                            let integerDeposit = parseInt(data.takedeposit);

                            // Take 10% fee for bank transaction.
                            playerEntity.gold += integerDeposit * 0.9;
                            playerEntity.bank.deposit -= integerDeposit;

                            const user = await User.findOne({ username: playerEntity.name });
                            user.bankDeposit = playerEntity.bank.deposit > 5e4 ? 5e4 : parseInt(playerEntity.bank.deposit);
                            setBankData();
                        }
                    } else setBankData();
                }
            } else socket.emit(`setBankData`, {
                warn: 1
            });
        });

        // Clan map marker.
        socket.on(`addMarker`, data => {
            if (playerEntity.clan) {
                if (playerEntity.markerMapCount < new Date() - 5e3) {
                    if (data.x && data.y && typeof data.x === `number` && typeof data.y === `number` && data.x > 0 && data.y > 0 && data.x < worldsize && data.y < worldsize) {
                        playerEntity.markerMapCount = new Date();
                        let clan = playerEntity.clan;
                        for (let i in entities) {
                            if (entities[i].netType === 0 && entities[i].clan === clan) {
                                entities[i].socket.emit(`chat message`, {
                                    playerId: playerEntity.id,
                                    playerName: playerEntity.name,
                                    playerClan: playerEntity.clan ? playerEntity.clan : undefined,
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

        // socket.on(`christmas`, () => {
        //     if (christmasGold > 1e4) {
        //         log(`cyan`, `Exploit detected: Gift spam | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
        //         return playerEntity.socket.disconnect();
        //     }

        //     if (christmasGold === 0) playerEntity.socket.emit(`showCenterMessage`, `Christmas presents...`, 3);
        //     playerEntity.gold += 10;
        //     christmasGold += 10;
        // });
    };

    // Catch players with local script modification.
    socket.on(`createPIayer`, data => {
        data.hacker = true;
        log(`Possible exploit detected (modified client script). Player name: ${data.name} | IP: ${socket.handshake.address}`);
        createThePlayer(data); // If hackers appear once again, can be changed to ban.
    });

    // Assing player data sent from the client.
    socket.on(`createPlayer`, data => {
        if (!playerEntity) createThePlayer(data);
    });

    let createThePlayer = data => {
        if (data.name) {
            if (!data.password || typeof data.name !== `string` || typeof data.password !== `string`) {
                log(`cyan`, `Exploit detected: Fradulent credential type. Refusing IP: ${socket.handshake.address}`);
                socket.emit(`showCenterMessage`, `Failed to verify credentials`, 1, 6e4);
                return socket.disconnect();
            }

            User.findOne({
                username: data.name
            }).then(user => {
                if (!user) return log(`cyan`, `Exploit detected: Fradulent user. Refusing IP: ${socket.handshake.address}.`);
                if (data.password === user.password) data.name = data.name.toString();
                else {
                    log(`cyan`, `Exploit detected: Incorrect password with username. Spawning IP as seadog: ${socket.handshake.address}`);
                    data.name = undefined;
                    data.password = undefined;
                }
                if (user && user.playerModel) data.playerModel = user.playerModel;
                if (user && user.hatModel) data.hatModel = user.hatModel;
                initSocketForPlayer(data);
            });
        } else {
            data.name = undefined;
            initSocketForPlayer(data);
        }
    };

    // Send full world information - force full data. First snapshot (compress with lz-string).
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
exports.send = () => {
    snapCounter = snapCounter > 10 ? 0 : snapCounter + 1;
    let msg;

    // if more than 10 snapShots are queued, then send the entire world's Snapshot. Otherwise, send delta
    msg = snapCounter === 10 ? core.compressor.getSnapshot(false) : core.compressor.getDelta();

    if (msg) {
        // compress snapshot data with lz-string
        msg = lzString.compress(JSON.stringify(msg));
        io.emit(`s`, msg);
    }
};

let isSpamming = (playerEntity, message) => {
    if (typeof message !== `string`) return true;
    if (message.length > 60 && !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev && !Admins.includes(playerEntity.name) && !Mods.includes(playerEntity.name) && !Devs.includes(playerEntity.name)) {
        mutePlayer(playerEntity, `Automatically muted by server`);
        return true;
    }
    now = new Date();

    if (!playerEntity.lastMessageSentAt) {
        playerEntity.lastMessageSentAt = now;
        playerEntity.sentMessages = [];
        return false;
    }

    if (now - playerEntity.lastMessageSentAt > 1e3 && message.length > 1) {
        playerEntity.sentMessages.push({
            time: new Date(),
            message
        });

        let totalTimeElapsed = 0;
        let charCount = 0;

        for (const message of playerEntity.sentMessages) {
            totalTimeElapsed += now - message.time;
            charCount += Math.max(message.length, 20);
        }

        if (charCount > 80 && totalTimeElapsed < 6e3) {
            log(`cyan`, `Spam detected for player ${playerEntity.name} sending ${charCount} characters in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
            playerEntity.socket.emit(`showCenterMessage`, `You have been muted!`, 1);
            mutePlayer(playerEntity, `Automatically muted by server`);
            return true;
        } else if (totalTimeElapsed > 4e3) charCount = 0;

        if (playerEntity.sentMessages.length > 2) {
            if (playerEntity.sentMessages[0].message === playerEntity.sentMessages[1].message && playerEntity.sentMessages[0].message === playerEntity.sentMessages[2].message) {
                log(`cyan`, `Spam detected from player ${playerEntity.name} sending same messages multiple times | Server ${playerEntity.serverNumber}.`);
                playerEntity.socket.emit(`showCenterMessage`, `You have been muted!`, 1);
                mutePlayer(playerEntity, `Automatically muted by server`);

                playerEntity.sentMessages = [];
                return true;
            }
        }

        if (playerEntity.sentMessages.length >= 4) {
            if (playerEntity.sentMessages[3].time - playerEntity.sentMessages[0].time <= 5e3) {
                log(`cyan`, `Spam detected from player ${playerEntity.name} sending ${charCount} characters in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
                playerEntity.socket.emit(`showCenterMessage`, `You have been muted!`, 1);
                mutePlayer(playerEntity, `Automatically muted by server`);
                playerEntity.sentMessages = [];
                return true;
            }
        }

        if (playerEntity.sentMessages.length > 4) playerEntity.sentMessages.shift();
        return false;
    } else if (now - playerEntity.lastMessageSentAt < 1e3 && now - playerEntity.lastMessageSentAt > 0 && message.length > 1) {
        if (playerEntity.sentMessages.length >= 4) {
            if (playerEntity.sentMessages[3].time - playerEntity.sentMessages[0].time < 4e3) {
                log(`cyan`, `Spam detected from player ${playerEntity.name} sending ${message.length} messages in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
                playerEntity.socket.emit(`showCenterMessage`, `You have been muted!`, 1);
                mutePlayer(playerEntity, `Automatically muted by server`);

                playerEntity.sentMessages = [];
                return true;
            }
        }
    } else if (now - playerEntity.lastMessageSentAt < 0 && message.length > 1) {
        if (playerEntity.spamCount === undefined) playerEntity.spamCount = 1;
        playerEntity.spamCount++;

        if (playerEntity.spamCount === 15) {
            log(`cyan`, `Excessive spam by player ${playerEntity.name} --> KICK | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            playerEntity.socket.emit(`showCenterMessage`, `You have been kicked for spamming!`, 1);
            playerEntity.socket.disconnect();
        }
        return true;
    } else return false;
};

let mutePlayer = (playerEntity, comment) => {
    if (playerEntity.isAdmin || playerEntity.isMod || playerEntity.isDev) return log(`yellow`, `Cannot mute staff member | Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    let mute = new Mute({
        username: playerEntity.name,
        timestamp: new Date(),
        IP: playerEntity.socket.handshake.address,
        comment
    });

    log(`cyan`, `Muting player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    mute.save(() => {
        playerEntity.isMuted = true;
        playerEntity.muteTimeout = setTimeout(() => {
            Mute.deleteOne({ username: playerEntity.name }).then(() => {
                log(`yellow`, `Unmuting player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                playerEntity.isMuted = false;
            });
        }, 3e5);
    });
};

let charLimit = (text, chars, suffix) => {
    chars = chars || 140;
    suffix = suffix || ``;
    text = (`${text}`).replace(/(\t|\n)/gi, ``).replace(/\s\s/gi, ``);

    if (text.length > chars) return text.slice(0, chars - suffix.length).replace(/(\.|\,|:|-)?\s?\w+\s?(\.|\,|:|-)?$/, suffix);
    return text;
};

exports.io = io;

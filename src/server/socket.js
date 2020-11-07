// Require modules.
const xssFilters = require(`xss-filters`);
const axios = require(`axios`);

// Crate logic.
global.cratesInSea = {
    min: 480,
    max: 1100
}

// Admin panel.
const thugConfig = require(`./thugConfig.js`);

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
const User = require(`./models/user.model`);
const Clan = require(`./models/clan.model`);
const Ban = require(`./models/ban.model`);
const Hacker = require(`./models/hacker.model`);
const PlayerRestore = require(`./models/playerRestore.model`);

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

// Timestamp shorthand for logging.
const getTimestamp = () => {
    return `${new Date().toUTCString} |`;
}

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
    mods: [`Fiftyyyyyy`, `Sloth`, `Sj`],
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
        let isIPBanned = await Ban.findOne({ ip: socket.handshake.address });
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
            let playerSave = await PlayerRestore.find({ ip: socket.handshake.address });
            if(playerStore && Date.now() - playerStore.timestamp < 3e5) {
                // Restore gold.
                playerEntity.gold = playerSave.gold;

                // Restore xp.
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
                playerEntity.damage = playerSave.damage;

                // Refund ship if captain.
                if(playerSave.isCaptain) playerEntity.gold += core.boatTypes[playerSave.shipID].price;

                // Restore item & item stats.
                if(playerSave.itemID) playerEntity.itemID = playerSave.itemID;
                playerEntity.attackSpeedBonus = playerSave.fireRateBonus;
                playerEntity.attackDistanceBonus = playerSave.distanceBonus;
                playerEntity.attackDamageBonus = playerSave.damageBonus;
                playerEntity.movementSpeedBonus = playerSave.movementSpeedBonus;

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

            // Parse the message for arguments and set the command.
            let args = msgData.message.slice(2).split(/+/g);
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
                    let msg = args[0];
                    if(!msg) return;
                    console.log(`${getTimestamp()} ADMIN SAY: ${msg} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return io.emit(`showAdminMessage`, msg);
                }
                else if(command == `recompense` && (isAdmin || isDev)) {
                    let amt = args[0];
                    if(!amt || isNaN(parseInt(amt))) return;

                    for(let i in core.players) core.players[i].gold += parseInt(amt);
                    console.log(`${getTimestamp()} ADMIN RECOMPENSED ${amt} GOLD | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                    return io.emit(`showAdminMessage`, `You have received gold recompense for server retart!`);
                }
                else if(command == `nick` && isAdmin) {
                    let nick = args[0].toString();
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
                        if(!player) return;

                        console.log(`${getTimestamp()} ADMIN WHOIS SEADOG: ${input} --> ${core.players[i].id} | IP: ${core.players[i].socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        output = core.players[i].id;
                    }
                    else {
                        let user = core.boats.find(boat => boat.crewName == user);
                        if(!user) return;

                        console.log(`${getTimestamp()} ADMIN WHOIS CAPTAIN: ${input} --> ${core.boats[i].captainID} | PLAYER NAME: ${core.players[i].name} | IP: ${core.players[i].socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                        output = core.boats[i].captainID;
                    }
                    return playerEntity.socket.emit(`showCenterMessage`, output, 4, 1e4);
                }
                else if(command == `kick` && (isAdmin || isMod)) {
                    let kickUser = args.shift();
                    let kickReason = args.join(` `);

                    let player = core.players.find(player => player.name == kickUser);
                    if(!player) return;

                    player.socket.emit(`showCenterMessage`, `You have been kicked ${kickReason ? `. Reason: ${kickReason}`: ``}`, 1, 1e4);
                }
            }
        }
    });
});
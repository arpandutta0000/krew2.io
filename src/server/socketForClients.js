let thugConfig = require(`./config/thugConfig.js`);
let config = require(`./config/config.js`);
let login = require(`./auth/login.js`);
let xssFilters = require(`xss-filters`);
let https = require(`https`);
let http = require(`http`);
let fs = require(`fs`);
let Filter = require(`bad-words`),
    filter = new Filter();
lzString = require(`./../client/assets/js/lz-string.min`);

global.maxAmountCratesInSea = config.maxAmountCratesInSea;
global.minAmountCratesInSea = config.minAmountCratesInSea;

// Utils.
let log = require(`./utils/log.js`);
let md5 = require(`./utils/md5.js`);
let {
    isSpamming,
    mutePlayer,
    charLimit
} = require(`./utils/chat.js`);
let bus = require(`./utils/messageBus.js`);

let serverStartTimestamp = Date.now();
log(`green`, `UNIX Timestamp for server start: ${serverStartTimestamp}.`);

// Additional bad words which need to be filtered
filter.addWords(...config.newBadWords);

// Configure socket
if (global.io === undefined) {
    let server = process.env.NODE_ENV == `prod` ? https.createServer({
        key: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/privkey.pem`),
        cert: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/fullchain.pem`),
        requestCert: false,
        rejectUnauthorized: false
    }) : http.createServer();

    global.io = require(`socket.io`)(server, {
        origins: `*:*`
    });
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
function isAlphaNumeric (str) {
    let code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (
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
Admins = config.admins
Mods = config.mods
Devs = config.devs


// create player in the world
// Test environment
if (TEST_ENV) {
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
    console.log(`yes`)
    let krewioData;
    let christmasGold = 0;

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
        if (playerEntity) return;
        if (!data.name) data.name = ``;

        // Check if the player IP is in the ban list.
        let isIPBanned = await Ban.findOne({
            IP: socket.handshake.address
        });
        if (isIPBanned) {
            log(`cyan`, `Detected banned IP ${socket.handshake.address} attempting to connect. Disconnecting ${data.name}.`);
            socket.emit(`showCenterMessage`, `You have been banned... Contact us on Discord`, 1, 6e4);

            socket.banned = true;
            return socket.disconnect();
        }

        // Check to see if the player is using a VPN.
        // Note: This has to be disabled if proxying through cloudflare! Cloudflare proxies are blacklisted and will not return the actual ip. 
        axios.get(`http://check.getipintel.net/check.php?ip=${socket.handshake.address.substring(7)}&contact=dzony@gmx.de&flags=f&format=json`).then(res => {
            if (!res) return log(`red`, `There was an error checking while performing the VPN check request.`)

            if (res.data && res.data.status == `success` && parseInt(res.data.result) == 1) {
                socket.emit(`showCenterMessage`, `Disable VPN to play this game`, 1, 6e4);
                log(`cyan`, `VPN connection. Disconnecting IP: ${socket.handshake.address}.`);

                // Ban the IP.
                let ban = new Ban({
                    timestamp: new Date(),
                    IP: socket.handshake.address,
                    comment: `Auto VPN temp ban`
                });
                return ban.save(err => err ? log(err) : socket.disconnect());
            }
        });

        if (!DEV_ENV) {
            // Check if cookie has been blocked.
            if (data.cookie != undefined && data.cookie != ``) {
                if (Object.values(gameCookies).includes(data.cookie)) return log(`cyan`, `Trying to spam multiple players... ${socket.handshake.address}.`);
                gameCookies[socketId] = data.cookie;
            }
        }

        // No alternate IP connection.
        let sameIPPlayerCount = 0;
        for (let i in core.players) {
            let player = core.players[i];
            if (player.socket.handshake.address == socket.handshake.address) sameIPPlayerCount++;
            if (sameIPPlayerCount > 2) {
                socket.emit(`showCenterMessage`, `Use a single tab to play this game`, 1, 6e4);
                log(`cyan`, `Multiple tabs. Disconnecting IP: ${socket.handshake.address}.`);
                return socket.disconnect();
            }
        }

        // Create player in the world.
        data.socketId = socketId;
        playerEntity = core.createPlayer(data);
        playerEntity.socket = socket;

        // Check if user is logged in, and if so, that they are coming from their last IP logged in with.
        if (!DEV_ENV && data.last_ip && !(playerEntity.socket.handshake.address.includes(data.lastip))) {
            log(`cyan`, `Player ${playerEntity.name} tried to connect from different IP than login. Kick | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            return playerEntity.socket.disconnect();
        }

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
            hacker.save(err => err ? log(`red`, err) : playerEntity.socket.disconnect());
            return;
        }

        // Only start the restore process if the server start was less than 5 minutes ago.
        if (Date.now() - serverStartTimestamp < 3e5) {
            let playerSave = await PlayerRestore.findOne({
                IP: socket.handshake.address
            });
            if (playerSave && Date.now() - playerSave.timestamp < 3e5) {
                // If username is seadog, set the name to proper seadog.
                if (playerEntity.name.startsWith(`seadog`)) playerEntity.name = playerSave.name;

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
                if (playerSave.isCaptain) playerEntity.gold += core.boatTypes[playerSave.shipID].price;

                // Restore item & item stats.
                if (playerSave.itemID) playerEntity.itemID = playerSave.itemID;
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

        let checkPlayerStatus = () => {
            if (playerEntity.parent.shipState == 1 || playerEntity.parent.shipState == 0) log(`cyan`, `Possible Exploit detected (buying from sea) ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
        }

        playerNames = {}
        for (let id in core.players) {
            let playerName = xssFilters.inHTMLData(core.players[id].name);
            playerName = filter.clean(playerName);
            playerNames[id] = playerName;
        }
        socket.emit(`playerNames`, playerNames, socketId);

        // Check if string is an integer greater than 0
        let isNormalInteger = function (str) {
            let n = ~~Number(str);
            return String(n) === str && n >= 0;
        };

        module.exports.socketEvents = {
            checkPlayerStatus,
            christmasGold,
            data,
            filter,
            gameCookies,
            isNormalInteger,
            krewioData,
            playerEntity,
            reportedIps,
        };

        const eventFiles = fs.readdirSync(`./src/server/socket`).filter(file => file.endsWith(`.js`) && !file.startsWith(`_`));
        for (const file of eventFiles) {
            const event = require(`./socket/${file}`);
            let eventName = file.split(`.`)[0];
            socket.on(eventName, event.bind(socket, null));
        }
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
        data.username = undefined;
        initSocketForPlayer(data);
    }

    // Send full world information - force full dta. First snapshot (compress with lz-string).
    socket.emit(`s`, lzString.compress(JSON.stringify(core.compressor.getSnapshot(true))));
});

let serializeId = function (id) {
    return id.substring(2, 6);
};

// emit a snapshot every 100 ms
let snapCounter = 0;
module.exports.send = () => {
    snapCounter = snapCounter > 10 ? 0 : snapCounter + 1;
    let msg;

    // if more than 10 snapShots are queued, then send the entire world's Snapshot. Otherwise, send delta
    msg = snapCounter === 10 ? core.compressor.getSnapshot(false) : core.compressor.getDelta();

    if (msg) {
        // compress snapshot data with lz-string
        msg = lzString.compress(JSON.stringify(msg));
        io.emit('s', msg);
    }
}

module.exports.io = io;
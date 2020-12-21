/* Require all needed files, utils, models, variables, etc */
const bus = require(`../utils/messageBus.js`);
const config = require(`../config/config.js`);
const log = require(`../utils/log.js`);
const login = require(`../auth/login.js`);
const md5 = require(`../utils/md5.js`);
const thugConfig = require(`../config/thugConfig`);
const xssFilters = require(`xss-filters`);
const {
    isSpamming,
    mutePlayer,
    charLimit
} = require(`../utils/chat.js`);

let User = require(`../models/user.model.js`);
let Clan = require(`../models/clan.model.js`);
let Ban = require(`../models/ban.model.js`);
let Hacker = require(`../models/hacker.model.js`);
let PlayerRestore = require(`../models/playerRestore.model.js`);

let {
    checkPlayerStatus,
    christmasGold,
    data,
    filter,
    gameCookies,
    isNormalInteger,
    krewioData,
    playerEntity,
    reportedIps,
} = require(`../socketForClients.js`).socketEvents;



/* Event fired when a player respawns */
module.exports = (socket, callback) => {
    if (playerEntity.parent.hp >= 1) return log(`cyan`, `Player ${playerEntity.name} tried to respawn while his boat still has health | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    // Check for timestamp of last respawn and ban if it was less than 2 seconds ago.
    if (socket.timestamp != undefined && Date.now() - socket.timestamp < 2e3) {
        log(`cyan`, `Exploit detected: multiple respawn | Player: ${playerEntity.name} | Adding IP ${playerEntity.socket.handshake.address} to bannedIPs | Server: ${playerEntity.serverNumber}.`);
        if (playerEntity.socket.handshake.address.length > 5) {
            let ban = new Ban({
                IP: socket.handshake.address,
                comment: `Exploit: multiple respawn`
            });
            ban.save(err => err ? log(`red`, err) : playerEntity.socket.disconnect());
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
}
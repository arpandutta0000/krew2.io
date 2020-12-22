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



/* Allocates points to a player */
module.exports = (socket, points, callback) => {
    // Check amount of already allocated points.
    let countPoints = 0;
    for (let i in playerEntity.points) countPoints += playerEntity.points[i];

    // Validate the player's stats.
    if (countPoints > 50) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
    if (playerEntity.availablePoints > 50) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);

    // Check if player has available points and if he has already allocated 51 points.
    if (playerEntity && playerEntity.parent && playerEntity.availablePoints > 0 && playerEntity.availablePoints <= 50 && countPoints < 51) {
        log(`magenta`, `Points allocated: `, points, ` | Overall allocated points: ${countPoints + 1} | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);

        let countAllocatedPoints = 0;
        for (let i in points) {
            let point = points[i];
            countAllocatedPoints += point;

            if (point < 0 || !Number.isInteger(point) || !(i == `fireRate` || i == `distance` || i == `damage`) || countAllocatedPoints > 1) log(`cyan`, `Exploit detected: stats hacking | Player: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
            else if (point != undefined && typeof point == `number` && playerEntity.availablePoints > 0 && point <= playerEntity.availablePoints) {
                playerEntity.points[i] += point;
                playerEntity.availablePoints -= point;
            }
        }

        playerEntity.updateExperience();
        callback && callback.call && callback(undefined);
    }
    callback && callback.call && callback(`Oops, it seems that you don't have a boat.`);
}
/* Require all needed files, utils, models, variables, etc */
const bus = require(`../utils/messageBus.js`);
const config = require(`../config/config.js`);
const log = require(`../utils/log.js`);
const login = require(`../auth/login.js`);
const md5 = require(`../utils/md5.js`);
const thugConfig = require(`../config/thugConfig`);
const xssFilters = require(`xss-filters`);

let User = require(`./models/user.model.js`);
let Clan = require(`./models/clan.model.js`);
let Ban = require(`./models/ban.model.js`);
let Hacker = require(`./models/hacker.model.js`);
let PlayerRestore = require(`./models/playerRestore.model.js`);

let {
    checkPlayerStatus,
    christmasGold,
    data,
    filter,
    gameCookies,
    initSocketForPlayer,
    krewIoData,
    msgData,
    playerEntity,
    reportedIps,
    server
} = require(`../socketForClients.js`);



/* Gather all stats and return them to the client */
module.exports = (socket, fn) => {
    let stats = {
        shipsSank: playerEntity.shipsSank,
        shotsFired: playerEntity.shotsFired,
        shotsHit: playerEntity.shotsHit,
        shotAccuracy: playerEntity.shotsHit / playerEntity.shotsFired,
        overall_cargo: playerEntity.overall_cargo,
        crewOverallCargo: playerEntity.parent.overall_cargo,
        overallKills: playerEntity.parent.overallKills
    }
    return fn(JSON.stringify(stats));
}
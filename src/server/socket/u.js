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

import {
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
} from `../socketForClients.js`;



/* Get Snapshot */
module.exports = (socket, u) => {
    playerEntity.parseSnap(data);
}
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
let PlayerRestore = require(`.,/models/playerRestore.model.js`);

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



/* If a player locks their krew */
module.exports = (socket, lockBool) => {
    if (playerEntity.isCaptain && lockBool) {
        playerEntity.parent.isLocked = true;
        playerEntity.parent.recruiting = false;
    } else if (playerEntity.isCaptain && !lockBool) {
        playerEntity.parent.isLocked = false;
        if (playerEntity.parent.shipState == 2 || playerEntity.parent.shipState == 3 || playerEntity.parent.shipState == 4) playerEntity.parent.recruiting = true;
    }
}
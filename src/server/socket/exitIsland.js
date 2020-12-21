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
    ,
    krewioData,
    playerEntity,
    reportedIps,
} = require(`../socketForClients.js`).socketEvents;



/* If a player decides to leave an island */
module.exports = (socket, data) => {
    let boat = playerEntity.parent;

    // If captains ends to exit island request.
    if (playerEntity && playerEntity.parent && playerEntity.parent.captainId == playerEntity.id) {
        boat.exitIsland();

        for (let i in boat.children) {
            let player = boat.children[i];
            if (player != undefined && player.netType == 0) {
                player.socket.emit(`exitIsland`, {
                    captainId: boat.captainId
                });
                player.sentDockingMsg = false;
            }
        }
    }
}
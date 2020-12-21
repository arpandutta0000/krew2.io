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



/* Gets goods in shop */
module.exports = (socket, callback) => {
    if (playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId) {
        if (core.entities[playerEntity.parent.anchorIslandId] == undefined) return callback && callback.call && callback(`Oops, it sems you don't have an anchored boat.`);
    }

    let data = {
        cargo: core.boatTypes[playerEntity.parent.shipclassId].cargoSize,
        gold: playerEntity.gold,
        goods: playerEntity.goods,
        goodsPrice: core.entities[playerEntity.parent.anchorIslandId] ? core.entities[playerEntity.parent.anchorIslandId].goodsPrice : 0,
        cargoUsed: 0
    }

    for (let i in playerEntity.parent.children) {
        let child = playerEntity.parent.children[i];
        if (child && child.netType == 0 && core.entities[child.id] != undefined) {
            let cargoUsed = 0;
            for (let i in child.goods) cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
            data.cargoUsed += cargoUsed;

            if (core.entities[child.id]) core.entities[child.id].cargoUsed = cargoUsed;
        }
        callback && callback.call && callback(undefined, data);
    }
    callback && callback.call && callback(`Oops, it seems you don't have an anchored boat.`);
}
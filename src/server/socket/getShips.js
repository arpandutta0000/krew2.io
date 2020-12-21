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



/* Get ships in shop */
module.exports = (socket, callback) => {
    if (playerEntity && playerEntity.parent) {
        let ships = {}
        let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

        if (!island || island.netType != 5) return (callback && callback.call && callback(`Oops, it seems you are not at an island.`));

        let cargoUsed = 0;
        for (let i in playerEntity.goods) cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
        playerEntity.cargoUsed = cargoUsed;

        for (let i in core.boatTypes) {
            if ((!island.onlySellOwnShips && (core.boatTypes[i].availableAt == undefined || core.boatTypes[i].availableAt.indexOf(island.name) != -1)) ||
                (core.boatTypes[i].availableAt && core.boatTypes[i].availableAt.indexOf(island.name) != -1)) {
                ships[i] = core.boatTypes[i];
                ships[i].purchasable =
                    playerEntity.gold >= ships[i].price &&
                    ships[i].cargoSize >= playerEntity.cargoUsed;
            }
        }
        callback && callback.call && callback(undefined, ships);
    }
    callback && callback.call && callback(`Oops, it seems you don't have a boat.`);
}
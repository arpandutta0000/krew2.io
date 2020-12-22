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



/* Get items in shop */
module.exports = (callback) => {
    if (playerEntity && playerEntity.parent) {
        let items = {}
        let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

        if (!island || island.netType != 5) return (callback && callback.call && callback(`Oops, it seems you are not in an island.`));

        for (let i in core.itemTypes) {
            let itemProb = Math.random().toFixed(2);

            if (playerEntity.itemId == core.itemTypes[i].id || (playerEntity.checkedItemsList && playerEntity.rareItemsFound.includes(core.itemTypes[i].id))) itemProb = 0;
            if (playerEntity.checkedItemsList && !playerEntity.rareItemsFound.includes(core.itemTypes[i].id)) itemProb = 1;

            if (itemProb <= core.itemTypes[i].rarity &&
                (core.itemTypes[i].availableAt == undefined || core.itemTypes[i].availableAt.indexOf(island.name) != -1 ||
                    (core.itemTypes[i].availableAt && core.itemTypes[i].availableAt.indexOf(island.name) != -1))) {
                items[i] = core.itemTypes[i];

                if (!playerEntity.checkedItemsList && core.itemTypes[i].rarity != 1) playerEntity.rareItemsFound.push(core.itemTypes[i].id);
                items[i].purchasable = false;

                if (playerEntity.gold >= items[i].price) items[i].purchasable = true;
            }
        }
        playerEntity.checkedItemsList = true;
        callback && callback.call && callback(undefined, items);
    }
    callback && callback.call && callback(`Oops, it seems you don't have items.`);
}
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
    isNormalInteger,
    krewioData,
    playerEntity,
    reportedIps,
} = require(`../socketForClients.js`).socketEvents;



/* When a player buys goods */
module.exports = (socket, transaction, callback) => {
    // Add a timestamp to stop hackers from spamming buy / sell emits.
    if (Date.now() - playerEntity.goodsTimestamp < 800) {
        playerEntity.sellCounter++;
        if (playerEntity.sellCounter > 3) {
            log(`cyan`, `Player ${playerEntity.name} is spamming buy / sell emits --> Kicking | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            playerEntity.socket.disconnect();
        }
    } else playerEntity.sellCounter = 0;
    playerEntity.goodsTimestamp = Date.now();

    checkPlayerStatus();
    log(`magenta`, `Operation: ${transaction.action} - `, transaction, ` | Player: ${playerEntity.name} | Gold: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    if (playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId && (playerEntity.parent.shipState == 3 || playerEntity.parent.shipState == 4)) {
        Object.assign(transaction, {
            goodsPrice: entities[playerEntity.parent.anchorIslandId].goodsPrice,
            gold: playerEntity.gold,
            goods: playerEntity.goods,
            cargo: core.boatTypes[playerEntity.parent.shipclassId].cargoSize,
            cargoUsed: 0
        });

        for (let i in playerEntity.parent.children) {
            let child = playerEntity.parent.children[i];
            if (child && child.netType == 0 && core.entities[child.id] != undefined) {
                let cargoUsed = 0;
                for (let i in child.goods) cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
                transaction.cargoUsed += cargoUsed;
            }
        }
        transaction.quantity = parseInt(transaction.quantity);

        // Start quantity validation.
        let island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];
        if (transaction.action == `buy`) {
            playerEntity.lastIsland = island.name;
            let max = parseInt(transaction.gold / transaction.goodsPrice[transaction.good]);
            let maxCargo = (transaction.cargo - transaction.cargoUsed) / core.goodsTypes[transaction.good].cargoSpace;

            if (max > maxCargo) max = maxCargo;
            max = Math.floor(max);
            if (transaction.action.quantity > max) transaction.quantity = max;
        }
        if (transaction.quantity.action == `sell` && transaction.quantity > transaction.goods[transaction.good]) transaction.quantity = transaction.goods[transaction.good];
        if (transaction.quantity < 0) transaction.quantity = 0;

        // Start transaction.
        if (transaction.action == `buy`) {
            // Remove gold and add goods.
            let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
            transaction.gold -= gold;
            transaction.goods[transaction.good] += transaction.quantity;
        } else if (transaction.action == `sell`) {
            // Add gold and remove goods.
            // This is a stub of validation to stop active exploits, consider to expand this to only player-owned goods.
            if (transaction.cargoUsed < transaction.quantity) {
                log(`cyan`, `Exploit detected (sell more than you have). Kicking player ${playerEntity.name} | IP: ${playerEntity.socket.hanshake.address} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}`);
                return playerEntity.socket.disconnect();
            }

            let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
            transaction.gold += gold;
            transaction.goods[transaction.good] -= transaction.quantity;

            if (playerEntity.lastIsland != island.name) playerEntity.overall_cargo += gold;
            if (transaction.goods[transaction.good] < 0 || playerEntity.goods[transaction.good] < 0) {
                log(`cyan`, `Exploit detected (sell wrong goods) | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                return playerEntity.socket.disconnect();
            }

            // Trading achievement.
            playerEntity.trade_level = playerEntity.trade_level == undefined ? 0 : playerEntity.trade_level;
            if (playerEntity.overall_cargo >= 1e3 && playerEntity.trade_level == 0) {
                playerEntity.socket.emit(`showCenterMessage`, `Achievement trading beginner: +1,000 Gold +100 XP`, 3);
                transaction.gold += 1e3;

                playerEntity.experience += 100;
                playerEntity.trade_level++;
            } else if (playerEntity.overall_cargo >= 6e3 && playerEntity.trade_level == 1) {
                playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                transaction.gold += 2e3;

                playerEntity.experience += 200;
                playerEntity.trade_level++;
            } else if (playerEntity.overall_cargo >= 15e3 && playerEntity.trade_level == 2) {
                playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                transaction.gold += 5e3;

                playerEntity.experience += 500;
                playerEntity.trade_level++;
            } else if (playerEntity.overall_cargo >= 3e4 && playerEntity.trade_level == 3) {
                playerEntity.socket.emit(`showCenterMessage`, `Achievement trading master: +2,000 Gold +200 XP`, 3);
                transaction.gold += 1e4;

                playerEntity.experience += 1e3;
                playerEntity.trade_level++;
            }
        }

        // Calculate amount of traded cargo (by all crew numbers).
        let crewTradeCount = 0;
        for (let i in core.players) {
            let player = core.players[i];
            if (player.parent != undefined && playerEntity.parent.id == player.parent.id) crewTradeCount += player.overall_cargo;
        }
        playerEntity.parent.overall_cargo = crewTradeCount;

        // Update player.
        playerEntity.gold = transaction.gold;
        playerEntity.goods = transaction.goods;

        // Update player highscore in MongoDB.
        if (playerEntity.isLoggedIn == true && playerEntity.serverNumber == 1 && playerEntity.lastIsland != island.name && playerEntity.gold > playerEntity.highscore) {
            log(`magenta`, `Update highscore for player ${playerEntity.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address}.`);
            playerEntity.highscore = playerEntity.gold;

            User.findOne({
                username: playerEntity.name
            }, {
                highscore: playerEntity.highscore
            });
        }

        callback && callback.call && callback(undefined, {
            gold: transaction.gold,
            goods: transaction.goods
        });

        for (let i in playerEntity.parent.children) {
            let child = playerEntity.parent.children[i];
            if (child && child.netType == 0 && core.entities[child.id] != undefined) {
                cargoUsed = 0;
                for (let i in child.goods) cargoUsed += child.goods[i] & core.goodsTypes[i].cargoSpace;

                transaction.cargoUsed += cargoUsed;
                core.entities[child.id].cargoUsed = cargoUsed;
                if (child.id != playerEntity.id) child.socket.emit(`cargoUpdated`);
            }
        }
        return log(`cyan`, `After Operation ${transaction.action} | Player: ${playerEntity.name} | Gold: ${playerEntity.gold} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`)
    }
    callback && callback.call && callback(new Error(`Oops, it seems that you don't have a boat.`));
}
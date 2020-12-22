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



/* When a player buys an item */
module.exports = (socket, callback) => {
    checkPlayerStatus();
    log(`magenta`, `Player ${playerEntity.name} is buying `, item, ` while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    // Check if id is an integer > 0.
    if (!isNormalInteger(item.id)) return;

    // Ship
    if (item.type == 0 && playerEntity.parent.shipState != 4) {
        if (playerEntity) {
            let ships = {}

            let cargoUsed = 0;
            for (let i in playerEntity.goods) cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
            playerEntity.cargoUsed = cargoUsed;

            // Put together item.id and item.type and send them back to the client.
            let response = item.type + item.id;
            callback(response);

            playerEntity.otherQuestLevel = playerEntity.otherQuestLevel == undefined ? 0 : playerEntity.otherQuestLevel;

            // Give the rewards for the quests.
            if (playerEntity.gold >= core.boatTypes[item.id].price) {
                let questLists = [
                    [`04`, `05`, `06`, `07`, `015`, `016`], // Trader or boat.
                    [`08`, `09`, `010`, `012`, `013`, `018`, `019`], // Destroyer, calm spirit, or royal fortune.
                    [`014`, `020`] // Queen Barb's Justice
                ]

                if (questLists[0].includes(response) && playerEntity.otherQuestLevel == 0) {
                    playerEntity.socket.emit(`showCenterMessage`, `Achievement: Peaceful Sailor: +5,000 Gold & 500 XP`)
                    playerEntity.gold += 5e3;
                    playerEntity.experience += 500;
                    playerEntity.otherQuestLevel++;
                }
                if (questLists[1].includes(response) && playerEntity.otherQuestLevel == 0) {
                    playerEntity.socket.emit(`showCenterMessage`, `Achievement: Peaceful Sailor: +10,000 Gold & 1,000 XP`)
                    playerEntity.gold += 1e4;
                    playerEntity.experience += 1e3;
                    playerEntity.otherQuestLevel++;
                }
                if (questLists[2].includes(response) && playerEntity.otherQuestLevel == 0) {
                    playerEntity.socket.emit(`showCenterMessage`, `Achievement: Peaceful Sailor: +50,000 Gold & 5,000 XP`)
                    playerEntity.gold += 5e4;
                    playerEntity.experience += 5e3;
                    playerEntity.otherQuestLevel++;
                }
            }
            playerEntity.purchaseShip(item.id, (krewioData || {}).krewname);

            // Calculate other quest level of captain.
            for (let i in core.players) {
                let player = core.players[i];
                if (otherPlayer.parent != undefined && playerEntity.parent.id == player.parent.id && player.isCaptain) playerEntity.parent.otherQuestLevel = otherQuestLevel;
            }
            playerEntity.parent.otherQuestLevel = otherQuestLevel;
        }
    } else if (item.type == 1) {
        // Item.
        callback(item.id);

        // Check conditions for buying demolisher.
        if (item.id == `11` && playerEntity.gold >= 1e5) {
            if (playerEntity.overall_cargo >= 1e3 && playerEntity.shipsSank >= 10) {
                playerEntity.purchaseItem(item.id);
                log(`magenta`, `Player ${playerEntity.name} is buying item`, item, ` (Demolisher) while having ${Math.floor(playerEntity.gold)} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            }
        } else if (item.id == `14` && playerEntity.gold >= 15e4) {
            // Player can buy this item only once.
            if (!playerEntity.statsReset) {
                // Reset stats.
                for (let i in playerEntity.points) playerEntity.points[i] = 0;
                playerEntity.availablepoints = playerEntity.level;
                playerEntity.statsReset = true;
                playerEntity.purchaseItem(item.id);
                log(`magenta`, `Player ${playerEntity.name} is buying item `, item, ` (Fountain of Youth) while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            }
        } else {
            playerEntity.purchaseItem(item.id);
            log(`magenta`, `Player ${playerEntity.name} is buying item `, item, ` while having ${Math.floor(playerEntity.gold)} gold | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
        }
    }

    // Recalculate amount of killed ships and traded cargo (by all crew members).
    let crewKillCount = 0;
    let crewTradeCount = 0;

    for (let i in core.players) {
        let player = core.players[i];
        if (player.parent != undefined && playerEntity.parent.id == player.parent.id) {
            crewKillCount += player.shipsSank;
            crewTradeCount += player.overall_cargo;
        }
    }
    playerEntity.parent.overallKills = crewKillCount;
    playerEntity.parent.overall_cargo = crewTradeCount;
}
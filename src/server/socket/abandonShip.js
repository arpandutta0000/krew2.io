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



/* If a player abandons ship */
module.exports = (data) => {
    let motherShip = playerEntity.parent;

    // Only non-captains can abandon ship.
    if (motherShip) {
        if (motherShip.captainId != playerEntity.id) {
            if (motherShip.shipState == 0) {
                let boat = core.createBoat(playerEntity.id, (krewioData || {}).krewname, false);
                boat.addChildren(playerEntity);
                boat.setShipClass(0);
                boat.exitMotherShip(motherShip);
                boat.speed += parseFloat((playerEntity.movementSpeedBonus) / 10);
                boat.updateProps();
                boat.shipState = 0;
            } else entities[motherShip.anchorIsland] && entities[motherShip.anchorIslandId].addChildren

            // Delete him from the previous krew.
            delete motherShip.children[playerEntity.id];
            motherShip.updateProps && motherShip.updateProps();

            // Recaulcualte amount of killed ships (by all crew members).
            let crewKillCount = 0;
            let crewTradeCount = 0;

            for (let i in core.players) {
                let player = core.players[i];
                if (player.parent != undefined && motherShip.id == player.parent.id) {
                    crewKillCount += player.shipsSank;
                    crewTradeCount += player.overall_cargo;
                }
            }
            motherShip.overallKills = crewKillCount;
            motherShip.overall_cargo = crewTradeCount;
        }
    }
}
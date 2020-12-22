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



/* If a player kicks a krew member */
module.exports = (playerId) => {
    let player = core.players[playerId];

    if (player) {
        let motherShip = player.parent;

        if (motherShip) {
            // Only captains can boot.
            if (motherShip.captainId == playerEntity.id && playerEntity.id != player.id) {
                if (motherShip.shipState == 0) {
                    let boat = core.createBoat(player.id, (krewioData || {}).krewname, false);
                    boat.setShipClass(0);
                    boat.addChildren(player);
                    boat.exitMotherShip(motherShip);

                    boat.speed += parseFloat(playerEntity.movementSpeedBonus / 10);
                    boat.turnspeed += parseFloat((0.05 * playerEntity.movementSpeedBonus) / 10);
                } else entities[motherShip.anchorIsland] && entities[motherShip.anchorIslandId].addChildren(player);

                // Delete the player from the previous krew.
                delete motherShip.children[playerId];
                motherShip.updateProps();

                // Recalcualte amount of killed ships (by all crew members).
                let crewKillCount = 0;
                let crewTradeCount = 0;

                for (let i in core.players) {
                    let player = core.players[i];
                    if (player.parent != undefined && motherShip.id == otherPlayer.parent.id) {
                        crewKillCount += player.shipsSank;
                        crewTradeCount += player.overall_cargo;
                    }
                }
                motherShip.overallKills = crewKillCount;
                motherShip.overall_cargo = crewOverallCargo;
            }
        }
    }
}
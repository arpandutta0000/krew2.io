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



/* If a player decides to depart from an island */
module.exports = (socket, departureCounter) => {
    // Check if player who sends exitIsland command is docked at island.
    if (playerEntity.parent.anchorIslandId == undefined) log(`cyan`, `Exploit detected (docking at sea). Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
    else {
        // Check if player has already clicked sail button. If yes, do nothing.
        if (playerEntity.parent.shipState == 3) {
            for (let i in core.players) {
                let player = core.players[i];
                if (player && player.parent && ((player.parent.netType == 1 && player.parent.anchorIslandId == playerEntity.parent.anchorIslandId) ||
                        (player.parent.netType == 5 && player.parent.id == playerEntity.parent.anchorIslandId))) {
                    if (player.parent.id != playerEntity.parent.id) {
                        // If conditions are fulfilled and parent.id is not my parent.id, let the krew list button glow.
                        player.socket.emit(`departureWarning`);
                    }
                }
            }

            if (playerEntity && playerEntity.parent && playerEntity.parent.captainId == playerEntity.id) {
                let boat = playerEntity.parent;
                boat.shipState = 4;
                boat.lastMoved = new Date();
                boat.recruiting = true;
                boat.dock_countdown = undefined;

                if (departureCounter == 1) {
                    boat.departureTime = 25;
                    for (let i in boat.children) {
                        let player = boat.children[i];
                        if (player != undefined && player.netType == 0) player.socket.emit(`showAdinPlayCentered`); // Better way of implementing ads? Players can bypass this.
                    }
                }
            }
        }
    }
}
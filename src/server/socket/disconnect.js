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



/* Fired when player disconnects from the game */
module.exports = async (data) => {
    log(`magenta`, `Player ${playerEntity.name} disconnected from the game | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
    if (!DEV_ENV) delete gameCookies[playerEntity.id];

    if (playerEntity.isLoggedIn && playerEntity.serverNumber == 1 && playerEntity.gold > playerEntity.highscore) {
        log(`magenta`, `Update highscore for player: ${playerEntity.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${playerEntity.gold} | IP: ${player.socket.handshake.address}`);
        playerEntity.highscore = playerEntity.gold;

        await User.updateOne({
            name: playerEntity.name
        }, {
            highscore: playerEntity.gold
        });
    }

    if (playerEntity.parent.netType == 1 && (playerEntity.parent.shipState != 4 || playerEntity.parent.shipState != 3) && playerEntity.isCaptain && Object.keys(playerEntity.parent.children).length == 1 && playerEntity.parent.hp < playerEntity.parent.maxHp) {
        log(`magenta`, `Player ${playerEntity.name} tried to chicken out --> Ghost ship | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

        // Lower the boat HP and remove it from the game.
        playerEntity.parent.hp = 1;
        setTimeout(() => {
            core.removeEntity(playerEntity);
            playerEntity.parent.updateProps();
            core.removeEntity(playerEntity.parents);
        }, 15e3);
    } else {
        core.removeEntity(playerEntity);

        if (playerEntity && playerEntity.parent) {
            // Delete the player entry from the boat.
            delete playerEntity.parent.children[playerEntity.id];

            // If the player was on a boat, physically delete it from the boat.
            if (playerEntity.parent.netType == 1) {
                playerEntity.parent.updateProps();
                if (Object.keys(playerEntity.parent.children).length == 0) core.removeEntity(playerEntity.parent);
            }
        }
    }
}
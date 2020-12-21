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



/* When a clan marker is made */
module.exports = (socket, data) => {
    if (playerEntity.clan != `` && playerEntity.clan != undefined) {
        if (playerEntity.markermapCount < new Date - 5e3) {
            if (data.x && data.y && typeof data.x == `number` && typeof data.y == `number` && data.x > 0 && data.y > 0 && data.x < worldsize && data.y < worldsize) {
                playerEntity.markerMapCount = new Date();
                let clan = playerEntity.clan;
                for (let i in entities) {
                    if (entities[i].netType == 0 && entities[i].clan == clan) {
                        entities[i].socket.emit(`chat message`, {
                            playerId: playerEntity.id,
                            playerName: playerEntity.name,
                            recipient: `clan`,
                            message: `Attention to the map!`
                        });
                        entities[i].socket.emit(`clanMarker`, data);
                    }
                }
            }
        }
    }
}
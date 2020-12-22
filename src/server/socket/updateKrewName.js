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
    socketData,
    filter,
    gameCookies,
    isNormalInteger,
    krewioData,
    playerEntity,
    reportedIps,
} = require(`../socketForClients.js`).socketEvents;

// Socket

/* When a user changes their name */
module.exports = (name) => {
    // Do not allow any form of brackets in the name.
    name = name.replace(/[\[\]{}()/\\]/g, ``);

    if (name != null && name.length > 1) {
        if (name.length > 60) {
            log(`cyan`, `Exploit detected (crew name length). Player ${playerEntity.name} kicked | Adding IP ${playerEntity.socket.handshake.address} to the ban list | Server ${playerEntity.serverNumber}.`);
            if (playerEntity.socket.handshake.address.length > 5) {
                let ban = new Ban({
                    ip: socket.handshake.address,
                    comment: `Exploit: crew name length`
                });
                return ban.save(err => err ? log(`red`, err) : playerEntity.socket.disconnect());
            }
        }

        // Filter the ship name.
        name = xssFilters.inHTMLData(name);
        name = filter.clean(name);
        name = name.substring(0, 20);

        log(`magenta`, `Update krew name: ${name} | Player name: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

        // Make sure that the player is the captain of the krew.
        if (core.boats[playerEntity.parent.id] != undefined && playerEntity && playerEntity.parent && playerEntity.parent.captainId == playerEntity.id) {
            if (krewioData) krewioService.save(krewioData.user, {
                krewname: name
            }).then(data => krewioData = data);
            core.boats[playerEntity.parent.id].crewName = name;
        }
    }
}
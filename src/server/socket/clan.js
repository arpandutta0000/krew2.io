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



/* Clan event */
module.exports = async (socket, player, callback) => {
    // Only logged in players can perform clan actions.
    if (!playerEntity.isLoggedIn) return log(`cyan`, `Exploit: Player ${playerEntity.name} tried clan action without login | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    // Get the user performing the action.
    let user = await User.findOne({
        name: playerEntity.name
    });

    // If player has a clan.
    if (playerEntity.clan && playerEntity.clan != ``) {
        // Get the clan from MongoDB.
        let clan = await Clan.findOne({
            clan: user.clan
        });

        // Actions for all members.
        if (action == `getClanData`) {
            let clanMemberDocs = await User.find({
                clan: clan.name
            });
            let clanRequestDocs = await User.find({
                clanRequest: clan.name
            });

            let clanMembers = [];
            let clanRequests = [];

            // Only push members to the members list (to prevent duplicates).
            for (const document of clanMemberDocs) {
                if (!clan.leader.includes(document.name) && !clan.owners.includes(document.name) && !clan.assistants.includes(document.name)) clanMembers.push(document.name)
            }
            for (const document of clanRequestDocs) {
                clanRequests.push(document.name)
            }

            let clanData = {
                name: clan.name,
                leader: clan.leader,
                owners: clan.owners,
                assistants: clan.assistants,
                members: clanMembers,
                requests: clanRequests
            }
            return callback(clanData);
        } else if (action == `leave`) {
            // If he is the only person in the clan, delete the clan.
            let clanMembers = await User.find({
                clan: playerEntity.clan
            });
            if (clan.leader == playerEntity.name && clanMembers.length == 1) clan.delete(err ? log(`red`, err) : log(`magenta`, `CLAN DELETED | Leader ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`));
            else {
                for (let i in core.players) {
                    let player = core.players[i];
                    if (player.clan == clan.name) player.socket.emit(`showCenterMessage`, `${playerEntity.name} has left your clan.`, 1, 5e3);
                }
            }

            // Dereference the player's clan.
            playerEntity.clan = ``;
            user.clan = ``;

            user.save(err => err ? log(`red`, err) : playerEntity.socket.emit(`showCenterMessage`, `You left clan [${clan.name}]`, 1, 5e3));
            log(`magenta`, `CLAN LEFT | Player ${playerEntity.name} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            return callback(true);
        }

        // From this point on there should be a player passed to the emit.
        if (player && playerEntity.clanLeader || playerEntity.clanOwner || playerEntity.clanAssistant) {
            let otherUser = User.findOne({
                name: player
            });
            let otherPlayer = Object.values(core.players).find(entity => entity.name == player);

            // If the player is nonexistent or is not in the same clan.
            if (!otherUser) return log(`red`, `CLAN UPDATE ERROR | Player ${playerEntity.name} tried to update nonexistent player ${otherPlayer} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
            else if (action != `accept` && otherUser.clan != user.clan) return log(`red`, `CLAN UPDATE ERROR | Player ${playerEntity.name} tried to update player  ${otherPlayer} | Clan: ${clan.name} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);

            // Actions for leader / owners / assistants.
            if (action == `accept`) {
                // If player is not in a clan and is currently requesting to join this clan.
                if (otherUser.clan == `` && otherUser.clanRequest == clan.name && otherPlayer.clan == ``) {} else return callback(false);
            }

            if (playerEntity.clanLeader || playerEntity.clanOwner) {
                // Actions for leader / owners.
                if (action == `promote`) {
                    if (playerEntity.clanLeader && !clan.owners.includes(player) && clan.assistants.includes(player)) {
                        // Only clan leaders can promote to owner.
                        clan.owners.push(player);
                        clan.assistants.splice(clan.assistants.indexOf(player), 1);
                        callback(true);
                    } else if (playerEntity.clanLeader || playerEntity.clanOwner && !clan.assistants.includes(player)) {
                        // Only clan leaders / clan owners can promote to assistant.
                        clan.assistants.push(player);
                        callback(true);
                    }
                    clan.save(err => err ? log(`red`, err) : callback(false));
                } else if (action == `demote`) {} else if (action == `kick`) {}
            }
        }
    } else {
        if (action == `create`) {} else if (action == `request`) {}
    }
}
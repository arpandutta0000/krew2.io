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

/* Message Handler */
module.exports = async (msgData) => {
    // Catch client modifications.
    if (!msgData.message || !msgData.recipient || typeof msgData.message != `string` || typeof msgData.recipient != `string`) return;
    if (msgData.message.length < 1) return;

    // Check for spam.
    if (msgData.message.length > 65 && !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
        log(`cyan`, `Exploit detected (spam). Player: ${playerEntity.name} Adding IP ${playerEntity.socket.handshake.address} to banned IPs | Server ${playerEntity.serverNumber}.`);
        log(`cyan`, `Spam message: ${msgData.message}`);

        let ban = new Ban({
            timestamp: new Date(),
            IP: playerEntity.socket.handshake.address,
            comment: `Auto chat spam temp ban`
        });
        ban.save(err => err ? log(`red`, err) : playerEntity.socket.disconnect());
    }

    // Staff commands.
    if ((msgData.message.startsWith(`//`) || msgData.message.startsWith(`!!`)) && playerEntity.isLoggedIn) {
        // If the player is not a staff member, disregard the command usage.
        if (!Admins.includes(playerEntity.name) && !Mods.includes(playerEntity.name) && !Devs.includes(playerEntity.name)) return;

        // Respective prefixes.
        if (msgData.message.startsWith(`!!`) && !Admins.includes(playerEntity.name) && !Devs.includes(playerEntity.name)) return;
        if (msgData.message.startsWith(`//`) && !Mods.includes(playerEntity.name)) return;

        // Parse the message for arguments and set the command.
        let args = msgData.message.toString().slice(2).split(` `);
        let command = args.shift();

        // If the user has not authenticated, only give them access to login command.
        if (!playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
            let pwd = await md5(args[0]);
            if (command == `login`) {
                let isAdmin = thugConfig.Admins[playerEntity.name] == pwd;
                let isMod = thugConfig.Mods[playerEntity.name] == pwd;
                let isDev = thugConfig.Devs[playerEntity.name] == pwd;

                // Log the player login and send them a friendly message confirming it.
                log(!isAdmin && !isMod && !isDev ? `cyan` : `blue`, `${isAdmin ? `ADMIN`: isMod ? `MOD`: isDev ? `DEV`: `IMPERSONATOR`} ${(isAdmin || isMod || isDev ? `LOGGED IN`: `TRIED TO LOG IN`)}: ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`)
                if (isAdmin || isMod || isDev) playerEntity.socket.emit(`showCenterMessage`, `Logged in succesfully`, 3, 1e4);

                // Authenticate the player object as privileged user.
                isAdmin ? playerEntity.isAdmin = true : isMod ? playerEntity.isMod = true : isDev ? playerEntity.isDev = true : null;
            }
        } else {
            let isAdmin = playerEntity.isAdmin;
            let isMod = playerEntity.isMod;
            let isDev = playerEntity.isDev;

            // Staff commands after authentication.
            if (command == `say`) {
                let msg = args.join(` `);
                if (!msg) return;

                log(`blue`, `ADMIN SAY: ${msg} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                return io.emit(`showAdminMessage`, msg);
            } else if (command == `recompense` && (isAdmin || isDev)) {
                let amt = args[0];

                if (!amt || isNaN(parseInt(amt))) return;
                for (const player of core.players) {
                    player.gold += parseInt(amt)
                }

                log(`blue`, `ADMIN RECOMPENSED ${amt} GOLD | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                return io.emit(`showAdminMessage`, `You have been recompensed for the server restart!`);
            } else if (command == `nick` && isAdmin) {
                let nick = args[0];
                if (!nick) {
                    playerEntity.name = nick;
                    return log(`blue`, `ADMIN NICK: ${nick} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                }
            } else if (command == `whois` && isAdmin) {
                let user = args[0];
                let output = `That player does not exist.`;
                if (user.startsWith(`seadog`)) {
                    let player = Object.values(core.players).find(player => player.name == user);
                    if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                    log(`blue`, `ADMIN WHOIS SEADOG: ${input} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    output = player.id;
                } else {
                    let player = core.boats.find(boat => boat.crewName == user);
                    if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                    log(`blue`, `ADMIN WHOIS CAPTAIN: ${input} --> ${player.captainId} | PLAYER NAME: ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    output = player.captainId;
                }
                return playerEntity.socket.emit(`showCenterMessage`, output, 4, 1e4);
            } else if (command == `kick` && (isAdmin || isMod)) {
                let kickUser = args.shift();
                let kickReason = args.join(` `);

                let player = Object.values(core.players).find(player => player.name == kickUser);
                if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                if (!kickReason || kickReason == ``) kickReason == `No reason specified`;

                player.socket.emit(`showCenterMessage`, `You have been kicked ${kickReason ? `. Reason: ${kickReason}`: ``}`, 1, 1e4);
                playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);

                log(`blue`, `${isAdmin ? `ADMIN`: `MOD`} KICK: | Player name: ${playerEntity.name} | ${kickReason} | IP: ${player.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                return player.socket.disconnect();
            } else if (command == `ban` && (isAdmin || isMod)) {
                let banUser = args.shift();
                let banReason = args.join(` `);

                let player = Object.values(core.players).find(player => player.name == banUser);
                if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                if (!banReason || banReason == ``) banReason == `No reason specified`;

                let ban = new Ban({
                    IP: player.socket.handshake.address,
                    comment: banReason
                });

                ban.save(err => err ? log(`red`, err) : () => {
                    player.socket.disconnect();
                    playerEntity.socket.emit(`showCenterMessage`, `You permanently banned ${player.name}`, 3, 1e4);
                });

                log(`blue`, `Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                return bus.emit(`report`, `Permanently Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} permanently banned ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n`: ``}IP: ${player.socket.handshake.address}\nServer ${player.serverNumber}.`);
            } else if (command == `tempban` && (isAdmin || isMod)) {
                let tempbanUser = args.shift();
                let tempbanReason = args.join(` `);

                let player = Object.values(core.players).find(player => player.name == tempbanUser);
                if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);
                if (!tempbanReason || tempbanReason == ``) tempbanReason == `No reason specified`;

                let ban = new Ban({
                    IP: player.socket.handshake.address,
                    timestamp: new Date(),
                    comment: tempbanReason
                });

                ban.save(err => err ? log(`red`, err) : () => {
                    player.socket.disconnect();
                    playerEntity.socket.emit(`showCenterMessage`, `You temporarily banned ${player.name}`, 3);
                });

                log(`blue`, `Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                return bus.emit(`report`, `Temporary Ban Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} temporarily banned ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n`: ``}IP: ${player.socket.handshake.address}\n Server ${player.serverNumber}.`);
            } else if (command == `save` && (isAdmin || isDev)) {
                playerEntity.socket.emit(`showCenterMessage`, `Storing player data`, 3, 1e4);
                for (let i in core.players) {
                    let player = core.players[i];

                    // Delete existing outstanding data if any.
                    let oldPlayerData = await PlayerRestore.findOne({
                        IP: socket.handshake.address
                    });
                    if (oldPlayerData) oldPlayerData.delete();

                    let playerSaveData = new PlayerRestore({
                        name: player.name,
                        ip: player.socket.handshake.address,
                        timestamp: new Date(),

                        gold: player.gold,
                        xp: player.experience,
                        points: {
                            fireRate: player.fireRate,
                            distance: player.distance,
                            damage: player.damage
                        },

                        score: player.score,
                        shipsSank: player.shipsSank,
                        deaths: player.deaths,
                        totalDamage: player.totalDamage,
                        overallKills: player.overallKills,

                        isCaptain: player.isCaptain,
                        shipID: player.parent ? player.parent.shipclassId : null,

                        itemID: player.itemID ? player.itemID : null,
                        bonus: {
                            fireRate: player.attackSpeedBonus,
                            distance: player.attackDistanceBonus,
                            damage: player.attackDamageBonus,
                            speed: player.movementSpeedBonus
                        }
                    });
                    playerSaveData.save(err => err ? log(`red`, err) : () => {
                        log(`blue`, `Stored data for player ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                        player.socket.disconnect();
                    });
                }
            } else if (command == `report` && (isAdmin || isMod)) {
                let reportUser = args.shift();
                let reportReason = args.join(` `);

                let player = Object.values(core.players).find(player => player.name == reportUser);
                if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                if (reportIPs.includes(player.socket.handshake.address)) {
                    player.socket.emit(`showCenterMessage`, `You were warned...`, 1);

                    log(`blue`, `Reporter ${playerEntity.name} reported ${player.name} for the second time --> kick | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    bus.emit(`report`, `Second Report --> Kick`, `${getTimestamp()} Reporter ${playerEntity.name} reported ${reportedPlayer} for the second time --> kick\n${reportReason ? `Reason: ${reportReason} | `: ``}\nIP: ${player.socket.handshake.address}\nServer ${player.serverNumber}.`);

                    playerEntity.socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);
                    return player.socket.disconnect();
                } else {
                    reportIPs.push(player.socket.handshake.address);
                    player.socket.emit(`showCenterMessage`, `You have been reported. ${reportReason ? `Reason: ${reportReason} `: ``}Last warning!`, 1);
                    playerEntity.socket.emit(`showCenterMessage`, `You reported ${player.name}`, 3, 1e4);

                    log(`blue`, `Reporter ${playerEntity.name} reported ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    return bus.emit(`report`, `Second Report --> Kick`, `${getTimestamp()} Reporter ${playerEntity.name} reported ${reportedPlayer}\n${reportReason ? `Reason: ${reportReason}\n`: ``}IP: ${player.socket.handshake.address}\nServer ${player.serverNumber}.`);
                }
            } else if (command == `mute` && (isAdmin || isMod)) {
                let playerToMute = args.shift();
                let muteReason = args.join(` `);

                let player = Object.values(core.players).find(player => player.name == playerToMute);
                if (!player) return playerEntity.socket.emit(`showCenterMessage`, `That player does not exist!`, 3, 1e4);

                mutePlayer(player);
                player.socket.emit(`showCenterMessage`, `You have been muted! ${muteReason ? `Reason: ${muteReason}`: ``}`, 1);
                playerEntity.socket.emit(`showCenterMessage`, `You muted ${player.name}`, 3);

                log(`blue`, `Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                return bus.emit(`report`, `Muted Player`, `${getTimestamp()} Admin / Mod ${playerEntity.name} muted ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n`: ``}IP: ${player.socket.handshake.address}\n Server ${player.serverNumber}.`);
            }
        }
    }
    if (!isSpamming(playerEntity, msgData.message)) {
        let msg = msgData.message.toString();

        msg = xssFilters.inHTMLData(msg);
        msg = filter.clean(msg);

        if (msgData.recipient == `global`) {
            io.emit(`chat message`, {
                playerId: playerEntity.id,
                playerName: playerEntity.name,
                recipient: `global`,
                message: charLimit(msg, 150)
            });
            if (config.mode == `prod`) bus.emit(`msg`, playerEntity.id, playerEntity.name, charLimit(msg, 150));
        } else if (msgData.recipient == `local` && entities[playerEntity.parent.id]) {
            for (let i in entities[playerEntity.parent.id].children) {
                let player = entities[playerEntity.parent.id].children[i];
                player.socket.emit(`chat message`, {
                    playerId: playerEntity.id,
                    playerName: playerEntity.name,
                    recipient: `local`,
                    message: charLimit(msg, 150)
                });
            }
        } else if (msgData.recipient == `clan` && playerEntity.clan != `` && typeof playerEntity.clan != `undefined`) {
            let clan = playerEntity.clan;
            for (let i in entities) {
                let entity = entities[i];
                if (entity.netType == 0 && entity.clan == clan) {
                    entity.socket.emit(`chat message`, {
                        playerId: playerEntity.id,
                        playerName: playerEntity.name,
                        recipient: `clan`,
                        message: charLimit(msg, 150)
                    });
                }
            }
        } else if (msgData.recipient == `staff` && (playerEntity.isAdmin || playerEntity.isMod || playerEntity.isDev)) {
            for (let i in core.players) {
                let player = core.players[i];
                if (player.isAdmin || player.isMod || player.isDev) player.socket.emit(`chat message`, {
                    playerId: playerEntity.id,
                    playerName: playerEntity.name,
                    recipient: `staff`,
                    message: charLimit(msg, 150)
                });
            }
        } else if (msgData.message.length > 1) {
            socket.emit(`showCenterMessage`, `You have been muted`, 1);
            log(`blue`, `Player ${playerEntity.name} was auto-muted | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
        }
    }
}
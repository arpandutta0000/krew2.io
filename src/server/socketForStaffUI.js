/* Import Modules */
const bus = require(`./utils/messageBus.js`);
const config = require(`./config/config.js`);
const log = require(`./utils/log.js`);
const { exec } = require(`child_process`);

// MongoDB models
let User = require(`./models/user.model.js`);
let Ban = require(`./models/ban.model.js`);
let Mute = require(`./models/mute.model.js`);

// Variables
let reportIPs = [];
let serverRestart = false;

/**
 * Authenticate a socket connection for staff UI
 *
 * @param {object} socket Socket object
 */
let authStaffUISocket = (socket) => {
    if (config.admins.includes(socket.handshake.auth.username) || config.mods.includes(socket.handshake.auth.username) || config.helpers.includes(socket.handshake.auth.username)) {
        User.findOne({
            username: socket.handshake.auth.username
        }).then((user) => {
            if (!user || user.password !== socket.handshake.auth.password) return socket.disconnect();
            else return initStaffUISocket(socket);
        });
    } else return socket.disconnect();
};

/**
 * Initiate Staff UI socket binds
 *
 * @param {object} socket Socket object
 */
let initStaffUISocket = (socket) => {
    let staff = {
        username: socket.handshake.auth.username,
        role: config.admins.includes(socket.handshake.auth.username) ? `admin` : (config.mods.includes(socket.handshake.auth.username) ? `mod` : `helper`),
        serverNumber: config.gamePorts.indexOf(parseInt(socket.handshake.headers.host.substr(-4))) + 1
    };

    log(`green`, `Staff "${staff.username}" connected to Staff UI bound to server ${staff.serverNumber}`);
    socket.emit(`showCenterMessage`, `Connected to server ${staff.serverNumber}`, 3, 5e3);

    // On socket disconnect
    socket.on(`disconnect`, () => log(`red`, `Staff "${staff.username}" disconnected from Staff UI bound to server ${staff.serverNumber}`));

    // Warn action
    socket.on(`warn`, async (data) => {
        if (staff.role !== `admin` && staff.role !== `mod` && staff.role !== `helper`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        let reportUser = data.user;
        let reportReason = data.reason;

        let player = Object.values(core.players).find(player => player.name === reportUser);
        if (!player) return socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);

        if (reportIPs.includes(player.socket.handshake.address)) {
            player.socket.emit(`showCenterMessage`, `You were warned...`, 1);

            log(`blue`, `Reporter ${staff.username} warned ${player.name} for the second time --> kick | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
            bus.emit(`report`, `Second Warn --> Kick`, `Reporter ${staff.username} warned ${reportUser} for the second time --> kick\n${reportReason ? `Reason: ${reportReason} | ` : ``}\nServer ${player.serverNumber}.`);

            for (let i in core.players) {
                let curPlayer = core.players[i];
                if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} warned ${player.name}.`, 4, 1e4);
            }

            socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);
            return player.socket.disconnect();
        } else {
            reportIPs.push(player.socket.handshake.address);
            player.socket.emit(`showCenterMessage`, `You have been warned. ${reportReason ? `Reason: ${reportReason}` : ``}`, 1);
            socket.emit(`showCenterMessage`, `You warned ${player.name}`, 3, 1e4);

            for (let i in core.players) {
                let curPlayer = core.players[i];
                if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} warned ${player.name} for the second time.`, 4, 1e4);
            }

            log(`blue`, `Reporter ${staff.username} warned ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
            return bus.emit(`report`, `Second Warn --> Kick`, `Reporter ${staff.username} warned ${reportUser}\n${reportReason ? `Reason: ${reportReason}\n` : ``}\nServer ${player.serverNumber}.`);
        }
    });

    // Unmute action
    socket.on(`unmute`, async (data) => {
        if (staff.role !== `admin` && staff.role !== `mod` && staff.role !== `helper`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        let unmuteUser = data.user;

        let player = Object.values(core.players).find(player => player.name === unmuteUser);

        if (!player) return socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
        else if (!player.isMuted) return socket.emit(`showCenterMessage`, `That player is not muted!`, 1, 1e4);

        for (let i in core.players) {
            let mutedPlayer = core.players[i];
            if (mutedPlayer.name === player.name) {
                mutedPlayer.isMuted = false;
                Mute.deleteOne({
                    IP: mutedPlayer.socket.handshake.address
                }).then(() => {
                    ocket.emit(`showCenterMessage`, `You unmuted ${unmuteUser}.`, 3, 1e4);
                    mutedPlayer.socket.emit(`showCenterMessage`, `You have been unmuted.`, 4, 1e4);

                    for (let i in core.players) {
                        let curPlayer = core.players[i];
                        if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} unmuted ${player.name}.`, 4, 1e4);
                    }

                    log(`blue`, `Admin / Mod /Helper ${staff.username} unmuted ${player.name} | IP: ${player.socket.handshake.address}.`);
                    return bus.emit(`report`, `Unban Player`, `Admin / Mod ${staff.username} unmuted ${player.name}.`);
                });
            }
        }
    });

    // Mute action
    socket.on(`mute`, async (data) => {
        if (staff.role !== `admin` && staff.role !== `mod` && staff.role !== `helper`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        let playerToMute = data.user;
        let muteReason = data.reason;

        let player = Object.values(core.players).find(player => player.name === playerToMute);
        if (!player) return socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
        else if (player.isAdmin || player.isMod || player.isHelper) return socket.emit(`showCenterMessage`, `That player is a staff member!`, 1, 1e4);

        mutePlayer(player, muteReason || `No reason specified`);

        player.socket.emit(`showCenterMessage`, `You have been muted! ${muteReason ? `Reason: ${muteReason}` : ``}`, 1);
        socket.emit(`showCenterMessage`, `You muted ${player.name}`, 3);

        for (let i in core.players) {
            let curPlayer = core.players[i];
            if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} muted ${player.name}.`, 4, 1e4);
        }

        log(`blue`, `Admin / Mod / Helper ${staff.username} muted ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
        return bus.emit(`report`, `Muted Player`, `Admin / Mod / Helper ${staff.username} muted ${player.name} --> ${player.id}\n${muteReason ? `Reason: ${muteReason}\n` : ``}\nServer ${player.serverNumber}.`);
    });

    // Kick action
    socket.on(`kick`, async (data) => {
        if (staff.role !== `admin` && staff.role !== `mod` && staff.role !== `helper`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        let kickUser = data.user;
        let kickReason = data.reason;

        let player = Object.values(core.players).find(player => player.name === kickUser);
        if (!player) return socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
        else if (player.isAdmin || player.isMod || player.isHelper) return socket.emit(`showCenterMessage`, `That player is a staff member!`, 1, 1e4);
        if (!kickReason || kickReason === ``) kickReason === `No reason specified`;

        player.socket.emit(`showCenterMessage`, `You have been kicked ${kickReason ? `. Reason: ${kickReason}` : `.`}`, 1, 1e4);
        socket.emit(`showCenterMessage`, `You kicked ${player.name}`, 3, 1e4);

        for (let i in core.players) {
            let curPlayer = core.players[i];
            if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} kicked ${player.name}.`, 4, 1e4);
        }

        log(`blue`, `Admin / Mod / Helper ${staff.username} kicked ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
        bus.emit(`report`, `Kick Player`, `Admin / Mod / Helper ${staff.username} kicked ${player.name} --> ${player.id}\n${kickReason ? `Reason: ${kickReason}\n` : ``}\nServer ${player.serverNumber}.`);
        return player.socket.disconnect();
    });

    // Ban action
    socket.on(`ban`, async (data) => {
        if (staff.role !== `admin` && staff.role !== `mod`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        let banUser = data.user;
        let banReason = data.reason;

        let player = Object.values(core.players).find(player => player.name === banUser);
        if (!player) return socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);
        else if (player.isAdmin || player.isMod || player.isHelper) return socket.emit(`showCenterMessage`, `That player is a staff member!`, 1, 1e4);
        if (!banReason || banReason === ``) banReason === `No reason specified`;

        let isBanned = await Ban.findOne({
            username: player.name
        });
        if (isBanned) return socket.emit(`showCenterMessage`, `That player is already banned!`, 1, 1e4);

        let ban = new Ban({
            username: player.name,
            IP: player.socket.handshake.address,
            comment: banReason
        });

        ban.save(() => {
            player.socket.emit(`showCenterMessage`, `You have been banned!`, 1, 6e4);
            player.socket.disconnect();
            socket.emit(`showCenterMessage`, `You permanently banned ${player.name}`, 3, 1e4);

            for (let i in core.players) {
                let curPlayer = core.players[i];
                if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} banned ${player.name}.`, 4, 1e4);
            }
        });

        log(`blue`, `Admin / Mod ${staff.username} permanently banned ${player.name} --> ${player.id} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
        return bus.emit(`report`, `Permanently Ban Player`, `Admin / Mod ${staff.username} permanently banned ${player.name} --> ${player.id}\n${banReason ? `Reason: ${banReason}\n` : ``}\nServer ${player.serverNumber}.`);
    });

    // Clear chat
    socket.on(`clear-chat`, () => {
        if (staff.role !== `admin` && staff.role !== `mod`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        socket.emit(`showCenterMessage`, `You have cleared the chat.`, 3, 1e4);

        io.emit(`showCenterMessage`, `An admin or mod has cleared the chat!`, 1, 1e4);
        io.emit(`clear`);

        for (let i in core.players) {
            let curPlayer = core.players[i];
            if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} cleared the chat.`, 4, 1e4);
        }

        log(`blue`, `Admin / Mod ${staff.username} cleared global chat | IP: ${socket.handshake.address} | Server ${staff.serverNumber}.`);
        return bus.emit(`report`, `Chat Clear`, `Admin / Mod ${staff.username} cleared the global chat.`);
    });

    // Give
    socket.on(`give`, (data) => {
        if (staff.role !== `admin`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        let giveUser = data.user;
        let giveAmount = parseInt(data.amount);

        let player = Object.values(core.players).find(player => player.name === giveUser);
        if (!player) return socket.emit(`showCenterMessage`, `That player does not exist!`, 1, 1e4);

        if (!giveAmount || isNaN(giveAmount)) return socket.emit(`showCenterMessage`, `You did not specify a valid amount!`, 1, 1e4);

        socket.emit(`showCenterMessage`, `Succesfully gave ${player.name} ${giveAmount} gold!`, 3, 1e4);

        for (let i in core.players) {
            let curPlayer = core.players[i];

            if (player.name === curPlayer.name) {
                curPlayer.gold += giveAmount;
                curPlayer.socket.emit(`showCenterMessage`, `You have received ${giveAmount} gold!`, 4, 1e4);
            } else if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} gave ${player.name} ${giveAmount} gold.`, 4, 1e4);
        }

        log(`blue`, `Player ${staff.username} gave ${giveUser} ${giveAmount} gold | IP: ${socket.handshake.address} | Server ${staff.serverNumber}.`);
        return bus.emit(`report`, `Give Gold`, `Admin ${staff.username} gave ${giveUser} ${giveAmount} gold.`);
    });

    // Recompense
    socket.on(`recompense`, (data) => {
        if (staff.role !== `admin`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        let amt = data.amount;

        if (!amt || isNaN(parseInt(amt))) return;
        for (let i in core.players) {
            core.players[i].gold += parseInt(amt);
        }
        for (let i in core.players) {
            let curPlayer = core.players[i];
            if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} gave ${amt} gold to all players.`, 4, 1e4);
        }

        log(`blue`, `ADMIN RECOMPENSED ${amt} GOLD | IP: ${socket.handshake.address} | Server ${staff.serverNumber}.`);
        bus.emit(`report`, `Recompense`, `Admin ${staff.username} recompensed all players ${amt} gold.`);
        return io.emit(`showAdminMessage`, `You have been recompensed for the server restart!`);
    });

    // Server Restart
    socket.on(`server-restart`, (data) => {
        if (staff.role !== `admin`) return socket.emit(`showCenterMessage`, `You don't have permission to use this action!`, 1, 1e4);

        if (serverRestart) return socket.emit(`showCenterMessage`, `Server restart is already in progress`, 1, 1e4);

        serverRestart = true;
        socket.emit(`showCenterMessage`, `Started server restart process.`, 3, 1e4);
        bus.emit(`report`, `Restart`, `Admin ${staff.username} started server ${data.type}`);

        for (let i in core.players) {
            let curPlayer = core.players[i];
            if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} started a server restart.`, 4, 1e4);
        }

        io.emit(`showCenterMessage`, `Server is restarting in 1 minute!`, 4, 1e4);
        setTimeout(() => io.emit(`showCenterMessage`, `Server is restarting in 30 seconds!`, 4, 1e4), 3e4);
        setTimeout(() => io.emit(`showCenterMessage`, `Server is restarting in 10 seconds!`, 4, 1e4), 5e4);

        setTimeout(() => {
            for (let i in core.players) {
                let player = core.players[i];

                // Delete existing outstanding data if any.
                PlayerRestore.findOne({
                    IP: player.socket.handshake.address
                }).then(oldPlayerData => {
                    PlayerRestore.findOne({
                        username: player.name
                    }).then(oldAccountData => {
                        User.findOne({
                            username: player.name
                        }).then(user => {
                            if (oldPlayerData) oldPlayerData.delete();
                            if (oldAccountData) oldAccountData.delete();

                            const playerSaveData = createPlayerRestore(player);
                            if (user) {
                                if (player.serverNumber === 1 && player.gold > player.highscore) {
                                    log(`magenta`, `Updated highscore for player: ${player.name} | Old highscore: ${playerEntity.highscore} | New highscore: ${parseInt(player.gold)} | IP: ${player.socket.handshake.address}.`);
                                    player.highscore = parseInt(player.gold);

                                    user.highscore = player.highscore;
                                    user.save();
                                }
                            }

                            playerSaveData.save(() => {
                                log(`blue`, `Stored data for player ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                                player.socket.emit(`showCenterMessage`, `Server is restarting. Please refresh your page to rejoin the game.`, 4, 6e4);
                                player.socket.disconnect();
                                core.removeEntity(player);
                            });
                        });
                    });
                });
            }
            if (!DEV_ENV) {
                exec(`sh /opt/krew2.io/src/server/scripts/${data.type}.sh`, (err, stdout, stderr) => {
                    if (err) log(`red`, err);
                });
            } else {
                log(`red`, `Warning, cannot automatically restart in development.`);
                serverRestart = false;
            }
        }, 6e4);
    });

    // Chat Messages
    bus.on(`msg`, (id, name, server, message) => socket.emit(`msg`, `[Server ${server}] ${name} » ${message}`));

    // Logging Messages
    bus.on(`report`, (title, description) => socket.emit(`log`, description));

    // Player Join
    bus.on(`join`, (message) => socket.emit(`join`, message));

    // Player Leave
    bus.on(`leave`, (message) => socket.emit(`leave`, message));

    // Send first snapshot
    socket.emit(`s`, lzString.compress(JSON.stringify(core.compressor.getSnapshot(true))));
};

let mutePlayer = (playerEntity, comment) => {
    if (playerEntity.isAdmin || playerEntity.isMod || playerEntity.isHelper) return log(`yellow`, `Cannot mute staff member | Player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    let mute = new Mute({
        username: playerEntity.name,
        timestamp: new Date(),
        IP: playerEntity.socket.handshake.address,
        comment
    });

    log(`cyan`, `Muting player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);

    mute.save(() => {
        playerEntity.isMuted = true;
        playerEntity.muteTimeout = setTimeout(() => {
            Mute.deleteOne({
                IP: playerEntity.socket.handshake.address
            }).then(() => {
                log(`yellow`, `Unmuting player ${playerEntity.name} | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
                playerEntity.isMuted = false;
            });
        }, 3e5);
    });
};

module.exports = {
    authStaffUISocket,
    initStaffUISocket
};

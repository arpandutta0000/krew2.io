/* Import Modules */
const axios = require(`axios`);
const bus = require(`./utils/messageBus.js`);
const config = require(`./config/config.js`);
const log = require(`./utils/log.js`);
const md5 = require(`./utils/md5.js`);
const mongoose = require(`mongoose`);
const dotenv = require(`dotenv`).config();

// MongoDB models
let User = require(`./models/user.model.js`);
let Ban = require(`./models/ban.model.js`);
let Mute = require(`./models/mute.model.js`);

// Variables
let reportIPs = [];

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

    socket.on(`disconnect`, () => {
        log(`red`, `Staff "${staff.username}" disconnected from Staff UI bound to server ${staff.serverNumber}`);
    });



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
            player.socket.emit(`showCenterMessage`, `You have been warned. ${reportReason ? `Reason: ${reportReason} ` : ``}Last warning!`, 1);
            socket.emit(`showCenterMessage`, `You warned ${player.name}`, 3, 1e4);

            for (let i in core.players) {
                let curPlayer = core.players[i];
                if (curPlayer.isAdmin || curPlayer.isMod || curPlayer.isHelper) curPlayer.socket.emit(`showCenterMessage`, `${staff.username} warned ${player.name} for the second time.`, 4, 1e4);
            }

            log(`blue`, `Reporter ${staff.username} warned ${player.name} | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
            return bus.emit(`report`, `Second Warn --> Kick`, `Reporter ${staff.username} warned ${reportUser}\n${reportReason ? `Reason: ${reportReason}\n` : ``}\nServer ${player.serverNumber}.`);
        }
    });



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

        log(`blue`, `${isAdmin ? `ADMIN` : isMode ? `MOD` : `HELPER`} KICK: | Player name: ${staff.username} | ${kickReason} | IP: ${player.socket.handshake.address} | Server ${staff.serverNumber}.`);
        bus.emit(`report`, `Kick Player`, `Admin / Mod / Helper ${staff.username} kicked ${player.name} --> ${player.id}\n${kickReason ? `Reason: ${kickReason}\n` : ``}\nServer ${player.serverNumber}.`);
        return player.socket.disconnect();
    });



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



    // Send first snapshot
    socket.emit(`s`, lzString.compress(JSON.stringify(core.compressor.getSnapshot(true))));
};

module.exports = {
    authStaffUISocket,
    initStaffUISocket
};
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

    log(`green`, `Staff "${staff.username}" connected to Staff UI bound to server ${staff.serverNumber}`)


    socket.on(`disconnect`, () => {
        log(`red`, `Staff "${staff.username}" disconnected from Staff UI bound to server ${staff.serverNumber}`);
    })
}

module.exports = {
    authStaffUISocket,
    initStaffUISocket
};
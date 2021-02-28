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
            else {
                log(`green`, `Staff ${user.username} successfully connected to Staff UI. Initiating Staff UI socket binds...`);
                return initStaffUISocket(socket);
            }
        });
    } else return socket.disconnect();
};

/**
 * Initiate Staff UI socket binds
 * 
 * @param {object} socket Socket object
 */
let initStaffUISocket = (socket) => {
    console.log(socket.handshake.auth)
}

module.exports = {
    authStaffUISocket,
    initStaffUISocket
};
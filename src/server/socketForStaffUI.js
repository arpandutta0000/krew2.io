/* Import Modules */
const axios = require(`axios`);
const bus = require(`./utils/messageBus.js`);
const config = require(`./config/config.js`);
const log = require(`./utils/log.js`);
const md5 = require(`./utils/md5.js`);
const mongoose = require(`mongoose`);
const dotenv = require(`dotenv`).config();

let staffUISocket = (socket) => {
    console.log(socket.handshake.auth)
};

module.exports = staffUISocket;
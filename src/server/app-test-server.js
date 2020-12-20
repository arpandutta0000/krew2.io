const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
var core = require('./core/core_concatenated.js');
global.TEST_ENV = process.env.NODE_ENV === 'test';
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

process.env.port = 80;

var server = require('./server.js');

server.app.workers = {};

require('./memwatch')();

var socket = require('./socketForClients.js');
var game = require('./game/game.js');

setInterval(function () {
    if (server.app.workers[process.pid] === undefined) {
        server.app.workers[process.pid] = {
            ip: process.env.NOW_URL,
            port: process.env.port,
            playerCount: 0,
        };
    }

    server.app.workers[process.pid].playerCount = Object.keys(core.players).length;
}, 1000);
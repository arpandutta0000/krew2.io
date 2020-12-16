const cluster = require('cluster');
const numCPUs = 3;
var core = require('./core/core_concatenated.js');
global.TEST_ENV = process.env.NODE_ENV === 'test';
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

var mongoUtil = require( './core/core_mongo_connection' );

// open a single connection to mongo (and keep it open) for all transactions
mongoUtil.connectToServer( function( err, client ) {
    if (err) console.log(err);
    if (cluster.isMaster) { // master cluster! runs the website
        // start server
        var server = require('./server.js');

        server.app.workers = {};

        // This will create just one server for better testing and monitoring
        if (DEV_ENV){
            process.env.port = 2001;
            var worker = cluster.fork();
            worker.on('message', (msg) => {
                if (msg.type === 'update-server') {
                    const { data, processId } = msg;
                    server.app.workers[processId] = data;
                }
            });
            console.log("creating a worker in DEV_ENV", server.app.workers)
            return;
        }

        // fork worker processors based on the number of cores the CPU has
        for (var i = 0; i < numCPUs; i++) {

            process.env.port = 2000 + i + 1;

            var worker = cluster.fork();
            worker.on('message', (msg) => {
                if (msg.type === 'update-server') {
                    const { data, processId } = msg;
                    server.app.workers[processId] = data;
                }
            });
        }
    } else {// gameServers
        // let MemwatchFactoryFunction = require('./memwatch');

        // start socket
        var socket = require('./socketForClients.js');

        // start game logic
        var game = require('./game/game.js');
        var Rollbar = require('rollbar');
        var rollbar = new Rollbar('fa0cd86c64f446c4bac992595be24831');

        // MemwatchFactoryFunction(rollbar);

        process.on('uncaughtException', function (e) {
            if (!DEV_ENV) {
                console.log(e);
                return rollbar.error(e);
            }

            console.log(e);
        });

        try {
            var everySecond = setInterval(function () {
                try {
                    // this.socket.emit(msgType, data);
                    process.send({
                        type: 'update-server',
                        processId: process.pid,
                        data: {
                            ip: (DEV_ENV) ? '192.168.1.35' : '155.138.228.176',
                            port: process.env.port,
                            playerCount: Object.keys(core.players).length,
                        },
                    });
                }
                catch (err) {
                    console.log(err, err.stack);
                    ige.log('emit error at', msgType, data, err);
                }

            }, 1000);
        }

        catch (e) {
            console.log('e', e);
        }

        console.log(`Worker ${process.pid} started`);
        console.log('Server has been up since: ', new Date().toISOString().slice(0, 10));
    }
} );
const config = require(`./config/config.js`);

const cluster = require(`cluster`);
const log = require(`./utils/log.js`);

const numCPUs = require(`os`).cpus().length;

let core = require(`../../_compiled/core.js`);
global.TEST_ENV = process.env.NODE_ENV == `test`;
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

(() => {
    // Master cluster! Serves the client.
    if(cluster.isMaster) {
        // Start server.
        let server = require(`./server.js`);
        server.app.workers = {}

        // Development environment.
        if(DEV_ENV) {
            process.env.port = 2001;

            let worker = cluster.fork();
            worker.on(`message`, msg => {
                if(msg.type == `update-server`) {
                    const { data, processId } = msg;
                    server.app.workers[processId] = data;
                }
            });
            return log(`green`, `Creating a worker in development: ${server.app.workers}.`);
        }
        // Fork worker processors.
        for(let i = 0; i < numCPUs; i++) {
            process.env.port = 2001 + i;

            let worker = cluster.fork();
            worker.on(`message`, msg =>  {
                if(msg.type == `update-server`) {
                    const { data, processId } = msg;
                    server.app.workers[processId] = data;
                }
            });
        }
    }
    else {
        // Game servers. Serve each individual socket connection.
        let socket = require(`./socket.js`);
        let game = require(`./game/game.js`);

        setInterval(() => {
            process.send({
                type: `update-server`,
                processId: process.pid,
                data: {
                    ip: (DEV_ENV) ? `127.0.0.1`: `155.138.228.176`,
                    port: process.env.port,
                    playerCount: Object.keys(core.players).length
                }
            });
        }, 1e3);

        log(`green`, `Worker ${process.pid} started.`);
        log(`green`, `Server has been up since: ${new Date().toISOString().slice(0, 10)}`);
    }
})();
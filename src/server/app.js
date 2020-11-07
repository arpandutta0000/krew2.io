const dotenv = require(`dotenv`).config();
const config = require(`./config/config.js`);

const cluster = require(`cluster`);

let core = require(`./core/core_concatenated.js`);
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

if(err) console.log(err);
if(cluster.isMaster) {
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
    }
    else {
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
}
else {
    let socket = require(`./socket.js`);

    let game = require(`./game/game.js`);

    let Rollbar = require(`rollbar`);
    let rollbar = new Rollbar(process.env.ROLLBAR_TOKEN);

    process.on(`uncaughtException`, e => {
        if(!DEV_ENV) {
            console.log(e);
            return rollbar.error(e);
        }
    });

    try {
        let gameUpdate = setInterval(() => {
            try {
                process.send({
                    type: `update-server`,
                    processId: process.pid,
                    data: {
                        ip: (DEV_ENV) ? `127.0.0.1`: `155.138.228.176`,
                        port: process.env.port,
                        playerCount: Object.keys(core.players).length
                    }
                });
            }
            catch(err) {
                console.log(err, err.stack);
                ige.log(`emit error at`, msgType, data, err);
            }
        }, 1e3);
    }
    catch(e) {
        console.log(`e`, e);
    }

    console.log(`Worker ${process.pid} started.`);
    console.log(`Server has been up since: ${new Date().toISOString().slice(0, 10)}`);
}
const dotenv = require(`dotenv`).config();
const config = require(`./config.js`);

const cluster = require(`cluster`);

let core = require(`./core/core_concatenated.js`);
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

let mognoUtil = require(`./core/mongo_connection`);

mognoUtil.connectToServer((err, client) => {
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
    else {}
});
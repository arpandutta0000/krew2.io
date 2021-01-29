const io = require(`socket.io-client`);
const config = require(`./config/config.js`);
const log = require(`./utils/log.js`);

// 'Bots' used for a testing environment.
let createBots = () => {
    for (let i = 0; i < config.maxBots; i++) {
        const socket = io.connect(`${config.mode === `dev` ? `http://localhost` : `https://${config.domain}`}:${config.gamePorts[0]}`, {
            secure: true,
            rejectUnauthorized: true,
            withCredentials: true
        });

        socket.on(`handshake`, () => {
            // EXPLOIT: Running createPlayer in a loop with little to no execution delay will crash the server! (Excess event handler attribution).
            socket.emit(`createPlayer`, {
                spawn: `sea`
            });

            log(`yellow`, `Bot has connected to server.`);

            socket.emit(`u`, {
                // Make the player jump (keep websocket alive).
                t: {
                    j: 1
                }
            });

            socket.on(`end`, () => {
                log(`red`, `Bot has died. Disconnecting.`);
                socket.disconnect();
            });
        });
    }
};

module.exports = createBots;

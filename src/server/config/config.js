const dotenv = require(`dotenv`).config();

const config = {
    appname: `Krew.io`,
    port: process.env.NODE_ENV == `prod` ? 443: 8080,
    mode: process.env.NODE_ENV,
    domain: `beta.krew.io`,
    logging: true,
    serverIP: `155.138.228.176`,
    discord: {
        prefix: `k!`,
        channels: {
            chatLogs: `785986912765739039`,
            reports: `785986728648245269`,
            commands: `785986872777113610`
        },
        roles: {
            admin: `255703060020592641`,
            mod: `257153880029134848`,
            dev: `255703028160528384`
        },
        footer: `KrewBot | v1.0.0`
    },
}

// In development, we don't serve the production server list.
config.servers = config.mode == `dev` ?
[`localhost:${config.port}`]:

// Otherwise, using the official server list.
[
    `155.138.228.176:80`,
    `155.138.228.176:81`,
    `155.138.228.176:82`,
    `155.138.228.176:83`,
    `155.138.228.176:84`,
    `155.138.228.176:85`,
    `155.138.228.176:86`,
    `155.138.228.176:87`,
    `155.138.228.176:88`,
    `155.138.228.176:89`
]

config.staticDir = config.mode == `prod` ? `${__dirname}/../client/`: `${__dirname}/../../dist/`;

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
}

module.exports = config;

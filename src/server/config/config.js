const dotenv = require(`dotenv`).config();

const config = {
    appName: `Krew.io`,
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
    }
}

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
}

module.exports = config;

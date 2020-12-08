const dotenv = require(`dotenv`).config();

const config = {
    appName: `Krew.io`,
    port: process.env.NODE_ENV == `prod` ? 443: 8080,
    mode: process.env.NODE_ENV,
    domain: `beta.krew.io`,
    logging: true,
}

config.ssl = {
    key: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    cert: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
}

config.servers = config.mode = `dev` ? [`localhost:${config.port}`]:
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
    ];

module.exports = config;

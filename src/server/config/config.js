const dotenv = require(`dotenv`).config();

const config = {
    appName: `Krew.io`,
    port: process.env.NODE_ENV == `prod` ? 443: 8080,
    mode: process.env.NODE_ENV,
    domain: `beta.krew.io`,
    logging: true
}

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
}

module.exports = config;

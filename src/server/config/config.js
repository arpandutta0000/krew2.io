const dotenv = require(`dotenv`).config();

const config = {
    appName: `Krew.io`,
    port: process.env.NODE_ENV == `prod` ? 443: 8080,
    mode: process.env.NODE_ENV,
    domain: `krew.io`,
    logging: true,
}

config.ssl = {
    key: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    cert: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
}

module.exports = config;
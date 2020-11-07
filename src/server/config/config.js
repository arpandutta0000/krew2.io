const dotenv = require(`dotenv`).config();

const config = {
    appName: `Krew2.io`,
    port: process.env.NODE_ENV == `prod` ? 443: 8080,
    domain: `krew.io`
}

config.ssl = {
    key: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    cert: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
}

module.exports = config;
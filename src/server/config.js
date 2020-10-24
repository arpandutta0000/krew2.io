// Parse arguments
const argv = require(`optimist`).default(`p`, 8080).argv;

const config = {
    appName: `Krew2.io`,
    port: parseInt(argv.p),
    ssl: {
        key: `/etc/letsencrypt/live/krew.io/privkey.pem`,
        cert: `/etc/letsencrypt/live/krew.io/fullchain.pem`
    }
}

module.exports = { config }
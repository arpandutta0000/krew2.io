const dotenv = require(`dotenv`).config();
const thugConfig = require(`./thugConfig.js`);
const path = require(`path`);

const config = {
    appname: `Krew.io`,
    port: process.env.NODE_ENV === `prod` ? 8200 : 8080,
    mode: process.env.NODE_ENV,
    domain: `krew.io`,
    logging: true,
    serverCount: 3,
    maxPlayerCount: 250,
    discord: {
        prefix: `k!`,
        channels: {
            chatLogs: `785986912765739039`,
            reports: `791402349909901314`,
            commands: `785986872777113610`
        },
        roles: {
            admin: `255703060020592641`,
            mod: `257153880029134848`,
            dev: `255703028160528384`
        },
        footer: `KrewBot | v1.0.0`
    },
    gamePorts: [
        2053, // Server 1
        2083, // Server 2
        2087 // Server 3
    ],
    additionalBadWords: [`idiot`, `2chOld`, `Yuquan`],
    admins: [],
    mods: [],
    helpers: [],
    designers: [],
    maxBots: 100,
    maxAmountCratesInSea: 1100,
    minAmountCratesInSea: 480
};

config.staticDir = path.resolve(__dirname, `../../../dist/`);

for (const admin of thugConfig.Admins) config.admins.push(admin.name);
for (const mod of thugConfig.Mods) config.mods.push(mod.name);
for (const helper of thugConfig.Helpers) config.helpers.push(helper.name);
for (const designer of thugConfig.Designers) config.designers.push(designer.name);

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
};

module.exports = config;

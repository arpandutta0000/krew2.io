const dotenv = require(`dotenv`).config();
const thugConfig = require(`./thugConfig.js`);
const path = require(`path`);

const config = {
    appname: `Krew.io`,
    port: process.env.NODE_ENV === `prod` ? 8200 : 8080,
    mode: process.env.NODE_ENV,
    domain: `tournament.krew.io`,
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
    devs: [],
    maxAmountCratesInSea: 0,
    minAmountCratesInSea: 0,
    whitespaceRegex: /" *"|\t|\n|\v|\f|\r|\040|\u0008|\u0009|\u000A|\u000B|\u000C|\u000D|\u0020|\u0022|\u0027|\u005C|\u00A0|\u2028|\u2029|\uFEFF/g
};

config.staticDir = path.resolve(__dirname, config.mode === `prod` ? `../../../dist/` : `../../client/`);

for (const admin of thugConfig.Admins) config.admins.push(admin.name);
for (const mod of thugConfig.Mods) config.mods.push(mod.name);
for (const dev of thugConfig.Devs) config.devs.push(dev.name);

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
};

module.exports = config;

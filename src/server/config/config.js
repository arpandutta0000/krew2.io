const dotenv = require(`dotenv`).config();
const path = require(`path`);

const config = {
    appname: `Krew.cf`,
    port: process.env.NODE_ENV === `prod` ? 8200 : 8080,
    mode: process.env.NODE_ENV,
    domain: `krew.cf`,
    logging: true,
    serverCount: 3,
    maxPlayerCount: 250,
    discord: {
        prefix: `k!`,
        channels: {
            chatLogs: `822659626331799572`,
            reports: `822659292020604928`,
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

    additionalBadWords: [`idiot`, `2chOld`, `Yuquan`, `devclied`, `LapaMauve`],

    admins: [`DamienVesper`, `Zeropoint`, `BR88C`, `Sjmun`, `Fiftyyyyy`],
    mods: [`TheChoco`, `Tommy_Finle`],
    helpers: [`Sky920`],
    designers: [`bread`],

    maxBots: 100,
    maxAmountCratesInSea: 1100,
    minAmountCratesInSea: 480
};

config.staticDir = path.resolve(__dirname, `../../../dist/`);

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
};

module.exports = config;

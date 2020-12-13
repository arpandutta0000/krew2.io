const config = require(`./config/config.js`);
const Discord = require(`discord.js-light`);
const dotenv = require(`dotenv`).config();
const log = require(`./utils/log.js`);

const client = new Discord.Client({
    disableEveryone: true,
    sync: true,

    cacheGuilds: true,
    cacheChannels: false,
    cachePresences: false,
    cacheRoles: true,
    cacheOverwrites: false,
    cacheEmojis: false
});

client.on(`ready`, () => {
    client.channels.fetch(config.discord.chatLogs).then(channel => {
        //  ??????
    });
});
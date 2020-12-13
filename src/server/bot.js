const config = require(`./config/config.js`);
const Discord = require(`discord.js`);
const dotenv = require(`dotenv`).config();
const log = require(`./utils/log.js`);

const bus = require(`./utils/messageBus.js`);

const client = new Discord.Client({
    disableEveryone: true,
    sync: true
});

client.on(`ready`, () => {
    log(`green`, `Connected to Discord.`);

    let sEmbed = new Discord.RichEmbed()
        .setAuthor(`Server Start`)
        .setColor(0x00ff00)
        .setDescription(`Succesfully connected to Discord.`)
        .setTimestamp(new Date())
        .setFooter(config.discord.footer);
    client.channels.get(config.discord.chatLogs).send(sEmbed);
});

bus.on(`msg`, (id, name, message) => {
    client.channels.get(config.discord.chatLogs).send(`[${id}] ${name} » ${message}`);
});
bus.on(`report`, (title, description) => {
    let sEmbed = new Discord.RichEmbed()
        .setAuthor(title)
        .setColor(0xffff00)
        .setDescription(description)
        .setTimestamp(new Date())
        .setFooter(config.discord.footer);
    client.channels.get(config.discord.reports).send(sEmbed);
});

process.on(`SIGINT`, () => {
    let sEmbed = new Discord.RichEmbed()
        .setAuthor(`Server Stop`)
        .setColor(0xff0000)
        .setDescription(`Disconnected from Discord.`)
        .setTimestamp(new Date())
        .setFooter(config.discord.footer);
    client.channels.get(config.discord.chatLogs).send(sEmbed);
});

client.login(process.env.DISCORD_TOKEN).catch(err => log(`red`, `Failed to connect to Discord.`));
const config = require(`./config/config.js`);
const Discord = require(`discord.js`);
const dotenv = require(`dotenv`).config();
const log = require(`./utils/log.js`);
const { exec } = require(`child_process`);
const os = require(`os`);

const bus = require(`./utils/messageBus.js`);
const { discordFilter } = require(`./utils/chat.js`);

const client = new Discord.Client({
    disableEveryone: true,
    sync: true
});

client.on(`ready`, () => {
    log(`green`, `Connected to Discord.`);

    let time = new Date();
    let second = time.getSeconds().toString();
    let minute = time.getMinutes().toString();
    let hour = time.getHours().toString();
    let day = time.getDate().toString().padStart(2, `0`);
    let month = (time.getMonth() + 1).toString().padStart(2, `0`);
    let year = time.getFullYear().toString();
    let formattedTime = `${month}-${day}-${year} ${hour}:${minute}:${second}`;

    client.user.setActivity(`Krew.io`);
    client.channels.get(config.discord.channels.chatLogs).setTopic(`Server has been up since ${formattedTime}.`);

    let sEmbed = new Discord.RichEmbed()
        .setAuthor(`Server Start`)
        .setColor(0x00ff00)
        .setDescription(`Succesfully connected to Discord.`)
        .setTimestamp(new Date())
        .setFooter(config.discord.footer);
    if(config.mode == `prod`) client.channels.get(config.discord.channels.chatLogs).send(sEmbed);
});

bus.on(`msg`, (id, name, message) => {
    message = discordFilter(message);
    client.channels.get(config.discord.channels.chatLogs).send(`[${id}] ${name} » ${message}`);
});

bus.on(`report`, (title, description) => {
    let sEmbed = new Discord.RichEmbed()
        .setAuthor(title)
        .setColor(0xffff00)
        .setDescription(description)
        .setTimestamp(new Date())
        .setFooter(config.discord.footer);
    client.channels.get(config.discord.channels.reports).send(sEmbed);
});

client.on(`message`, message => {
    return; // Currently not working.

    const m = `${message.author} » `;

    if(message.author.bot || message.channel.type == `dm`) return;
    if(!message.channel.name.split(`-`).includes(`commands`)) return;

    if(message.content.slice(0, config.discord.prefix.length).toString().toLowerCase() != config.discord.prefix) return;

    const args = message.content.slice(config.discord.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command == `restart`) {
        if(!message.member.roles.has(config.discord.roles.dev)) return;

        message.channel.send(`Server restart queued.`);

        bus.emit(`restart`, `Server is restarting in 1 minute.`)
        client.channels.get(config.discord.channels.chatLogs).send(`Server is restarting in 1 minute.`);
    
        setTimeout(() => {
            bus.emit(`restart`, `Server is restarting in 30 seconds.`)
            client.channels.get(config.discord.channels.chatLogs).send(`Server is restarting in 30 seconds.`);
        }, 1e3 * 30);

        setTimeout(() => {
            bus.emit(`restart`, `Server is restarting in 1 minute.`)
            client.channels.get(config.discord.channels.chatLogs).send(`Server is restarting in 10 seconds.`);
        }, 1e3 * 50);
        setTimeout(() => {

            let sEmbed = new Discord.RichEmbed()
                .setAuthor(`Server Restart`)
                .setColor(0xffa500)
                .setDescription(`Server is restarting...`)
                .setTimestamp(new Date())
                .setFooter(config.discord.footer);
            config.mode == `dev` ? client.channels.get(config.discord.channels.chatLogs).send(`Failed to auto-restart: Server is running in a development environment. Autorestarter can only be used in a production environment.`): client.channels.get(config.discord.channels.chatLogs).send(sEmbed);

            if(config.mode == `prod`) {
                bus.emit(`restart`, `Server is restarting...`)
                exec(`./scripts/restart.${os.platform() == `win32` ? `bat`: `sh`}`);
            }
            else bus.emit(`restart`, `Failed to restart server.`);
        }, 1e3 * 60);
    }
});

client.login(process.env.DISCORD_TOKEN).catch(err => log(`red`, `Failed to connect to Discord.`));

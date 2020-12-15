const config = require(`./config/config.js`);
const Discord = require(`discord.js`);
const dotenv = require(`dotenv`).config();
const log = require(`./utils/log.js`);
const { exec } = require(`child_process`);
const os = require(`os`);

const bus = require(`./utils/messageBus.js`);

const client = new Discord.Client({
    disableEveryone: true,
    sync: true
});

client.on(`ready`, () => {
    log(`green`, `Connected to Discord.`);

    client.user.setActivity(`Krew.io`);
    client.channels.get(config.discord.channels.chatLogs).setTopic(`Server has been up since ${new Date()}.`);

    let sEmbed = new Discord.RichEmbed()
        .setAuthor(`Server Start`)
        .setColor(0x00ff00)
        .setDescription(`Succesfully connected to Discord.`)
        .setTimestamp(new Date())
        .setFooter(config.discord.footer);
    client.channels.get(config.discord.channels.chatLogs).send(sEmbed);


    let xEmbed = new Discord.RichEmbed()
        .setAuthor(`Welcome to the Krew.io Discord Server!`, `https://krew.io/assets/img/favicon-32x32.png`, `https://krew.io/`)
        .setDescription(`
Krew.io is a simple, free, online web game where you, as the krew of a ship, try to destroy other players in other ships.

**What is there to do around here?**
Chat with and meet new people in <#255680271511322624>!
Images and links go in <#257163738258472960>.

Bot commands belong in <#255680159779258369>.
<@235088799074484224> can additionally be used in <#268168871855390720>.

Have a suggestion for the game! Post it in <#268167848579432449>!
You can additionally discuss them in <#701995796278804600>.
Found a bug? Report it in <#293562445581254676>.

As a public Discord server, we are required to enforce the Discord [ToS](https://discord.com/terms) and the [Community Guidelines](https://discord.com/guidelines).
The official website for our game can be found [here](https://krew.io).
`)
        .setColor(0x87ceeb);

        let dEmbed = new Discord.RichEmbed()
        .setAuthor(`Rules`, `https://krew.io/assets/img/favicon-32x32.png`, `https://krew.io/`)
        .setDescription(`
\`1.\` No advertising.
\`2.\` No excessive swearing.
\`3.\` No spamming.
\`4.\` No racism / toxicity / hate speech.
\`5.\` Keep everything SFW (Safe For Work).
\`6.\` No offensive profiles / nicknames.
\`7.\` No voice channel surfing.
\`8.\` No loud noises, soundboards, or voicemods are allowed.
\`9.\` Be excellent to each other. Treat others as they would treat you.
\`10.\` Use common sense. Don't try to find workarounds to these rules.

While you are in the server, you must abide by all rules set forth within it.
You can see the full list of rules down below.

Our staff team reserves the right to mute, kick, or ban users at any time, without warning.
`)
        .setColor(0xffa500);
        let zEmbed = new Discord.RichEmbed()
        .setAuthor(`Roles`, `https://krew.io/assets/img/favicon-32x32.png`, `https://krew.io/`)
        .setDescription(`
There are several roles in this server that can be obtained!
Everyone starts out with the <@&748382020337532959> role.

**Activity Roles:**
These roles are achieveable by becoming active in the server!
To view your progress in reaching your next role, type \`t!rank\` in <#255680159779258369>!

\`1.\` <@&257152560442507264> - 2,500 EXP.
\`2.\` <@&257152557879787521> - 5,000 EXP.
\`3.\` <@&759412798136123422> - 10,000 EXP.
\`4.\` <@&759412644364550154> - 20,000 EXP.
\`5.\` <@&759413005124632617> - 30,000 EXP.
\`6.\` <@&759413667560816731> - 40,000 EXP.
\`7.\` <@&759728917371682846> - 60,000 EXP.

**Special Roles:**
These roles require a special achievement in order to obtain them!

<@&646312786099699742> - Be qualified as so by the \`Pro Player\` requirements.
<@&749394394284818454> - Be qualified as so by the \`Perfect 100\` requirements.
<@&645164729530318858> - Be qualified as so by the \`KrewTuber\` requirements.
<@&740399954430001152> - Make 75+ edits on the [wiki](https://krew-io.fandom.com/wiki/Krew.io_Wiki).
<@&649242857693118464> - Apply to be a bug tester by asking an <@&257153880029134848>.
<@&761439670562455552> - Win a Krew Tournament (held until the next tournament).

**Archived Roles:**
These roles can no longer be earned. They have been retired.

<@&694806397363290158> - Players who bought a special boat on April 1st, 2020.
`)
        .setColor(0xe8d368)

        let bEmbed = new Discord.RichEmbed()
        .setAuthor(`Pro Player`, `https://krew.io/assets/img/favicon-32x32.png`, `https://krew.io/`)
        .setDescription(`
Pro Player is a recognition of a player's outstanding skill and honorability.
The requirements to receive it are as follows:

\`1.\` **You must obtain 1 million gold.**
This can be earned through either trading or pirating.
\`2.\` **You must earn 3 gold medals.**
\`3.\` **The run must be made on Server 1.**
\`4.\` **You cannot have more than 2 deaths.**
\`5.\` **This must be completed in a maximum of 1 hour and 30 minutes.**
This is so that the requirements are skill-based, not 'who has the most free time'.

\`6.\` **Gold must be fairly earned.**
This means no killing crew / teammates for gold or health in fights.
Additionally, 'gifting' gold or a ship is not allowed.
The use of glitches and / or game modifications is not allowed.

\`7.\` **You must be a good sport.**
Be excellent to each other. No trash talking, insulting, or being mean overall. Toxicity of any kind will warrant a removal of the role

Breach of these rules can and likely will lead to loss of the role. Pro Player is an honor and should be treated as such.
If you are applicable for the role, please ping ONE online moderator with visual evidence to receive it.
`)
        .setColor(0x00cc00)

        let nEmbed = new Discord.RichEmbed()
        .setAuthor(`KrewTuber`, `https://krew.io/assets/img/favicon-32x32.png`, `https://krew.io/`)
        .setDescription(`
To become a KrewTuber, you must:

\`1.\` Record a video.
\`2.\` Upload the video to a sharing platform.
\`3.\` Share it in <#257163738258472960> and ask a staff member to review it.
\`4.\` Reach 100 views on a video that shows Krew gameplay.

If you do a good job at recording, we will grant you the role so that you may post your videos in <#698505749961113620>.
Note that you can still lose the role if you insult players, misuse the channel, or violate any other rules set forth.
`)
        .setColor(0xff0000)

        let aEmbed = new Discord.RichEmbed()
        .setAuthor(`Perfect 100`, `https://krew.io/assets/img/favicon-32x32.png`, `https://krew.io/`)
        .setDescription(`
The requirements to be eligible for the Perfect 100 role are:

\`1.\` Gain 100K gold.
\`2.\` Die exactly 100 times.
\`3.\` Kill exactly 100 boats.

'Feeding' kills / gold is not allowed.
If you are applicable for the role, please ping ONE online moderator with visual evidence to receive it.
`)
        .setColor(0x1f5ccf)

        client.channels.get(`255675504454008832`).send(xEmbed);
        client.channels.get(`255675504454008832`).send(dEmbed);
        client.channels.get(`255675504454008832`).send(zEmbed);
        client.channels.get(`255675504454008832`).send(bEmbed);
        client.channels.get(`255675504454008832`).send(nEmbed);
        client.channels.get(`255675504454008832`).send(aEmbed);
    });

bus.on(`msg`, (id, name, message) => {
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

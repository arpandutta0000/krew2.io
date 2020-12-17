const getTimestamp = require(`./log.js`);

let isSpamming = (playerEntity, message) => {
    if(typeof message != `string`) return true;
    if(message.length > 60 && !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
        mutePlayer(player.Entity);
        return true;
    }

    now = new Date();

    if(!playerEntity.lastMessageSentAt) {
        playerEntity.lastMessageSentAt = now;
        playerEntity.sentMessages = [];
        return false;
    }

    if(now - playerEntity.lastMessageSentAt > 1e3 && message.length > 1) {
        playerEntity.sentMessages.push({
            time: new Date(),
            message
        });

        let totalTimeElapsed = 0;
        let charCount = 0;

        playerEntity.sentMessages.forEach(message => {
            totalTimeElapsed += now - message.time;
            charCount += Math.max(message.length, 20);
        });

        if(charCount > 80 && totalTimeElapsed < 6e3) {
            log(`cyan`, `Spam detected for player ${playerEntity.name} sending ${charCount} characters in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
            mutePlayer(playerEntity);
            return true;
        }
        else if(totalTimeElapsed > 4e3) charCount = 0;

        if(playerEntity.sentMessages.length > 2) {
            if(playerEntity.sentMessages[0].message == playerEntity.sentMessages[1].message && playerEntity.sentMessages[0].message == playerEntity.sentMessages[2].message) {
                log(`cyan`, `Spam detected from player ${playerEntity.name} sending same messages multiple times | Server ${playerEntity.serverNumber}.`);
                mutePlayer(playerEntity);

                playerEntity.sentMessages = [];
                return true;
            }
        }

        if(playerEntity.sentMessages.length >= 4) {
            if(playerEntity.sentMessages[3].time - playerEntity.sentMessages[0].time <= 5e3) {
                log(`cyan`, `Spam detected from player ${playerEntity.name} sending ${charCount} charaters in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
                mutePlayer(playerEntity);
                playerEntity.sentMessages = [];
                return true;
            }
        }

        if(playerEntity.sentMessages.length > 4) playerEntity.sentMessages.shift();
        return false;
    }
    else if(now - playerEntity.lastMessageSentAt < 1e3 && now - playerEntity.lastMessageSentAt > 0 && message.length > 1) {
        if(playerEntity.sentMessages.length >= 4) {
            if(playerEntity.sentMessages[3].time - playerEntity.sentMessages[0].time < 4e3) {
                log(`cyan`, `Spam detected from player ${playerEntity.name} sending ${message.length} messages in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
                mutePlayer(playerEntity);

                playerEntity.sentMessages = [];
                return true;
            }
        }
    }
    else if(now - playerEntity.lastMessageSentAt < 0 && message.length > 1) {
        if(playerEntity.spamCount == undefined) playerEntity.spamCount = 1;
        playerEntity.spamCount++;

        if(playerEntity.spamCount == 15) {
            log(`cyan`, `Excessive spam by player ${playerEntity.name} --> KICK | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            playerEntity.socket.disconnect();
        }
        return true;
    }
    else return false;
}

let mutePlayer = playerEntity => {
    log(`cyan`, `Muting player ${playerEntity.name} | Server ${playerEntity.serverNumber}.`);
    playerEntity.lastMessageSentAt = new Date(now.getTime() + 15e3);
}

let charLimit = (text, chars, suffix) => {
    chars = chars || 140;
    suffix = suffix || ``;
    text = (`` + text).replace(/(\t|\n)/gi, ``).replace(/\s\s/gi, ``);
    
    if(text.length > chars) return text.slice(0, chars - suffix.length).replace(/(\.|\,|:|-)?\s?\w+\s?(\.|\,|:|-)?$/, suffix);
    return text;
}

let discordFilter = message => {
    return message
        .replace(`\``, `\\\``)
        .replace(`||`, `\\\|\\\|`)
        .replace(`_`, `\\_`)
        .replace(`*`, `\\*`);
}

module.exports = { isSpamming, mutePlayer, charLimit, discordFilter }

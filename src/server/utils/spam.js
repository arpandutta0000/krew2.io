let now = new Date();
const getTimestamp = require(`./log.js`);

let isSpamming = (playerEntity, message) => {
    if(typeof message != `string`) return true;
    if(message.length > 60 && !playerEntity.isAdmin && !playerEntity.isMod && !playerEntity.isDev) {
        mutePlayer(player.Entity);
        return true;
    }


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
            console.log(`${getTimestamp()} Spam detected for player ${playerEntity.name} sending ${charCount} characters in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
            mutePlayer(playerEntity);
            return true;
        }
        else if(totalTimeElapsed > 4e3) charCount = 0;

        if(playerEntity.setMessages.length > 2) {
            if(playerEntity.sentMessages[0].message == playerEntity.sentMessages[1].message && playerEntity.sentMessages[0].message == playerEntity.sentMessages[2].message) {
                console.log(`${getTimestamp()} Spam detected from player ${playerEntity.name} sending same messages multiple times | Server ${playerEntity.serverNumber}.`);
                mutePlayer(playerEntity);

                playerEntity.sentMessages = [];
                return true;
            }
        }

        if(playerEntity.sentMessages.length >= 4) {
            if(playerEntity.sentMessages[3].time - playerEntity.sentMessages[0].time <= 5e3) {
                console.log(`Spam detected from the user ${playerEntity.name} sending ${charCount} charaters in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
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
                console.log(`${getTimestamp()} Spam detected from player ${playerEntity.name} sending ${message.length} messages in last ${totalTimeElapsed / 1e3} seconds | Server ${playerEntity.serverNumber}.`);
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
            console.log(`${getTimestamp()} Excessive spam by player ${playerEntity.name} --> KICK | IP: ${playerEntity.socket.handshake.address} | Server ${playerEntity.serverNumber}.`);
            playerEntity.socket.disconnect();
        }
        return true;
    }
    else return true;
}

let mutePlayer = playerEntity => {
    console.log(`${getTimestamp()} Muting player ${playerEntity.name} | Server ${playerEntity.serverNumber}.`);
    playerEntity.lastMessageSentAt = new Date(now.getTime() + 15e3);
}

module.exports = { isSpamming, mutePlayer }

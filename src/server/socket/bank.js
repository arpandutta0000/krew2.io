/* Require all needed files, utils, models, variables, etc */
const bus = require(`../utils/messageBus.js`);
const config = require(`../config/config.js`);
const log = require(`../utils/log.js`);
const login = require(`../auth/login.js`);
const md5 = require(`../utils/md5.js`);
const thugConfig = require(`../config/thugConfig`);
const xssFilters = require(`xss-filters`);
const {
    isSpamming,
    mutePlayer,
    charLimit
} = require(`../utils/chat.js`);

let User = require(`../models/user.model.js`);
let Clan = require(`../models/clan.model.js`);
let Ban = require(`../models/ban.model.js`);
let Hacker = require(`../models/hacker.model.js`);
let PlayerRestore = require(`../models/playerRestore.model.js`);

let {
    checkPlayerStatus,
    christmasGold,
    data,
    filter,
    gameCookies,
    isNormalInteger,
    krewioData,
    playerEntity,
    reportedIps,
} = require(`../socketForClients.js`).socketEvents;

// Socket

/* Bank data */
module.exports = async (data) => {
    if (playerEntity.isLoggedIn) {
        if (playerEntity.parent.name == `Labrador` || (playerEntity.parent.anchorIslandId && core.Landmarks[playerEntity.parent.anchorIslandId].name == `Labrador`)) {
            let setBankData = async () => {
                let bankData = {
                    myGold: playerEntity.bank.deposit,
                    totalGold: 0
                }

                // Get the sum of all bank accounts from MongoDB.
                let users = await User.find({}).filter(bankDeposit > 5e4);
                for (const document of users) {
                    bankData.totalGold += document.bankDeposit - 5e4
                }
                socket.emit(`setBankData`, bankData);
            }

            if (data) {
                if (data.deposit && playerEntity.gold >= data.deposit && data.deposit >= 1 && data.deposit <= 15e4 && typeof data.deposit == `number` && data.deposit + playerEntity.bank.deposit <= 15e4) {
                    let integerDeposit = Math.trunc(data.deposit);
                    playerEntity.gold -= integerDeposit;

                    // Handle the deposit.
                    if (playerEntity.bank.deposit >= 5e4) {
                        // If there is already 50K in the bank, don't save the deposit to MongoDB.
                        playerEntity.bank.deposit += integerDeposit;
                    } else if (playerEntity.bank.deposit + integerDeposit > 5e4) {
                        // If the player does not have 50K in the bank, but the deposit will exceed that amount, then store up to 50K in MongoDB and the rest in memory.
                        let excessAmount = (playerEntity.bank.deposit + integerDeposit) - 5e4;
                        playerEntity.bank.deposit += integerDeposit;

                        await User.updateOne({
                            username: playerEntity.name
                        }, {
                            bankDeposit: 5e4
                        });
                    } else {
                        // If the player does not have 50K in the bank, but the deposit will not exceed that amount, then store the new value in MongoDB.
                        playerEntity.bank.deposit += integerDeposit;
                        await User.updateOne({
                            username: playerEntity.name
                        }, {
                            bankDeposit: playerEntity.bank.deposit
                        });
                    }
                    setBankData();
                    log(`magenta`, `Bank deposit | Player: ${playerEntity.name} | Deposit: ${integerDeposit} | IP: ${playerEntity.socket.handshake.address} | Server: ${playerEntity.serverNumber}.`);
                } else if (data.takeDeposit && playerEntity.bank.deposit >= data.takeDeposit && data.takeDeposit >= 1 && data.takeDeposit <= 15e4 && typeof data.takeDeposit == `number`) {
                    let integerDeposit = Math.trunc(data.takeDeposit);

                    // Take 10% fee for bank transaction.
                    playerEntity.gold += integerDeposit * 0.9
                    playerEntity.bankDeposit -= integerDeposit;

                    // Update in MongoDB if player bank deposit is below or equal to 50K.
                    if (playerEntity.bank.deposit <= 5e4) await User.updateOne({
                        username: playerEntity.name
                    }, {
                        bankDeposit: playerEntity.bankDeposit
                    });
                    setBankData();
                } else setBankData();
            }
        }
    } else socket.emit(`setBankData`, {
        warn: 1
    });
}
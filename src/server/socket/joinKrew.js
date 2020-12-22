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



/* If a player joins a krew */
module.exports = (boatId, callback) => {
    let boat = core.boats[boatId];
    if (boat != undefined && boat.isLocked != true) {
        let playerBoat = playerEntity.parent; // Player's boat, or anchored island if they do not own a boat.
        let krewCargoUsed = 0;

        for (let i in boat.children) krewCargoUsed += boat.children[i].cargoUsed;

        let joinCargoAmount = krewCargoUsed + playerEntity.cargoUsed;
        let maxShipCargo = core.boatTypes[boat.shipclassId].cargoSize;

        let emitJoinKrew = id => {
            if (entities[id] && entities[id].socket && entities[id].parent && entities[id].parent.crewName) entities[id].socket.emit(`showCenterMessage`, `You have joined "${entities.id.parent.crewName}"`, 3);
        }

        let movedIds = {}

        let emitNewKrewMembers = () => {
            let names = ``;
            for (let i in movedIds) names += ` ${movedIds[i]},`;
            names = names.replace(/,$/gi, ``).trim();

            for (let id in boat.children) {
                if (entities[id] && entities[id] && movedIds[id] == undefined) {
                    if (Object.keys(movedIds).length == 1)
                        for (let i in movedIds) entities[id].socket.emit(`showCenterMessage`, `New krew member ${movedIds[i]} has joined your krew!`, 3);
                    else if (Object.keys(movedIds).length > 1) entities[id].socket.emit(`showCenterMessage`, `New krew members ${names} have joined your krew!`, 3);
                }
            }
        }
        // Event filtering.
        if (boat && (boat.shipState == 3 || boat.shipState == 2 || boat.shipState == -1 || boat.shipState == 4) &&
            playerBoat && (playerBoat.shipState == 3 || playerBoat.shipState == 2 || boat.shipState == -1 || playerBoat.shipState == 4 || playerBoat.netType == 5) &&
            boat != playerBoat) {
            if (joinCargoAmount > maxShipCargo) {
                playerEntity.socket.emit(`showCenterMessage`, `This krew does not have enough space for your cargo!`, 3);
                callback(1);
            } else {
                callback(0);

                // If player doesn't own a ship.
                if (playerBoat.netType == 5) {
                    boat.addChildren(playerEntity);
                    boat.updateProps();

                    emitJoinKrew(playerEntity.id);
                    movedIds[playerEntity.id] = playerEntity.name;
                } else {
                    // Check if there's enough capacity in target boat.
                    if (Object.keys(boat.children).length < boat.maxKrewCapacity) {
                        // Delete player from the old boat.
                        delete playerBoat.children[playerEntity.id];
                        playerBoat.updateProps();

                        // Add the player to the new boat.
                        boat.addChildren(playerEntity);
                        boat.updateProps();

                        // If the player was originally a captain.
                        if (playerBoat.captainId == playerEntity.id) {
                            playerEntity.isCaptain = false;

                            // Check if the boat has enough space for all players to join.
                            if (Object.keys(playerBoat.children).length + Object.keys(boat.children).length <= boat.maxKrewCapacity) {
                                for (let id in playerBoat.children) {
                                    let krewPlayer = playerBoat.children[id];
                                    boat.addChildren(krewPlayer);
                                    boat.updateProps();

                                    krewPlayer.isCaptain = false;
                                    delete playerBoat.children[krewPlayer.id];
                                    playerBoat.updateProps();

                                    emitJoinKrew(krewPlayer.id);
                                    movedIds[id] = krewPlayer.name;
                                }
                                core.removeEntity(playerBoat);
                            } else {
                                delete playerBoat.children[playerEntity.id];
                                playerBoat.updateProps();

                                emitJoinKrew(playerEntity.id);
                                movedIds[playerEntity.id] = playerEntity.name;

                                if (Object.keys(playerBoat.children).length == 0) core.removeEntity(playerBoat);
                            }
                        }
                    }
                }
                emitNewKrewMembers();

                // Recalculate amount of killed ships and traded cargo (by all crew members).
                let crewKillCount = 0;
                let crewTradeCount = 0;

                for (let i in core.players) {
                    let player = core.players[i];
                    if (player.parent != undefined && playerEntity.parent.id == player.parent.id) {
                        crewKillCount += player.shipsSank;
                        crewTradeCount += player.overall_cargo;
                    }
                }
                playerEntity.parent.overallKills = crewKillCount;
                playerEntity.parent.overall_cargo = crewTradeCount;
            }
        }
    }
}
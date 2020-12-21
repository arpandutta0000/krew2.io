let socket = require(`../socketForClients.js`);

let amountChests = 0;
let respawnChestsDate = undefined;

const log = require(`../utils/log.js`);
log(`green`, `Game is listening at port ${process.env.port}.`);

// Create islands.
for(landmark of core.config.landmarks) core.createLandmark(landmark.type, landmark.x, landmark.y, landmark);

// Create the main game loop.
lastFrameTime = Date.now();

// Update at 60 / 10 fps.
setInterval(() => {
    let thisFrame = Date.now();
    let dt = (thisFrame - lastFrameTime) / 1e3;
    lastFrameTime = thisFrame;

    core.iterateEntities(dt);
    socket.send();
}, 150);

setInterval(() => {
    // Delete residing impacts, pickups, and projectiles every 15 minutes.
    for (entity of core.entities) {
        if (entity.netType == 2 || entity.netType == 3 || entity.netType == 4) {
            if (entity.netType == 4 && entity.type != 1) core.removeEntity(entity);
        }
    }
}, 9e5);

// Slower game loop for general event cleanups and leaderboard.
setInterval(() => {
    // Push player scores to all players every second.
    let scores = {
        players: [],
        boats: []
    }
    let now = new Date();

    for (player of core.players) {
        scores.players.push({
            id: player.id,
            n: player.name,
            s: parseFloat(player.score).toFixed(0),
            pI: player.parent ? player.parent.id : undefined,
            g: parseFloat(player.gold).toFixed(0),
            cU: player.cargoused,
            sS: player.shipsSank,
            ok: player.parent ? player.parent.overall_kills : undefined,
            oc: player.parent ? player.parent.overall_cargo : undefined,
            oql: player.parent ? player.parent.other_quest_level : undefined,
            d: (!player.deaths ? 0 : player.deaths),
            l: player.level,
            c: player.clan,
            cL: player.clanLeader,
            cO: player.clanOwner,
            cR: player.clanRequest
        });

        // If the player has been afk for more than 30 minutes.
        if ((now - player.lastMoved) > 18e5 && !Admins.includes(player.name) && !Mods.includes(player.name) && Devs.includes(player.name)) {
            if (player.socket != undefined) {
                log(`magenta`, `Player ${player.name} was kicked due to AFK timeout | IP: ${player.socket.handshake.address}`);
                player.socket.disconnect();
            }
            core.removeEntity(player);
        }
    }

    // Remove crewless boats and add the boat scores.
    for (let i in core.boats) {
        let boat = core.boats[i];
        // Remove any bots / ghost ships (ships without krew).
        if (boat.krewCount < 1) return core.removeEntity(boat);
        if ((now - boat.lastMoved) > 6e5) boat.recruiting = false;
        if (boat.shipState == 4 & boat.departureTime > 0 && (now - boat.lastMoved) > 1e3) {
            boat.departureTime--;
            boat.lastMoved = new Date();

            if (boat.departureTime <= 0) {
                boat.exitIsland();

                // Make all krew members close their shopping windows.
                for (let i in boat.children) {
                    let boatMember = boat.children[i];
                    if (boatMember != undefined && boatMember.netType == 0) {
                        boatMember.socket.emit(`exitIsland`, {
                            captainId: boat.captainId
                        });
                        boatMember.rareItemsFound = [];

                        boatMember.sentDockingMsg = false;
                        boatMember.checkedItemsList = false;
                    }
                }
            }
        }
        if (boat.krewCount > 0) {
            let boatScoreObj = {
                id: boat.id,
                cN: boat.crewName,
                c: entities[boat.captainId] != undefined ? entities[boat.captainId].clan : ``,
                players: [],
                s: 0,
                g: 0,
                cI: boat.captainId,
                ok: boat.overallKills,
                oc: boat.overallCargo,
                oql: boat.otherQuestLevel
            }
            for (let i in boat.children) {
                let player = boat.children[i];
                let playerObj = {
                    id: player.id,
                    name: player.name,
                    salary: parseFloat(boat.salary).toFixed(0),
                    score: parseFloat(boat.score).toFixed(0),
                    parentId: boat.parent.id,
                    gold: parseFloat(boat.gold).toFixed(0),
                    cargoused: boat.cargoUsed
                }
                if (boatScoreObj.players.length > 0) scores.boats.push(boatScoreObj);
            }
        }
    }

    for (let i in core.Landmarks) {
        let landmark = core.Landmarks[i];

        if (landmark.pickups == undefined) landmark.pickups = {}
        for (let i in landmark.pickups) {
            let pickup = landmark.pickups[i];
            if (pickup == undefined) delete pickup;
        }

        while (Object.keys(landmark.pickups).length < 20) {
            let roll = Math.random();
            let size = roll > 0.9 ? 2 : roll > 0.6 ? 1 : 0;
            let type = roll > 0.4 ? 3 : 2;

            let pickupPosition = {
                x: 0,
                z: 0
            }
            let distanceFromCenter = 0;

            while (distanceFromCenter > landmark.dockRadius - 30 || distanceFromCenter < landmark.dockRadius) {
                pickupPosition.x = Math.floor(Math.random() * ((landmark.position.x + landmark.dockRadius) - (landmark.position.x - landmark.dockRadius)) + landmark.position.x - landmark.dockRadius);
                pickupPosition.z = Math.floor(Math.random() * ((landmark.position.z + landmark.dockRadius) - (landmark.position.z - landmark.dockRadius)) + landmark.position.z - landmark.dockRadius);

                distanceFromCenter = Math.sqrt(
                    (pickupPosition.x - landmark.position.x) *
                    (pickupPosition.x - landmark.position.x) +
                    (pickupPosition.z - landmark.position.z) *
                    (pickupPosition.z - landmark.position.z)
                );
            }

            let pickup = core.createPickup(size, pickupPosition.x, pickupPosition.z, type, false);
            landmark.pickups[pickup.id] = pickup;
        }
    }

    // Fill up the world to the brink with supplies.
    let pickupAmount = Object.keys(core.pickups).length;
    amountChests = 0;

    for (let i in core.pickups)
        if (core.pickups[i].type == 4) amountChests++;

    while (pickupAmount < cratesInSea.min) {
        // Constant amount of crates at sea.
        pickupAmount++;

        let size = 2;
        core.createPickup(size, core.worldsize * Math.random(), core.worldsize * Math.random(), 0, false);
    }

    if (amountChests == 0) {
        if (respawnChestsDate < Date.now()) core.createPickup(4, core.worldsize * Math.random(), core.worldsize * Math.random(), 4, false, (Math.random() * 5e4) + 1e4);
        else if (!respawnChestsDate) respawnChestsDate = Date.now() + (Math.random() * 6e5) + 3e5;
    }

    // Compress the snapshot.
    scores = lzString.compress(JSON.stringify(scores));
    socket.io.emit(`scores`, scores);
}, 1e3);
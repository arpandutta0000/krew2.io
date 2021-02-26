let socket = require(`../socketForClients.js`);
let amountChests = 0;
let respawnChestsDate;

let log = require(`../utils/log.js`);
log(`green`, `Game is listening at port ${process.env.port}.`);

// create islands
for (let i in core.config.landmarks) {
    let landmark = core.config.landmarks[i];
    core.createLandmark(landmark.type, landmark.x, landmark.y, landmark);
}

// the main game loop.
lastFrameTime = Date.now();
setInterval(() => {
    let thisFrame = Date.now();
    let dt = (thisFrame - lastFrameTime) / 1000;
    lastFrameTime = thisFrame;

    core.iterateEntities(dt);

    socket.send();
}, 150); // update at 60/10 fps

/* setInterval(function(){
  global.gc();
  console.log('GC done')
}, 10000); */

setInterval(() => {
    // Delete residing impacts, pickups, and projectiles
    for (e in core.entities) {
        let entity = core.entities[e];
        if (entity.netType === 2 || entity.netType === 3 || entity.netType === 4) {
            if (entity.netType === 4 && entity.type !== 1)
                continue;

            core.removeEntity(entity);
        }
    }
}, 900000); // clean the game each 15 minutes

// slower game loop for general event clean-ups and leaderboard
setInterval(() => {
    // push player scores to all players every second
    let scores = {
        players: [],
        boats: []
    };
    let now = new Date();

    for (i in core.players) {
        let player = core.players[i];
        scores.players.push({
            id: player.id,
            n: player.name,
            // salary: parseFloat(player.salary).toFixed(0),
            s: parseFloat(player.score).toFixed(0),
            pI: player.parent ? player.parent.id : undefined,
            g: parseFloat(player.gold).toFixed(0),
            cU: player.cargoUsed,
            sS: player.shipsSank,
            ok: player.parent ? player.parent.overall_kills : undefined,
            oc: player.parent ? player.parent.overall_cargo : undefined,
            oql: player.parent ? player.parent.other_quest_level : undefined,
            d: (player.deaths === undefined ? 0 : player.deaths),
            l: player.level,
            c: player.clan,
            cL: player.clanLeader,
            cO: player.clanOwner,
            cR: player.clanRequest
        });

        // If the player has been AFK for more than 30 minutes.
        if ((now - player.lastMoved) > 18e5 && !Admins.includes(player.name) && !Mods.includes(player.name) && !Helpers.includes(player.name) && !Designers.includes(player.name)) {
            if (player.socket) {
                // If he is the only player on his ship, then delete his boat with the loot.
                if (player.parent && player.isCaptain && Object.keys(player.parent.children).length === 1) {
                    player.parent.hp = 0;

                    // Remove the boat after 15 seconds.
                    if (!player.removeBoat) player.removeBoat = setTimeout(() => core.removeEntity(player.parent), 15e3);
                }

                if (!player.isBeingDisconnected) {
                    player.isBeingDisconnected = true;
                    log(`cyan`, `Player ${player.name} was kicked for being AFK | IP: ${player.socket.handshake.address} | Server ${player.serverNumber}.`);
                    player.socket.emit(`showCenterMessage`, `You were kicked for being AFK.`, 1, 36e5);
                    player.socket.disconnect();
                }

                if (!player.removePlayer) player.removePlayer = setTimeout(() => core.removeEntity(player), 15e3);
            }
        }
    }

    // remove crewless boats and add the boat scores
    for (j in core.boats) {
        let boat = core.boats[j];

        // boat.updateProps();

        // this will remove bots for some reason
        if (boat.krewCount <= 0) {
            core.removeEntity(boat);
            continue;
        }

        if ((now - boat.lastMoved) > 600000) {
            boat.recruiting = false;
        }

        if (boat.shipState === 4 && boat.departureTime > 0 && (now - boat.lastMoved) > 1000) {
            boat.departureTime--;
            boat.lastMoved = new Date();
            if (boat.departureTime <= 0) {
                boat.exitIsland();

                // make all krew members close their shopping windows
                for (i in boat.children) {
                    let boatMember = boat.children[i];
                    if (boatMember !== undefined && boatMember.netType === 0) {
                        boatMember.socket.emit(`exitIsland`, {
                            captainId: boat.captainId
                        });
                        boatMember.sentDockingMsg = false;
                        boatMember.checkedItemsList = false;
                        boatMember.rareItemsFound = [];
                    }
                }
            }
        }

        if (boat.krewCount > 0) {
            let boatScoreObj = {
                id: boat.id,
                cN: boat.crewName,
                c: entities[boat.captainId] !== undefined ? entities[boat.captainId].clan : ``,
                players: [],
                // salary: 0,
                s: 0,
                g: 0,
                cI: boat.captainId,
                ok: boat.overall_kills,
                oc: boat.overall_cargo,
                oql: boat.other_quest_level
            };
            for (let id in boat.children) {
                let playerObj = {
                    id: boat.children[id].id,
                    name: boat.children[id].name,
                    salary: parseFloat(boat.children[id].salary).toFixed(0),
                    score: parseFloat(boat.children[id].score).toFixed(0),
                    parentId: boat.children[id].parent.id,
                    gold: parseFloat(boat.children[id].gold).toFixed(0),
                    cargoUsed: boat.children[id].cargoUsed
                };
                // boatScoreObj.salary += parseInt(playerObj.salary);
                boatScoreObj.s += parseInt(playerObj.score);
                boatScoreObj.g += parseInt(playerObj.gold);
                boatScoreObj.players.push(playerObj);
            }

            if (boatScoreObj.players.length > 0) {
                scores.boats.push(boatScoreObj);
            }
        }
    }

    for (let i in core.Landmarks) {
        let landmark = core.Landmarks[i];
        if (landmark.pickups === undefined) {
            landmark.pickups = {};
        }

        for (let pickupId in landmark.pickups) {
            if (core.entities[pickupId] === undefined) {
                delete landmark.pickups[pickupId];
            }
        }

        while (Object.keys(landmark.pickups).length < 20) {
            let roll = Math.random();
            let size = roll > 0.9 ? 2 : roll > 0.6 ? 1 : 0;
            let type = roll > 0.4 ? 3 : 2;

            let pickupPosition = {
                x: 0,
                z: 0
            };
            let distanceFromCenter = 0;

            while (
                distanceFromCenter > landmark.dockRadius - 30 ||
                distanceFromCenter < landmark.dockRadius - 40
            ) {
                pickupPosition.x = Math.floor(
                    Math.random() * (
                        (landmark.position.x + landmark.dockRadius) -
                        (landmark.position.x - landmark.dockRadius)
                    )
                ) + (landmark.position.x - landmark.dockRadius);

                pickupPosition.z = Math.floor(
                    Math.random() * (
                        (landmark.position.z + landmark.dockRadius) -
                        (landmark.position.z - landmark.dockRadius)
                    )
                ) + (landmark.position.z - landmark.dockRadius);

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

    // fill up the world to the brink with supplies
    let pickUpAmount = Object.keys(core.pickups).length;
    amountChests = 0;
    for (x in core.pickups) {
        if (core.pickups[x].type === 4) {
            amountChests++;
        }
    }
    if (pickUpAmount > maxAmountCratesInSea) {
        for (p in core.pickups) {
            let pickup = core.pickups[p];
            core.removeEntity(pickup);
        }
    }

    while (pickUpAmount < minAmountCratesInSea) { // Constant amount of crates at sea
        ++pickUpAmount;
        let size = 2;
        // random crates size
        // let roll = Math.random();
        // if (roll > 0.6) { size = 1; }
        // if (roll > 0.9) { size = 2; }

        core.createPickup(size, core.worldsize * Math.random(), core.worldsize * Math.random(), 0, false);
    }

    if (amountChests === 0) {
        if (respawnChestsDate < Date.now()) {
            let size = 4;
            core.createPickup(size, core.worldsize * Math.random(), core.worldsize * Math.random(), 4, false, (10000 + Math.random() * (60000 - 10000)));
            io.emit(`showCenterMessage`, `The old pirate threw his treasure chest! Hurry to pick up the gold first!`, 4, 5000);
            respawnChestsDate = undefined;
        } else {
            if (respawnChestsDate === undefined) {
                respawnChestsDate = Date.now() + 300000 + Math.random() * (900000 - 300000);
            }
        }
    }

    // compress the snapshot data with lz-string
    scores = lzString.compress(JSON.stringify(scores));

    socket.io.emit(`scores`, scores);

    // console.log(Object.keys(core.entities).length);
}, 1000);

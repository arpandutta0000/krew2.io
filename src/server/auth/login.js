const User = require(`../models/user.model.js`);

let spawnNewPlayerOnSea = (boat, playerEntity) => {
    User.findOne({
        username: playerEntity.name
    }).then(user => {
        let krewName = user ? user.defaultKrewName ? user.defaultKrewName : `${playerEntity.name}'s krew` : `${playerEntity.name}'s krew`;

        boat = core.createBoat(playerEntity.name, krewName, true);
        boat.addChildren(playerEntity);

        boat.shipState = 0;
        boat.krewCount++;

        boat.isRecruiting = false;
        boat.isLocked = false;
    });
};

let allocatePlayerToBoat = (playerEntity, boatId, spawnPoint) => {
    User.findOne({
        username: playerEntity.name
    }).then(user => {
        let krewName = user ? user.defaultKrewName ? user.defaultKrewName : `${playerEntity.name}'s krew` : `${playerEntity.name}'s krew`;

        let islandNames = [];
        for (landmark of Object.values(core.Landmarks)) {
            islandNames.push(landmark.name.toString().toLowerCase());
        }

        let boat = core.boats[boatId];

        // If player is using invite link.
        if (boat && !boat.isLocked) {
            boat.updateProps();

            // Assign the player to the boat if there is enough space on the krew.
            if (boat.krewCount < boat.maxKrewCapacity) {
                boat.addChildren(playerEntity);
                boat.updateProps();
            } else {
                // If there isn't enough space, create a new raft and spawn it on the water.
                spawnNewPlayerOnSea(boat, playerEntity);
            }
        } else if (spawnPoint) {
            // If the player is not using an invite link.
            if (spawnPoint === `sea`) spawnNewPlayerOnSea(boat, playerEntity);
            else if (spawnPoint === `island` || islandNames.includes(spawnPoint)) {
                let spawnIsland = islandNames.includes(spawnPoint) ? core.Landmarks[Object.keys(core.Landmarks)[islandNames.indexOf(spawnPoint)]] : core.Landmarks[Object.keys(core.Landmarks)[Math.floor(Math.random() * Object.keys(core.Landmarks).length)]];

                if (spawnIsland.spawnPlayers) {
                    spawnIsland.addChildren(playerEntity);

                    // Create a new boat for the player.
                    setTimeout(() => {
                        let boat = core.createBoat(playerEntity.id, krewName, false);

                        boat.addChildren(playerEntity);

                        boat.departureTime = 5;

                        boat.recruiting = true;
                        boat.isLocked = false;

                        boat.shipState = 3;

                        boat.setShipClass(1);
                        boat.updateProps();
                    }, 200);
                } else spawnNewPlayerOnSea(boat, playerEntity);
            } else if (spawnPoint === `krew`) {
                // Get all krews with a free spot on board.
                let availableKrews = Object.values(core.boats).filter(boat => boat.krewCount < boat.maxKrewCapacity && !boat.isLocked);

                // Add the player if a suitable krew is available.
                if (availableKrews.length !== 0) {
                    boat = availableKrews[Math.floor(Math.random() * availableKrews.length)];
                    boat = core.boats[boat.id];

                    boat.addChildren(playerEntity);
                    boat.updateProps();

                    // Give the player 500 gold because he has no own raft.
                    playerEntity.gold += 500;
                } else spawnNewPlayerOnSea(boat, playerEntity);
            } else {
                // Spawning on island as captain.
                let spawnIsland = Object.values(core.Landmarks).find(island => island.name.toLowerCase() === spawnPoint);
                if (!spawnIsland) spawnNewPlayerOnSea(boat, playerEntity);
                else {
                    spawnIsland.addChildren(playerEntity);

                    // Create a new boat for the player.
                    playerEntity.gold += 500;
                    setTimeout(() => {
                        let boat = core.createBoat(playerEntity.id, krewName, false);

                        boat.addChildren(playerEntity);

                        boat.departureTime = 5;

                        boat.recruiting = true;
                        boat.isLocked = false;

                        boat.shipState = 3;

                        boat.setShipClass(1);
                        boat.updateProps();
                    }, 200);
                }
            }
        } else spawnNewPlayerOnSea(boat, playerEntity);

        setTimeout(() => {
            playerEntity.disableSnapAndDelta = false;
            playerEntity.socket.emit(`startGame`);

            if (DEV_ENV && spawnPoint && spawnPoint !== `sea` && spawnPoint !== `krew`) playerEntity.gold += 1e9;
        }, 1e3);
    });
};

module.exports = {
    allocatePlayerToBoat
};

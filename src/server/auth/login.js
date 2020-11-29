let createBoatForPlayer = playerEntity => {
    // Create a new boat for the player.
    playerEntity.gold += 500;
    setTimeout(() => playerEntity.purchaseShip(1, `${playerEntity.name}'s krew`), 200);
}

let allocatePlayerToBoat = (playerEntity, boatID, spawnPoint) => {
    let boat = core.boats[boatID];

    // If player is using invite link.
    if(boat) {
        boat.updateProps();

        // Assign the player to the boat if there is enough space on the krew.
        if(boat.krewCount < boat.maxKrewCapacity) {
            boat.addChildren(playerEntity);
            return boat.updateProps();
        }
        else {
            // If there isn't enough space, create a new raft and spawn it on the water.
            return spawnNewPlayerOnSea(boat, playerEntity);
        }
    }
    else if(spawnPoint) {
        // If the player is not using an invite link.
        if(spawnPoint == `sea`) spawnNewPlayerOnSea(boat, playerEntity);
        else if(spawnPoint == `island`) {
            let spawnIslands = core.Landmarks.filter(island => island.spawnPlayers);
            let spawnIsland = spawnIslands[Object.keys(spawnIslands)[Math.floor(Math.random() * (Object.keys(core.Landmarks).length))]];

            spawnIsland.addChildren(playerEntity);
            return createBoatForPlayer(playerEntity);
        }
        else if(spawnPoint == `krew`) {
            // Get all krews with a free spot on board.
            let availableKrews = core.boats.filter(boat => boat.krewCount < boat.maxKrewCapacity && !boat.isLocked);

            // Add the player if a suitable krew is available.
            if(availableKrews.length != 0) {
                boat = availableKrews[Math.floor(Math.random() * availableKrews.length)];
                boat.updateProps();

                // Give the player 500 gold because he has no own raft.
                return playerEntity.gold += 500;
            }
            else return spawnNewPlayerOnSea(boat, playerEntity);
        }
        else {
            // Spawning on island as captain.
            let spawnIsland = core.Landmarks.find(island => island.name.toLowerCase() == spawnPoint);
            if(!spawnIsland) return spawnNewPlayerOnSea(boat, playerEntity);

            spawnIsland.addChildren(playerEntity);
            return createBoatForPlayer(playerEntity);
        }
    }
}

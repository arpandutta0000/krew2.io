var allocatePlayerToBoat = function (playerEntity, boatId, spawnPoint) {
    var boat = core.boats[boatId];

    // player is using invite link
    if (boat) {
        boat.updateProps();

        // assign the player to the boat if there is enough space on the krew
        if (boat.krewCount < boat.maxKrewCapacity) {
            boat.addChildren(playerEntity);
            boat.updateProps();
        }
        // if there isn't enough space, create a new raft and spawn on the water
        else {
            spawnNewPlayerOnSea(boat, playerEntity)
        }
    }

    //if the player does not use an invite link
    else if (spawnPoint){
        // spawning somewhere on the sea with raft
        if (spawnPoint === 'sea') {
            // create a new boat for the player
            spawnNewPlayerOnSea(boat, playerEntity)
        }

        // spawning on an island (as captain)
        else if (spawnPoint === 'island') {
            var spawnIsland = {};
            while (!spawnIsland.spawnPlayers) {
                spawnIsland = core.Landmarks[Object.keys(core.Landmarks)[Math.round(Math.random() * (Object.keys(core.Landmarks).length - 1))]];
            }
            spawnIsland.addChildren(playerEntity);
            // create a new boat for the player
            playerEntity.gold += 500;
            setTimeout(function () {
                playerEntity.purchaseShip(1, playerEntity.name + "'s krew");
            }, 200);
        }
        // spawning on Guinea (as captain)
        else if (spawnPoint === 'guinea') {
            var spawnIsland = {};
                for (var z in core.Landmarks){
                    if (core.Landmarks[z].name ==='Guinea'){
                        spawnIsland = core.Landmarks[z];
                    }
                }
            spawnIsland.addChildren(playerEntity);
            // create a new boat for the player
            playerEntity.gold += 500;
            setTimeout(function () {
                playerEntity.purchaseShip(1, playerEntity.name + "'s krew");
            }, 200);
        }
        // spawning on Spain (as captain)
        else if (spawnPoint === 'spain') {
            var spawnIsland = {};
                for (var z in core.Landmarks){
                    if (core.Landmarks[z].name ==='Spain'){
                        spawnIsland = core.Landmarks[z];
                    }
                }
            spawnIsland.addChildren(playerEntity);
            // create a new boat for the player
            playerEntity.gold += 500;
            setTimeout(function () {
                playerEntity.purchaseShip(1, playerEntity.name + "'s krew");
            }, 200);
        }
        // spawning on Labrador (as captain)
        else if (spawnPoint === 'labrador') {
            var spawnIsland = {};
                for (var z in core.Landmarks){
                    if (core.Landmarks[z].name ==='Labrador'){
                        spawnIsland = core.Landmarks[z];
                    }
                }
            spawnIsland.addChildren(playerEntity);
            // create a new boat for the player
            playerEntity.gold += 500;
            setTimeout(function () {
                playerEntity.purchaseShip(1, playerEntity.name + "'s krew");
            }, 200);
        }
        // spawning on Brazil (as captain)
        else if (spawnPoint === 'brazil') {
            var spawnIsland = {};
                for (var z in core.Landmarks){
                    if (core.Landmarks[z].name ==='Brazil'){
                        spawnIsland = core.Landmarks[z];
                    }
                }
            spawnIsland.addChildren(playerEntity);
            // create a new boat for the player
            playerEntity.gold += 500;
            setTimeout(function () {
                playerEntity.purchaseShip(1, playerEntity.name + "'s krew");
            }, 200);
        }

        // spawning on a random krew
        else if (spawnPoint === 'krew') {
            // get all krews with a free place on board
            var krewsWithSpace = [];
            for (var b in core.boats) {
                if (core.boats[b].krewCount < core.boats[b].maxKrewCapacity && core.boats[b].isLocked !== true) {
                    krewsWithSpace.push(core.boats[b])
                }
            }
            // add the player if a suitable krew is available
            if (krewsWithSpace.length !== 0) {
                boat = krewsWithSpace[Math.floor(Math.random() * krewsWithSpace.length)];
                boat.updateProps();
                // assign the player to the boat if there is space on the krew
                if (boat.krewCount < boat.maxKrewCapacity) {
                    boat.addChildren(playerEntity);
                    boat.updateProps();
                }
                // give the player 500 gold because he has no own raft
                playerEntity.gold += 500;
            }
            // if there isn't any krew with enough space, spawn on a own raft randomly in the water
            else {
                spawnNewPlayerOnSea(boat, playerEntity)
            }
        }
        else { // if spawnPoint !== sea or island or krew make spawn in the sea
            // create a new boat for the player
            spawnNewPlayerOnSea(boat, playerEntity)
        }

    }
    else { // default make spawn in the sea
        // create a new boat for the player
        spawnNewPlayerOnSea(boat, playerEntity)
    }
    setTimeout(function (){
      playerEntity.disableSnapAndDelta = false;
      playerEntity.socket.emit('startGame');
    }, 1000);
};

var spawnNewPlayerOnSea = function (boat, playerEntity) {
    boat = core.createBoat(playerEntity.name, playerEntity.name + "'s krew", true);
    boat.addChildren(playerEntity);
    boat.shipState = 0;
    boat.krewCount++;
    boat.recruiting = false;
    boat.isLocked = false;
};

exports.allocatePlayerToBoat = allocatePlayerToBoat;

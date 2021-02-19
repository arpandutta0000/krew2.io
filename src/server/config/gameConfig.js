let Config = {
    worldsize: 1000, // 1000 is default.
    startingItems: {
        gold: 0,

        // Only the items in here can be traded by the player.
        goods: {
            rum: 0,
            coffee: 0,
            spice: 0,
            silk: 0,
            gems: 0,
            sugar: 0,
            bananas: 0
        }
    },
    drainers: {},
    landmarks: [{
            type: 0,
            x: 500,
            y: 500,
            name: `Zanzibar`,
            dockRadius: 100,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 1e4,
                coffee: 1e4,
                spice: 1e4,
                silk: 1e4,
                gems: 1e4,
                sugar: 1e4,
                bananas: 1e4
            }
        }
    ]
};
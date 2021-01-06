let Config = {
    worldsize: 2500, // 1000 is default.
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
            y: 300,
            name: `Spain`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 1300,
            y: 500,
            name: `Philippines`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 1900,
            y: 700,
            name: `Guinea`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 2100,
            y: 1300,
            name: `Malaysia`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 2000,
            y: 2300,
            name: `Brazil`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 1500,
            y: 2000,
            name: `Barbados`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 600,
            y: 2200,
            name: `Taiwan`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 700,
            y: 1600,
            name: `Cuba`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 400,
            y: 1100,
            name: `Labrador`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        },
        {
            type: 0,
            x: 1250,
            y: 1250,
            name: `Jamaica`,
            dockRadius: 100,
            spawnPlayers: true,
            onlySellOwnShips: true,
            goodsPrice: {
                rum: 50,
                coffee: 50,
                spice: 50,
                silk: 50,
                gems: 50,
                sugar: 50,
                bananas: 50
            }
        }
    ]
}
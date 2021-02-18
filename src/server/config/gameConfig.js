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
                rum: 135,
                coffee: 55,
                spice: 65,
                silk: 120,
                gems: 160,
                sugar: 160,
                bananas: 75
            }
        },
        {
            type: 0,
            x: 1300,
            y: 500,
            name: `Philippines`,
            dockRadius: 80,
            spawnPlayers: false,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 110,
                coffee: 60,
                spice: 65,
                silk: 125,
                gems: 150,
                sugar: 200,
                bananas: 100
            }
        },
        {
            type: 0,
            x: 1900,
            y: 700,
            name: `Guinea`,
            dockRadius: 80,
            spawnPlayers: false,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 145,
                coffee: 65,
                spice: 70,
                silk: 145,
                gems: 175,
                sugar: 225,
                bananas: 145
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
                rum: 155,
                coffee: 95,
                spice: 125,
                silk: 165,
                gems: 175,
                sugar: 100,
                bananas: 150
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
                rum: 160,
                coffee: 120,
                spice: 135,
                silk: 175,
                gems: 200,
                sugar: 120,
                bananas: 30
            }
        },
        {
            type: 0,
            x: 1500,
            y: 2000,
            name: `Barbados`,
            dockRadius: 80,
            spawnPlayers: false,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 175,
                coffee: 30,
                spice: 150,
                silk: 200,
                gems: 215,
                sugar: 125,
                bananas: 40
            }
        },
        {
            type: 0,
            x: 600,
            y: 2200,
            name: `Taiwan`,
            dockRadius: 80,
            spawnPlayers: false,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 210,
                coffee: 35,
                spice: 50,
                silk: 275,
                gems: 265,
                sugar: 130,
                bananas: 45
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
                rum: 225,
                coffee: 40,
                spice: 75,
                silk: 100,
                gems: 290,
                sugar: 160,
                bananas: 60
            }
        },
        {
            type: 0,
            x: 400,
            y: 1100,
            name: `Labrador`,
            dockRadius: 80,
            spawnPlayers: false,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 90,
                coffee: 45,
                spice: 80,
                silk: 110,
                gems: 300,
                sugar: 175,
                bananas: 75
            }
        },
        {
            type: 0,
            x: 1250,
            y: 1250,
            name: `Jamaica`,
            dockRadius: 100,
            spawnPlayers: false,
            onlySellOwnShips: true,
            goodsPrice: {
                rum: 100,
                coffee: 55,
                spice: 100,
                silk: 120,
                gems: 250,
                sugar: 200,
                bananas: 75
            }
        }
    ]
};
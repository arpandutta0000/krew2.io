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
    landmarks: [
        {
            type: 0,
            x: 500,
            y: 300,
            name: `Spain`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 155,
                coffee: 55,
                spice: 210,
                silk: 140,
                gems: 210,
                sugar: 250,
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
                rum: 145,
                coffee: 60,
                spice: 270,
                silk: 155,
                gems: 55,
                sugar: 290,
                bananas: 120
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
                rum: 155,
                coffee: 65,
                spice: 35,
                silk: 170,
                gems: 170,
                sugar: 325,
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
                rum: 165,
                coffee: 95,
                spice: 135,
                silk: 185,
                gems: 300,
                sugar: 65,
                bananas: 190
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
                rum: 180,
                coffee: 125,
                spice: 210,
                silk: 200,
                gems: 375,
                sugar: 130,
                bananas: 20
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
                rum: 195,
                coffee: 25,
                spice: 270,
                silk: 220,
                gems: 400,
                sugar: 145,
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
                spice: 35,
                silk: 375,
                gems: 475,
                sugar: 180,
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
                rum: 270,
                coffee: 40,
                spice: 90,
                silk: 70,
                gems: 525,
                sugar: 190,
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
                rum: 70,
                coffee: 45,
                spice: 120,
                silk: 110,
                gems: 625,
                sugar: 215,
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
                rum: 170,
                coffee: 55,
                spice: 130,
                silk: 170,
                gems: 375,
                sugar: 210,
                bananas: 110
            }
        }
    ]
};

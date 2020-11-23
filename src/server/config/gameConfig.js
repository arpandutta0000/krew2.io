let Config = {
    startingItems: {
        gold: 0,

        // Only the items in here can be traded by the player.
        goods: {
            rum: 0,
            coffee: 0,
            spice: 0,
            silk: 0
        }
    },
    drainers: {},
    landmarks: [
        {
            type: 0,
            x: 350,
            y: 350,
            name: `Guinea`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 38,
                coffee: 22,
                spice: 22,
                silk: 310
            }
        },
        {
            type: 0,
            x: 1350,
            y: 350,
            name: `Spain`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 52,
                coffee: 65,
                spice: 35,
                silk: 180
            }
        },
        {
            type: 0,
            x: 350,
            y: 1350,
            name: `Labrador`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 48,
                coffee: 40,
                spice: 14,
                silk: 230
            }
        },
        {
            type: 0,
            x: 1350,
            y: 1350,
            name: `Brazil`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 60,
                coffee: 26,
                spice: 25,
                silk: 150
            }
        },
        {
            type: 0,
            x: 850,
            y: 850,
            name: `Jamaica`,
            dockRadius: 100,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 32,
                coffee: 70,
                spice: 40,
                silk: 240
            }
        },
        {
            type: 0,
            x: 350,
            y: 350,
            name: `Guinea`,
            dockRadius: 80,
            spawnPlayers: true,
            onlySellOwnShips: false,
            goodsPrice: {
                rum: 0,
                coffee: 0,
                spice: 0,
                silk: 0
            }
        }
    ]
}
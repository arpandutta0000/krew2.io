var Config = {
    startingItems: {
        gold: 0,

        // Only the items in here can be traded by the player
        goods: {
            rum: 0,
            coffee: 0,
            spice: 0,
            silk: 0,

            // water: 50,
            // food: 50
        },
    },
    drainers: {
        // water: { rate: 1, time: 10 },
        // food: { rate: 1, time: 10 },
        // wood: { rate: 1, time: undefined },
        // gunpowder: { rate: 1, time: undefined },
    },

    landmarks: [
        {
            type: 0, x: 350, y: 350, name: 'Guinea', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 38, coffee: 22, spice: 22, silk: 310, water: 1, food: 1 },
            goodsPrice: { rum: 38, coffee: 22, spice: 22, silk: 310 },
        },
        {
            type: 0, x: 1350, y: 350, name: 'Spain', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 52, coffee: 65, spice: 35, silk: 180, water: 1, food: 1 },
            goodsPrice: { rum: 52, coffee: 65, spice: 35, silk: 180 },
        },
        {
            type: 0, x: 350, y: 1350, name: 'Labrador', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 22, coffee: 40, spice: 25, silk: 230, water: 1, food: 1 },
            goodsPrice: { rum: 48, coffee: 40, spice: 14, silk: 230 },
        },
        {
            type: 0, x: 1350, y: 1350, name: 'Brazil', dockRadius: 80, spawnPlayers: true, onlySellOwnShips: false,
            // goodsPrice: { rum: 28, coffee: 26, spice: 14, silk: 150, water: 1, food: 1 },
            goodsPrice: { rum: 60, coffee: 26, spice: 25, silk: 150 },
        },
        {
            type: 0, x: 850, y: 850, name: 'Jamaica', dockRadius: 100, spawnPlayers: false, onlySellOwnShips: true,
            // goodsPrice: { rum: 56, coffee: 70, spice: 40, silk: 240, water: 1, food: 1 },
            goodsPrice: { rum: 32, coffee: 70, spice: 40, silk: 240 },
        },

    ],
};

// ultimately, restructure files into this structure

// core_goods.js
// var goods_types = {
//     water: {
//         drainRate: 1, // every day, how fast is it draining while saling?
//         cargoSpace: 1 // how much cargo space does this good use per unit?
//     },
//     food: {

//     },
//     gunpowder: {

//     },
//     silk: {

//     }
// }

// core_landmarks_types.js
// var landmarks = [
//     {
//         name: 'Labrador',
//         type: 0,
//         x: 200,
//         y: 200,
//         goods: {
//             water {

//             }
//             rum: 3, coffee: 3, spice: 2, silk: 1, water: 200, food: 200
//         }
//     },
//     {
//         name: 'Brazil',
//         type: 0,
//         x: 800,
//         y: 700,
//         goodsPrice: { rum: 2, coffee: 2, spice: 2, silk: 2, water: 200, food: 200 }
//     },
//     {
//         type: 0, x: 700, y: 300, name: 'Spain',
//         goodsPrice: { rum: 1, coffee: 1, spice: 2, silk: 2, water: 200, food: 200 }
//     },
//     {
//         type: 0, x: 200, y: 800, name: 'Guinea',
//         goodsPrice: { rum: 2, coffee: 1, spice: 2, silk: 3, water: 200, food: 200 }
//     }
// ]

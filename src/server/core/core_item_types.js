// Make a clone of get ships function
// items to be available at specific islands
// Rarity maybe?

var itemTypes = [
    // {
    //     id: 0,
    //     name: "Cannon",
    //     Description: 'Cannon for seadog',
    //     price: 500,
    //     rarity: 1,
    //     availableAt: [],
    //     // availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
    // },
    // {
    //     id: 1,
    //     name: "Fishing rod",
    //     Description: 'Fishing rod for seadog (used for fishing)',
    //     price: 500,
    //     rarity: 1,
    //     availableAt: [],
    //     // availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
    // },
    /*{
        id: 2,
        name: "Rapid cannon",
        Description: 'Replace your normal cannon with a faster one (30% faster attack speed)',
        price: 20000,
        rarity: 1,
        availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
        attributes: {
            attackSpeed: '30',
        },
    },
    {
        id: 3,
        name: "Lunar fishing rod",
        Description: 'Grants you a higher catching chance of catching better rewards',
        price: 20000,
        rarity: 1,
        availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
        attributes: {
            catchChance: '20',
        },
    },
    {
        id: 4,
        name: "Annihilator",
        Description: 'Cannon used by legendary pirate captains</br>+6 Attack Damage</br>25% faster attack speed',
        price: 50000,
        rarity: 1,
        availableAt: ['Spain', 'Brazil','Labrador','Guinea'],
        attributes: {
            attackSpeed: "25",
            attackDamage: "6"
        },
    },*/
    {
        id: 2,
        name: "Sinker's Gloves",
        Description: '+25 cannon fire rate',
        price: 45000,
        rarity: 0.2,
        availableAt: ['Spain', 'Brazil'],
        attributes: {
            attackSpeed: '25',
        },
    },
    {
        id: 3,
        name: 'Steel Barrel',
        Description: '+30 cannon distance',
        price: 35000,
        rarity: 0.6,
        availableAt: ['Labrador'],
        attributes: {
            attackDistance: '30',
        },
    },
    {
        id: 4,
        name: 'Air Pegleg',
        Description: '+1 ship speed (only works if you are captain)',
        price: 22000,
        rarity: 0.3,
        availableAt: ['Jamaica'],
        attributes: {
            movementSpeed: '100',
        },
    },
    {
        id: 5,
        name: 'Blue Gunpowder',
        Description: '+8 cannon damage',
        price: 50000,
        rarity: 0.25,
        availableAt: ['Jamaica'],
        attributes: {
            attackDamage: '8',
        },
    },
    {
        id: 6,
        name: "Cannon distance upgrade",
        Description: "+5 cannon distance",
        price: 4000,
        rarity: 1,
        attributes: {
            attackDistance: "5"
        }
    },
    {
        id: 7,
        name: "Attack speed upgrade",
        Description: "+5 cannon fire rate",
        price: 2000,
        rarity: 1,
        attributes: {
            attackSpeed: "5"
        }
    },
    {
        id: 8,
        name: "Damage upgrade",
        Description: "+5 cannon damage",
        price: 5000,
        rarity: 1,
        attributes: {
            attackDamage: "5"
        }
    },
    {
        id: 9,
        name: "Ship Speed Upgrade",
        Description: "+0.2 ship speed (only works if you are captain)",
        price: 3000,
        rarity: 1,
        attributes: {
            movementSpeed: "20"
        }
    },
    {
        id: 10,
        name: "Bruiser",
        Description: "+2 cannon damage</br>+10 cannon fire rate",
        price: 20000,
        rarity: 0.35,
        availableAt: ['Spain', 'Brazil'],
        attributes: {
            attackSpeed: "10",
            attackDamage: "2"
        }
    },
    {
        id: 11,
        name: "Demolisher",
        Description: "+4 cannon damage</br>+25 cannon fire rate</br></br>Requirements:</br>- Sink 10 ships</br>- Trade goods worth 100,000 gold",
        price: 100000,
        rarity: 1,
        availableAt: ['Jamaica'],
        attributes: {
            attackSpeed: "25",
            attackDamage: "4"
        }
    },
    {
        id: 12,
        name: "Drifter",
        Description: "+2 cannon damage</br>+0.5 ship speed (only works if you are captain)",
        price: 25000,
        rarity: 0.45,
        availableAt: ['Guinea', 'Labrador'],
        attributes: {
            attackDamage: "2",
            movementSpeed: "50"
        }
    },
    {
        id: 13,
        name: "Reinforced Planks",
        Description: "+25% to protect your ship (only works if you are captain)",
        price: 35000,
        rarity: 0.45,
        availableAt: ['Brazil'],
        attributes: {
            armor: "25"
        }
    },
    {
        id: 14,
        name: "Fountain of youth",
        Description: "New chance to allocate all your skill points.</br>Can only be bought once",
        price: 150000,
        rarity: 0.33,
        availableAt: ['Jamaica'],
    },
];
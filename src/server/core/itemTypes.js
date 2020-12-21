// Make a clone of get ships function
// items to be available at specific islands
// Rarity maybe?

let itemTypes = [{
        id: 2,
        name: `Sinker's Gloves`,
        Description: `+25 cannon fire rate`,
        price: 45e3,
        rarity: 0.2,
        availableAt: [`Spain`, `Brazil`],
        attributes: {
            attackSpeed: `25`
        }
    },
    {
        id: 3,
        name: `Steel Barrel`,
        Description: `+30 cannon distance`,
        price: 35e3,
        rarity: 0.6,
        availableAt: [`Labrador`],
        attributes: {
            attackDistance: `30`
        }
    },
    {
        id: 4,
        name: `Air Pegleg`,
        Description: `+1 ship speed (only works if you are captain)`,
        price: 22e3,
        rarity: 0.3,
        availableAt: [`Jamaica`],
        attributes: {
            movementSpeed: `100`
        }
    },
    {
        id: 5,
        name: `Blue Gunpowder`,
        Description: `+8 cannon damage`,
        price: 5e4,
        rarity: 0.25,
        availableAt: [`Jamaica`],
        attributes: {
            attackDamage: `8`,
        }
    },
    {
        id: 6,
        name: `Cannon distance upgrade`,
        Description: `+5 cannon distance`,
        price: 4e3,
        rarity: 1,
        attributes: {
            attackDistance: `5`
        }
    },
    {
        id: 7,
        name: `Attack speed upgrade`,
        Description: `+5 cannon fire rate`,
        price: 2e3,
        rarity: 1,
        attributes: {
            attackSpeed: `5`
        }
    },
    {
        id: 8,
        name: `Damage upgrade`,
        Description: `+5 cannon damage`,
        price: 5e3,
        rarity: 1,
        attributes: {
            attackDamage: `5`
        }
    },
    {
        id: 9,
        name: `Ship Speed Upgrade`,
        Description: `+0.2 ship speed (only works if you are captain)`,
        price: 3e3,
        rarity: 1,
        attributes: {
            movementSpeed: `20`
        }
    },
    {
        id: 10,
        name: `Bruiser`,
        Description: `+2 cannon damage<br/>+10 cannon fire rate`,
        price: 2e4,
        rarity: 0.35,
        availableAt: [`Spain`, `Brazil`],
        attributes: {
            attackSpeed: `10`,
            attackDamage: `2`
        }
    },
    {
        id: 11,
        name: `Demolisher`,
        Description: `+4 cannon damage<br/>+25 cannon fire rate<br/><br/>Requirements:<br/>- Sink 10 ships<br/>- Trade goods worth 100,e3 gold`,
        price: 1e5,
        rarity: 1,
        availableAt: [`Jamaica`],
        attributes: {
            attackSpeed: `25`,
            attackDamage: `4`
        }
    },
    {
        id: 12,
        name: `Drifter`,
        Description: `+2 cannon damage<br/>+0.5 ship speed (only works if you are captain)`,
        price: 25e3,
        rarity: 0.45,
        availableAt: [`Guinea`, `Labrador`],
        attributes: {
            attackDamage: `2`,
            movementSpeed: `50`
        }
    },
    {
        id: 13,
        name: `Reinforced Planks`,
        Description: `+25% to protect your ship (only works if you are captain)`,
        price: 35e3,
        rarity: 0.45,
        availableAt: [`Brazil`],
        attributes: {
            armor: `25`
        }
    },
    {
        id: 14,
        name: `Fountain of youth`,
        Description: `New chance to allocate all your skill points.<br/>Can only be bought once`,
        price: 15e4,
        rarity: 0.33,
        availableAt: [`Jamaica`]
    }
];
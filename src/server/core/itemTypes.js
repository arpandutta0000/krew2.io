let itemTypes = [
    {
        id: 0,
        name: `Attack speed upgrade`,
        Description: `+5 cannon fire rate`,
        price: 2e3,
        rarity: 1,
        attributes: {
            attackSpeed: `5`
        }
    },
    {
        id: 1,
        name: `Ship speed upgrade`,
        Description: `+0.2 ship speed`,
        price: 3e3,
        rarity: 1,
        attributes: {
            movementSpeed: `20`
        }
    },
    {
        id: 2,
        name: `Cannon distance upgrade`,
        Description: `+5 cannon distance`,
        price: 4e3,
        rarity: 1,
        attributes: {
            attackDistance: `5`
        }
    },
    {
        id: 3,
        name: `Damage upgrade`,
        Description: `+5 cannon damage`,
        price: 5e3,
        rarity: 1,
        attributes: {
            attackDamage: `5`
        }
    },
    {
        id: 4,
        name: `Bruiser`,
        Description: `+5 cannon damage<br/>5 cannon fire rate`,
        price: 3e4,
        rarity: 1,
        availableAt: [`Spain`, `Brazil`],
        attributes: {
            attackSpeed: `5`,
            attackDamage: `5`
        }
    },
    {
        id: 5,
        name: `Air Pegleg`,
        Description: `+1 ship speed`,
        price: 22e3,
        rarity: 1,
        availableAt: [`Jamaica`],
        attributes: {
            movementSpeed: `100`
        }
    },
    {
        id: 6,
        name: `Reinforced Planks`,
        Description: `25% damage reduction`,
        price: 35e3,
        rarity: 1,
        availableAt: [`Brazil`],
        attributes: {
            armor: `25`
        }
    },
    {
        id: 7,
        name: `Steel Barrel`,
        Description: `+30 cannon distance`,
        price: 35e3,
        rarity: 1,
        availableAt: [`Labrador`],
        attributes: {
            attackDistance: `30`
        }
    },
    {
        id: 8,
        name: `Sinker's Gloves`,
        Description: `+25 cannon fire rate`,
        price: 45e3,
        rarity: 1,
        availableAt: [`Spain`, `Brazil`],
        attributes: {
            attackSpeed: `25`
        }
    },
    {
        id: 9,
        name: `Steel Reinforced Planks`,
        Description: `40% damage reduction`,
        price: 2e5,
        rarity: 1,
        availableAt: [`Taiwan`],
        attributes: {
            armor: `40`
        }
    },
    {
        id: 10,
        name: `Advanced Toolkit`,
        Description: `+5 Regen`,
        price: 2e5,
        rarity: 1,
        availableAt: [`Malaysia`],
        attributes: {
            regen: `5`
        }
    },
    {
        id: 11,
        name: `Blue Gunpowder`,
        Description: `+25 cannon damage`,
        price: 2e5,
        rarity: 1,
        availableAt: [`Jamaica`],
        attributes: {
            attackDamage: `25`
        }
    },
    {
        id: 12,
        name: `Drifter`,
        Description: `+10 cannon damage<br/>+1.5 ship speed`,
        price: 2e5,
        rarity: 1,
        availableAt: [`Guinea`, `Labrador`],
        attributes: {
            attackDamage: `10`,
            movementSpeed: `150`
        }
    },
    {
        id: 13,
        name: `Nitro Peg`,
        Description: `+2 ship speed`,
        price: 2e5,
        rarity: 1,
        availableAt: [`Jamaica`],
        attributes: {
            movementSpeed: `200`
        }
    },
    {
        id: 14,
        name: `Titanium Barrel`,
        Description: `+40 cannon distance`,
        price: 25e4,
        rarity: 1,
        availableAt: [`Taiwan`],
        attributes: {
            attackDistance: `40`
        }
    },
    {
        id: 15,
        name: `Demolisher`,
        Description: `+10 cannon damage<br/>+35 cannon fire rate<br/>Requirements:<br/> - Sink 10 ships<br/> - Trade goods worth 100,000 gold`,
        price: 35e4,
        rarity: 1,
        availableAt: [`Jamaica`],
        attributes: {
            attackSpeed: `35`,
            attackDamage: `10`
        }
    },
    {
        id: 16,
        name: `Fountain of Youth`,
        Description: `Reset your skill points and allow them to be reallocated.<br/>Can only be bought once.`,
        price: 15e4,
        rarity: 1,
        availableAt: [`Jamaica`]
    }
];

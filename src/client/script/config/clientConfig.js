const config = {
    // Client side staff
    Admins: [`BR88C`, `DamienVesper`],
    Mods: [`TheChoco`, `Kekmw`],
    Helpers: [`Tommy_Finle`, `ObamaKindaCare`],
    Designers: [],

    // Set URL
    url: `https://tournament.krew.io`,

    // Set config.worldsize
    worldsize: 2500,

    // Set islands for decorations
    palmTree: [`Jamaica`],
    christmasTree: [],
    snowman: [],

    // Misc config
    setProperties: {
        inVision: false
    },
    Labels: {
        redrawInterval: 250,
        fontFamily: `Arial, Helvetica, sans-serif`,
        distanceMultiplier: {
            0: 40,
            1: 160,
            5: 300
        },
        boats: {
            useMethod: `inRange` // `inVision` or `inRange`
        }
    }
};

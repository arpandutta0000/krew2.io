let config = {
    // Client side staff
    Admins: [`devclied`, `LeoLeoLeo`, `DamienVesper`, `BR88C`, `itsdabomb`, `harderman`],
    Mods: [`Fiftyyyyy`, `Speedy_Sloth`, `Sjmun`, `TheChoco`, `Kekmw`],
    Devs: [`Yaz_`],

    // Set URL
    url: `https://krew.io`,

    // Set max players per server
    maxPlayerPerInstance: 250,

    // Set worldsize
    worldsize: 2500,
};

/**
 * This global variable, meant to hold all the posible configurations for the client.
 * @type {Object}
 */
window.CONFIG = {
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

/**
 * This global variable its ment to hold all the posible configurations
 * for the client.
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
            useMethod: `inRange` // 'inVision' or 'inRange'
        }
    }
};

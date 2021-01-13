/* Calculate values for time alive */
let pad = function (val) {
    let valString = `${val}`;
    if (valString.length < 2) {
        return `0${valString}`;
    } else {
        return valString;
    }
};

/* Check if a string is alphanumeric */
let isAlphaNumeric = (str) => {
    let code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123) && // lower alpha (a-z)
            !(code === 190 || code === 46)) {
            return false;
        }
    }
    return true;
}

/* Create timers */
let timer = setInterval(() => {
    islandTimer();
}, 1000);
let cleanup = setInterval(() => {
    cleanScene();
}, 90000);

let Ease = {
    // no easing, no acceleration
    linear: function (t) {
        return t;
    },

    // accelerating from zero velocity
    easeInQuad: function (t) {
        return t * t;
    },

    // decelerating to zero velocity
    easeOutQuad: function (t) {
        return t * (2 - t);
    },

    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    // accelerating from zero velocity
    easeInCubic: function (t) {
        return t * t * t;
    },

    // decelerating to zero velocity
    easeOutCubic: function (t) {
        return (--t) * t * t + 1;
    },

    // acceleration until halfway, then deceleration
    easeInOutCubic: function (t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },

    // accelerating from zero velocity
    easeInQuart: function (t) {
        return t * t * t * t;
    },

    // decelerating to zero velocity
    easeOutQuart: function (t) {
        return 1 - (--t) * t * t * t;
    },

    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },

    // accelerating from zero velocity
    easeInQuint: function (t) {
        return t * t * t * t * t;
    },

    // decelerating to zero velocity
    easeOutQuint: function (t) {
        return 1 + (--t) * t * t * t * t;
    },

    // acceleration until halfway, then deceleration
    easeInOutQuint: function (t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
};
/* Calculate values for time alive */
let pad = (val) => {
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
};

/* Parse URL info */
let getUrlVars = () => {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (
        m,
        key,
        value
    ) => {
        vars[key] = value;
    });

    return vars;
};

/* Fade between two RGB colors */
let colorFade = (start, end, i) => {
    let R = Math.round((end.r - start.r) * i + start.r);
    let G = Math.round((end.g - start.g) * i + start.g);
    let B = Math.round((end.b - start.b) * i + start.b);
    return 0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255);
};

/* Create cleanup timer */
let cleanup = setInterval(() => {
    cleanScene();
}, 90000);

let Ease = {
    // no easing, no acceleration
    linear: (t) => t,

    // accelerating from zero velocity
    easeInQuad: (t) => t * t,

    // decelerating to zero velocity
    easeOutQuad: (t) => t * (2 - t),

    // acceleration until halfway, then deceleration
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    // accelerating from zero velocity
    easeInCubic: (t) => t * t * t,

    // decelerating to zero velocity
    easeOutCubic: (t) => (--t) * t * t + 1,

    // acceleration until halfway, then deceleration
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    // accelerating from zero velocity
    easeInQuart: (t) => t * t * t * t,

    // decelerating to zero velocity
    easeOutQuart: (t) => 1 - (--t) * t * t * t,

    // acceleration until halfway, then deceleration
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

    // accelerating from zero velocity
    easeInQuint: (t) => t * t * t * t * t,

    // decelerating to zero velocity
    easeOutQuint: (t) => 1 + (--t) * t * t * t * t,

    // acceleration until halfway, then deceleration
    easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
};

let lerp = (start, end, amount) => (1 - amount) * start + amount * end;

let charLimit = (text, chars, suffix) => {
    chars = chars || 140;
    suffix = suffix || ``;
    text = (`${text}`).replace(/(\t|\n)/gi, ``).replace(/\s\s/gi, ` `);
    if (text.length > chars) {
        return text.slice(0, chars - suffix.length).replace(/(\.|\,|:|-)?\s?\w+\s?(\.|\,|:|-)?$/, suffix);
    }

    return text;
};

let entityDistance = (a, b) => Math.sqrt((a.position.x - b.position.x) * (a.position.x - b.position.x) + (a.position.z - b.position.z) * (a.position.z - b.position.z));

function distance (p1, p2) {
    let dx = p2.x - p1.x;
    let dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function worldAngle (vector) {
    let result = vector.angle() + Math.PI * 0.5;
    if (result > Math.PI * 2) {
        result -= Math.PI * 2;
    }

    result = Math.PI * 2 - result;
    return result;
}

function anglediff (firstAngle, secondAngle) {
    let difference = secondAngle - firstAngle;
    while (difference < -Math.PI) {
        difference += Math.PI * 2.0;
    }

    while (difference > Math.PI) {
        difference -= Math.PI * 2.0;
    }

    return difference;
}

const angleToVector = (angle) => new THREE.Vector2(-Math.sin(angle), -Math.cos(angle));

const rotationToPosition = (origin, target) => worldAngle(new THREE.Vector2(target.x - origin.x, target.z - origin.z));

const rotationToObject = (origin, target) => worldAngle(new THREE.Vector2(target.position.x - origin.position.x, target.position.z - origin.position.z));

const distanceToPosition = (origin, target) => origin.position.distanceTo(target);

const distanceToPositionSquared = (origin, target) => origin.position.distanceToSquared(target);

const distanceToObject = (origin, target) => origin.position.distanceTo(target.position);

const distanceToObjectSquared = (origin, target) => origin.position.distanceToSquared(target.position);

let isEmpty = function (obj) {
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
        return true;
    }

    // check if object is full of undefined
    for (p in obj) {
        if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
            return false;
        }
    }

    return true;
};

/**
 * This method checks if a 3d object is in the players vision range
 * Is created with a factory function to create the frustum only once and
 * not on every check
 * @return {Boolean}
 */
let inPlayersVision = (function () {
    let frustum = new THREE.Frustum();
    /**
     * This is the exported function that will used for the check
     * @param  {Object} object3d    It must be a 3d object with a position property
     * @param  {Object} camera      It must be the camera to compare with
     * @return {Boolean}            Returns true if the player sees the object or false on the contrary
     */
    let inPlayersVision = function (object3d, camera) {
        // If the object has no position property just return false
        if (object3d.position === undefined) {
            return false;
        }

        camera.updateMatrix();
        camera.updateMatrixWorld();

        frustum.setFromMatrix(
            new THREE.Matrix4()
                .multiplyMatrices(
                    camera.projectionMatrix,
                    camera.matrixWorldInverse
                )
        );

        // Return if the object is in the frustum
        return frustum.containsPoint(object3d.position);
    };

    // Returns the final function
    return inPlayersVision;
})();

function getFixedFrameRateMethod (fps, callback) {
    fps = fps || 5;
    let time = performance.now();
    let previousTime = performance.now();
    let method = function () {
        time = performance.now();
        if (time - previousTime > 1000 / fps) {
            previousTime = time;
            if (typeof callback === `function`) {
                requestAnimationFrame(callback.bind(this));
            }
        }
    };

    return method;
}
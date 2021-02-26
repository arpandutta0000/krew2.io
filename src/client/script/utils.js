/**
 * Calculates values for time alive
 *
 * @param {number} val Time
 */
let pad = (val) => {
    let valString = `${val}`;
    if (valString.length < 2) {
        return `0${valString}`;
    } else {
        return valString;
    }
};

/**
 * Traverse through child objects of an object
 *
 * @param {object} obj Object to be traversed
 * @callback callback
 */
let traverseObj = (obj, callback) => {
    callback(obj);
    let children = obj.children;

    for (let child in children) {
        traverseObj(children[child], callback);
    }
};

/**
 * Print a header into console
 */
let printConsoleHeader = () => console.log(`\n\n\n\n\██╗  ██╗██████╗ ███████╗██╗    ██╗   ██╗ ██████╗\n██║ ██╔╝██╔══██╗██╔════╝██║    ██║   ██║██╔═══██╗\n█████╔╝ ██████╔╝█████╗  ██║ █╗ ██║   ██║██║   ██║\n██╔═██╗ ██╔══██╗██╔══╝  ██║███╗██║   ██║██║   ██║\n██║  ██╗██║  ██║███████╗╚███╔███╔╝██╗██║╚██████╔╝\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝ ╚═════╝\n\nKrew Client v2\n\n\n\n\n`);

/**
 * Checks if a string is alphanumeric
 *
 * @param {string} string String to be tested
 */
let isAlphaNumeric = (str) => {
    let code, i, len;

    for (let i = 0, len = str.length; i < len; i++) {
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

/**
 * Parse URL info
 */
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

/**
 * Fade between 2 RGB colors
 *
 * @param {object} start Starting RGB color object
 * @param {object} end Ending RGB color object
 * @param {number} i Percent of fade to return
 */
let colorFade = (start, end, i) => {
    let R = Math.round((end.r - start.r) * i + start.r);
    let G = Math.round((end.g - start.g) * i + start.g);
    let B = Math.round((end.b - start.b) * i + start.b);
    return 0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255);
};

/* Create cleanup timer */
let cleanup = setInterval(() => {
    cleanScene();
}, 9e4);

let Ease = {
    // Accelerating from zero velocity
    easeInQuad: (t) => t * t,

    // Decelerating to zero velocity
    easeOutQuad: (t) => t * (2 - t),

    // Accelerating from zero velocity
    easeInQuint: (t) => t * t * t * t * t
};

/**
 * Function to calculate linear interpolation
 *
 * @param {number} start Start
 * @param {number} end End
 * @param {number} amount Amount
 */
let lerp = (start, end, amount) => (1 - amount) * start + amount * end;

/**
 * Parse a boolean value (String or boolean)
 *
 * @param {any} b String or boolean to be tested
 */
let parseBool = (b) => b === true || b === `true`;

/**
 * Calculate the distance between two sets of coordinates
 *
 * @param {object} p1 Starting coordinate
 * @param {object} p2 Ending coordinate
 */
let distance = (p1, p2) => {
    let dx = p2.x - p1.x;
    let dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dz * dz);
};

/**
 * Calculate world angle
 *
 * @param {object} vector A Vector
 */
let worldAngle = (vector) => {
    let result = vector.angle() + Math.PI * 0.5;
    if (result > Math.PI * 2) {
        result -= Math.PI * 2;
    }

    result = Math.PI * 2 - result;
    return result;
};

/**
 * Convert an angle to a vector
 *
 * @param {number} angle Angle to be converted
 */
const angleToVector = (angle) => new THREE.Vector2(-Math.sin(angle), -Math.cos(angle));

/**
 * Check if an object is empty
 *
 * @param {object} obj Object to be tested
 */
let isEmpty = (obj) => {
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
        return true;
    }

    // check if object is full of undefined
    for (let p in obj) {
        if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
            return false;
        }
    }

    return true;
};

/**
 * This method checks if a 3D object is in the players vision range
 * Is created with a factory function to create the frustum only once and
 * not on every check
 *
 * @return {boolean}
 */
let inPlayersVision = (function () {
    let frustum = new THREE.Frustum();
    /**
     * This is the exported function that will used for the check
     * @param  {Object} object3d    It must be a 3d object with a position property
     * @param  {Object} camera      It must be the camera to compare with
     * @return {Boolean}            Returns true if the player sees the object or false on the contrary
     */
    let inPlayersVision = (object3d, camera) => {
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

/**
 * Get a fixed framerate
 *
 * @param {number} fps FPS
 * @callback callback
 */
let getFixedFrameRateMethod = (fps, callback) => {
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
};

/* Calculate values for time alive */
let pad = (val) => {
    let valString = `${val}`;
    if (valString.length < 2) {
        return `0${valString}`;
    } else {
        return valString;
    }
};

/* Function to print header in console */
let printConsoleHeader = () => {
    console.log(`\n ___   _  ______    _______  _     _        ___   _______ \n|   | | ||    _ |  |       || | _ | |      |   | |       |\n|   |_| ||   | ||  |    ___|| || || |      |   | |   _   |\n|      _||   |_||_ |   |___ |       |      |   | |  | |  |\n|     |_ |    __  ||    ___||       | ___  |   | |  |_|  |\n|    _  ||   |  | ||   |___ |   _   ||   | |   | |       |\n|___| |_||___|  |_||_______||__| |__||___| |___| |_______|\n\nKrew Client v2.0`);
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
    // accelerating from zero velocity
    easeInQuad: (t) => t * t,

    // decelerating to zero velocity
    easeOutQuad: (t) => t * (2 - t),

    // accelerating from zero velocity
    easeInQuint: (t) => t * t * t * t * t,
};

let lerp = (start, end, amount) => (1 - amount) * start + amount * end;

let parseBool = (b) => b === true || b === `true`;

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

const angleToVector = (angle) => new THREE.Vector2(-Math.sin(angle), -Math.cos(angle));

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
}
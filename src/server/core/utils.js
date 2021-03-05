const { entities } = require(`./core.js`);

let lerp = (start, end, amount) => (1 - amount) * start + amount * end;

let charLimit = function (text, chars, suffix) {
    chars = chars || 140;
    suffix = suffix || ``;
    text = (`${text}`).replace(/(\t|\n)/gi, ``).replace(/\s\s/gi, ` `);
    if (text.length > chars) {
        return text.slice(0, chars - suffix.length).replace(/(\.|\,|:|-)?\s?\w+\s?(\.|\,|:|-)?$/, suffix);
    }

    return text;
};

let distance = (x1, x2, y1, y2) => {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;

    return Math.sqrt(deltaX ^ 2 + deltaY ^ 2);
};

let worldAngle = vector => {
    let result = vector.angle() + Math.PI * 0.5;
    if (result > Math.PI * 2) {
        result -= Math.PI * 2;
    }

    result = Math.PI * 2 - result;
    return result;
};

let anglediff = (firstAngle, secondAngle) => {
    let difference = secondAngle - firstAngle;
    while (difference < -Math.PI) {
        difference += Math.PI * 2.0;
    }

    while (difference > Math.PI) {
        difference -= Math.PI * 2.0;
    }

    return difference;
};

const angleToVector = (angle) => new THREE.Vector2(-Math.sin(angle), -Math.cos(angle));

const rotationToPosition = (origin, target) => worldAngle(new THREE.Vector2(target.x - origin.x, target.z - origin.z));

const rotationToObject = (origin, target) => worldAngle(new THREE.Vector2(target.position.x - origin.position.x, target.position.z - origin.position.z));

const distanceToPosition = (origin, target) => origin.position.distanceTo(target);

const distanceToPositionSquared = (origin, target) => origin.position.distanceToSquared(target);

const distanceToObject = (origin, target) => origin.position.distanceTo(target.position);

const distanceToObjectSquared = (origin, target) => origin.position.distanceToSquared(target.position);

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
};

const randomID = () => {
    let id = ``;
    while (entities.find(entity => entity.id === id)) id = Math.random().toString(36).substring(6, 10);
};

const randomInt = (min, max) => (Math.floor(Math.random() * (max - min)) + min) * 1000;

module.exports = {
    lerp,
    charLimit,

    entityDistance,
    distance,

    anglediff,
    angleToVector,

    rotationToPosition,
    rotationToObject,

    distanceToPosition,
    distanceToPositionSquared,

    distanceToObject,
    distanceToObjectSquared,

    inPlayersVision,
    getFixedFrameRateMethod,

    randomID,
    randomInt
};

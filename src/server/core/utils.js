/* Import entities */
const {
    entities
} = require(`./core.js`);

module.exports = {
    /**
     * Method to perform linear interpolation
     * 
     * @param {number} start Starting value
     * @param {number} end Ending value
     * @param {number} amount lerp amount
     * @returns {number} lerp output
     */
    lerp: (start, end, amount) => (1 - amount) * start + amount * end,

    /**
     * Returns a string cut at a character limit
     * 
     * @param {string} text Input string
     * @param {?number} chars Amount of allowed characters (Defaults to 140)
     * @param {?string} suffix Suffix to be preserved
     * @returns {string} Output string
     */
    charLimit: (text, chars, suffix) => {
        chars = chars || 140;
        suffix = suffix || ``;
        text = (`${text}`).replace(/(\t|\n)/gi, ``).replace(/\s\s/gi, ` `);
        if (text.length > chars) return text.slice(0, chars - suffix.length).replace(/(\.|\,|:|-)?\s?\w+\s?(\.|\,|:|-)?$/, suffix);

        return text;
    },

    /**
     * Calculate the distance between 2 positions
     * 
     * @param {{ x: number, z: number }} p1 Position 1
     * @param {{ x: number, z: number }} p2 Position 2
     * @returns {number} Distance between positions
     */
    distance: (p1, p2) => {
        let dx = p2.x - p1.x;
        let dz = p2.z - p1.z;
        return Math.sqrt(dx * dx + dz * dz);
    },

    /**
     * Calculate the world angle of a vector
     * 
     * @param {object} vector Vector object
     * @returns {number} Angle
     */
    worldAngle: (vector) => {
        let result = vector.angle() + Math.PI * 0.5;
        if (result > Math.PI * 2) result -= Math.PI * 2;
        result = Math.PI * 2 - result;
        return result;
    },

    /**
     * Calculates the difference between angles
     * 
     * @param {number} firstAngle First angle
     * @param {number} secondAngle Second angle
     * @returns {number} Difference
     */
    anglediff: (firstAngle, secondAngle) => {
        let difference = secondAngle - firstAngle;
        while (difference < -Math.PI) difference += Math.PI * 2.0;

        while (difference > Math.PI) difference -= Math.PI * 2.0;

        return difference;
    },

    /**
     * Convert an angle to a Vector 2
     * 
     * @param {number} angle Angle
     * @returns {object} THREE.Vector2 resultant
     */
    angleToVector: (angle) => new THREE.Vector2(-Math.sin(angle), -Math.cos(angle)),

    /**
     * Finds the rotation to an object
     * 
     * @param {{ x: number, z: number }} origin Origin
     * @param {{ x: number, z: number }} target Target
     * @returns {number} Angle
     */
    rotationToObject: (origin, target) => this.worldAngle(new THREE.Vector2(target.position.x - origin.position.x, target.position.z - origin.position.z)),

    /**
     * This method checks if a 3d object is in the players vision range
     * Is created with a factory function to create the frustum only once and
     * not on every check
     * @returns {boolean}
     */
    inPlayersVision: (function () {
        let frustum = new THREE.Frustum();
        /**
         * This is the exported function that will used for the check
         * @param  {object} object3d    It must be a 3d object with a position property
         * @param  {object} camera      It must be the camera to compare with
         * @returns {boolean}            Returns true if the player sees the object or false on the contrary
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
    })(),

    /**
     * Generates a random entity ID
     * 
     * @returns {string} Entity ID
     */
    randomID: () => {
        let id = ``;
        while (entities.find(entity => entity.id === id)) id = Math.random().toString(36).substring(6, 10);
        return id;
    },

    /**
     * Generates a random integer between 2 bounds
     * 
     * @param {number} min Minimum integer
     * @param {number} max Maximum integer
     * @returns {number} Random integer
     */
    randomInt: (min, max) => (Math.floor(Math.random() * (max - min)) + min) * 1000
};
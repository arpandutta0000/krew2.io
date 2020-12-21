(function (window) {
    "use strict";

    // This is set for the canvas text size based on the quality
    var quality = {
            1: 8,
            2: 16,
            3: 32,
            4: 64,
            5: 128
        },
        /**
         * Find the nearest pow of two
         * @param  {Number} number Number to be scaled to the nearest pow of two
         * @return {Number}        The nearest pow of two relative to the passed number
         */
        nextPowOfTwo = function nextPowOfTwo (number) {
            var i = 0;
            if (number < 2) {
                return 1;
            }

            for (; number > 1; i++) {
                number = number >> 1;
            }

            return 1 << i + 1;
        };

    /**
     * Text Mesh Factory function
     * This will create a text mesh available to be added to the scene or to another object
     * @param       {String} text       The initial text of the mesh
     * @param       {Object} options    The initial options
     * @return      {Object} mesh       The created mesh
     */
    window.TextMesh = function (text, options) {
        // Default options
        var o = Object.assign({
                quality: 3, // Quality of the text
                limit: 20, // Character limit
                fontName: "Arial", // Font name
                fontStyle: "Normal", // Font Style
                size: 1, // Text Size
                fillStyle: "rgba(255,255,255,1)", // Fill style
                text: text, // Current text
                lookAt: undefined, // Object to lookAt, must have the quaternion property
                follow: undefined // Objecto to follow, must have the position property
            }, options),
            // canvas element
            canvas = document.createElement('canvas'),
            // context
            context = canvas.getContext('2d'),
            // Texture placeholder
            texture = undefined,
            // Material placeholder
            material = undefined,
            // Geometry placeholder
            geometry = undefined,
            // Mesh placeholder
            mesh = undefined,
            /**
             * Animate function to be called on every frame
             * @return {Void}
             */
            animate = function animate () {
                requestAnimationFrame(animate);
                // If lookAt, copy quaternion
                // This is usefull to set the text to always look at the camera
                if (
                    o.lookAt !== undefined &&
                    o.lookAt.quaternion !== undefined &&
                    mesh.quaternion !== undefined
                ) {
                    mesh.quaternion.copy(o.lookAt.quaternion);
                }

                // If follow, copy the position of the object to follow plus
                // the position modifiers passed relative to the object
                if (
                    o.follow !== undefined &&
                    o.follow.object.position !== undefined &&
                    mesh.position !== undefined
                ) {
                    mesh.position.set(
                        o.follow.object.position.x + o.follow.x,
                        o.follow.object.position.y + o.follow.y,
                        o.follow.object.position.z + o.follow.z
                    );
                }
            };

        // Set the initial font and style to get the max width of the canvas
        context.font = o.fontStyle + " " + quality[o.quality] + "px " + o.fontName;
        context.fillStyle = o.fillStyle;
        context.textAlign = "center";

        // Set the width of the canvas creating a string of o.limit characters and get measureText.width
        canvas.width = nextPowOfTwo(context.measureText(new Array(o.limit).join('0')).width);
        // Set the height of the canvas to the size of the renderer text quality
        canvas.height = quality[o.quality];

        // Create the texture
        texture = new THREE.Texture(canvas);

        // Create the material
        material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        material.transparent = true;

        // Create the geometry
        geometry = new THREE.BufferGeometry().fromGeometry(new THREE.PlaneGeometry(canvas.width, canvas.height));

        // Create the mesh
        mesh = new THREE.Mesh(geometry, material);

        // Expose the options in the mesh
        mesh.text = o;

        // Init the animate function to be called every frame
        animate();

        /**
         * Update txt method, used to update the text without recreating the mesh object
         * @param  {String} text        Text to be painted
         * @param  {Object} options     Options object, same as the factory
         * @return {Object} mesh        The mesh object to chain methods
         */
        mesh.updateText = function (text, options) {
            var newOptions = options || {};
            // Can't change the quality or the limit without recreate the mesh
            // because the width and height of the canvas is already defined
            delete newOptions.quality;
            delete newOptions.limit;

            // Assign the new options
            Object.assign(o, newOptions, {
                text: text
            });

            // Set again the font and style
            context.font = o.fontStyle + " " + quality[o.quality] + "px " + o.fontName;
            context.fillStyle = o.fillStyle;
            context.textAlign = "center";

            // Clear the canvas before paint the new text
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Paint the text on the center of the canvas
            context.fillText(o.text, canvas.width / 2, quality[o.quality], canvas.width);

            // Update the texture
            texture.needsUpdate = true;

            // Scale the mesh to the desired size
            mesh.scale.set(1, 1, 1).multiplyScalar(o.size * 0.04);

            // Return the mesh to chain methods
            return mesh;
        };

        /**
         * This method will tell the text to follow an object copying its position
         * plus the position modifiers that are passed
         * @param  {Object} object3d    Object to be followed, must have the position property
         * @param  {Number} x           X axis position relative to the object
         * @param  {Number} y           Y axis position relative to the object
         * @param  {Number} z           Z axis position relative to the object
         * @return {Object} mesh        The mesh object to chain methods
         */
        mesh.addTo = function (object3d, x, y, z) {
            if (object3d !== undefined && object3d.position !== undefined) {
                o.follow = {
                    object: object3d,
                    x: x || 0,
                    y: y || 0,
                    z: z || 0
                };
            }
            return mesh;
        };

        // Paint the initial text
        mesh.updateText(o.text);

        // Return the created mesh
        return mesh;
    };
}(window));
/**
 * Remove a user's cookies and log out
 */
window.logoutUser = () => {
    headers.invalidateCookie(`username`);
    headers.invalidateCookie(`token`);
    window.location.pathname = `/logout`;
};

/**
 * Automatically resize renderer when the window is resized
 */
let updateViewport = () => {
    if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
};
window.addEventListener(`resize`, updateViewport, false);

/**
 * Method to update game quality
 */
let updateQuality = () => {
    switch (parseInt($(`#quality-list`).val())) {
        case 1: {
            if (gl !== undefined) {
                let newW = defaultWidth / 2.5;
                let newH = defaultHeight / 2.5;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newW);
                renderer.setSize(newW, newW, false);
            }

            break;
        }

        case 2: {
            if (gl !== undefined) {
                let newW = defaultWidth / 1.45;
                let newH = defaultHeight / 1.45;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newH);
                renderer.setSize(newW, newW, false);
            }

            break;
        }

        case 3: {
            if (gl !== undefined) {
                let newW = defaultWidth;
                let newH = defaultHeight;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newH);
                renderer.setSize(newW, newW, false);
            }

            break;
        }
    }
};

/**
 * Update an input's range
 *
 * @param {object} $input Input element
 */
window.updateInputRange = ($input) => {
    let $output = $input.parent().find(`output`);

    let min = $input.attr(`min`);
    let max = $input.attr(`max`);

    let unity = (max - min) / 100;

    let val = $input.val();
    let percent = (val - min) / unity;
    $output.html(val);
    $input.attr(`style`, `--value:${percent}`);
    $output.attr(`style`, `left:${percent}%; transform: translate(-${percent}%);`);
};

/**
 * Detect input changes
 *
 * @param {object} $input Input element
 */
window.inputRange = ($input) => {
    $input.on(`input change`, () => updateInputRange($input));
};

/* Remove a user's cookies and log out */
window.logoutUser = () => {
    ui.invalidateCookie(`username`);
    ui.invalidateCookie(`token`);
    window.location.pathname = `/logout`;
};

/* Update game quality */
var updateQuality = () => {
    switch (parseInt($(`#quality-list`).val())) {
        case 1: {
            if (gl !== undefined) {
                var newW = defaultWidth / 2.5;
                var newH = defaultHeight / 2.5;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newW);
                renderer.setSize(newW, newW, false);
            }

            break;
        }

        case 2: {
            if (gl !== undefined) {
                var newW = defaultWidth / 1.45;
                var newH = defaultHeight / 1.45;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newH);
                renderer.setSize(newW, newW, false);
            }

            break;
        }

        case 3: {
            if (gl !== undefined) {
                var newW = defaultWidth;
                var newH = defaultHeight;
                gl.canvas.height = newH;
                gl.canvas.width = newW;
                gl.viewport(0, 0, newW, newH);
                renderer.setSize(newW, newW, false);
            }

            break;
        }
    }
};
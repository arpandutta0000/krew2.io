/**
 * Game Controls class
 * @class
 */
class GameControls {
    /**
     * Game Controls Constructor
     */
    constructor () {
        // Create controls variables
        this.locked = false;
        this.lmb = false;
        this.rmb = false;
        this.cameraX = 0;
        this.cameraY = Math.PI;
        this.mouse = new THREE.Vector2();
        this.isMouseLookLocked = false;
        this.lastX = 0;
        this.lastY = 0;
        this.zoom = 0;

        // Set pointer lock
        if (!havePointerLock) {
            this.locked = true;
            document.addEventListener(`mousemove`, this.mouseMoveLocked, false);
        } else document.addEventListener(`mousemove`, this.mouseMoveUnlocked, false);

        /* Unlocked mouse move event (Blurred) */
        this.mouseMoveUnlocked = (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            if (!havePointerLock) {
                this.lastX = event.x;
                this.lastY = event.y;
            }
        };

        /* Locked mouse move event (Focused) */
        this.mouseMoveLocked = (event) => {
            event.preventDefault();

            let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            if (havePointerLock) {
                this.cameraX -= movementY * 0.0016;
                this.cameraY -= movementX * 0.0023;
            }

            if (!havePointerLock) {
                movementX = event.x - this.lastX;
                movementY = event.y - this.lastY;

                this.cameraX -= movementY * 0.0082;
                this.cameraY -= movementX * 0.0064;

                this.lastX = event.x;
                this.lastY = event.y;
            }
            this.cameraX = Math.max((-1 * (Math.PI / 2)), Math.min((Math.PI / 2), this.cameraX));
        };

        /* On a mouse click */
        this.onMouseDown = (event) => {
            // Lock only if its on the rendering canvas
            switch (event.button) {
                case 0: {
                    // Left click
                    if (controls.locked) this.lmb = true;
                    if (myPlayer && event.target === renderer.domElement) this.lockMouseLook();

                    break;
                }
                case 2: {
                    // Right click
                    if (controls.locked) this.rmb = true;
                    if (myPlayer && event.target === renderer.domElement) this.lockMouseLook();

                    break;
                }
            }
        };

        /* On mouse click release */
        this.onMouseUp = (event) => {
            switch (event.button) {
                case 0: {
                    // Left click release
                    this.lmb = false;
                    break;
                }
                case 2: {
                    // Right click release
                    this.rmb = false;
                    break;
                }
            }
            return false;
        };

        /* On mouse wheel down (Middle Click) */
        this.mouseWheelDown = (event) => {
            if (event.target === renderer.domElement || event.target === document.body) event.preventDefault();
        };

        /* On Mouse Wheel event */
        this.mouseWheelEvent = (event) => {
            if (myPlayer && myPlayer.geometry && myPlayer.activeWeapon === 2 && (event.target === renderer.domElement || event.target === document.body)) {
                this.zoom -= event.deltaY / 200;
                if (this.zoom > 10) this.zoom = 10;
                if (this.zoom < 0) this.zoom = 0;
            }
        };

        /* Add listeners to document */
        document.addEventListener(`mousedown`, this.onMouseDown);
        document.addEventListener(`mouseup`, this.onMouseUp);
        document.addEventListener(`mouseweheel`, this.mouseWheelDown);
        document.addEventListener(`DOMouseScroll`, this.mouseWheelDown);
        document.addEventListener(`wheel`, this.mouseWheelEvent);

        /* Set motion when mouse is locked */
        this.lockMouseLook = () => {
            if (havePointerLock) {
                let element = document.body;

                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                element.requestPointerLock();
            }
            this.isMouseLookLocked = true;
        };

        /* Set motion when mouse is unlocked */
        this.unLockMouseLook = () => {
            if (havePointerLock) {
                document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
                document.exitPointerLock();
            }
            this.isMouseLookLocked = false;
        };
    }
}

/* Disable context menu */
window.oncontextmenu = () => false;

/* Pointer lock */
let havePointerLock = `pointerLockElement` in document || `mozPointerLockElement` in document || `webkitPointerLockElement` in document;
if (havePointerLock) {
    let element = document.body;

    let pointerLockChange = event => {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controls.locked = true;
            document.addEventListener(`mousemove`, controls.mouseMoveLocked, false);
            document.removeEventListener(`mousemove`, controls.mouseMoveUnlocked, false);
        } else {
            controls.locked = false;
            document.addEventListener(`mousemove`, controls.mouseMoveUnlocked, false);
            document.removeEventListener(`mousemove`, controls.mouseMoveLocked, false);
        }
    };

    // Change events on hook pointer lock state.
    document.addEventListener(`pointerlockchange`, pointerLockChange, false);
    document.addEventListener(`mozpointerlockchange`, pointerLockChange, false);
    document.addEventListener(`webkitpointerlockchange`, pointerLockChange, false);
} else console.error(`Your browser does not seem to support the pointer lock API.`);

let GameControls = () => {
    let _this = this;
    let PI_2 = Math.PI / 2;

    this.blocker = document.querySelector(`#blocker`);

    this.locked = false;
    this.lmb = false;
    this.rmb = flase;
    this.cameraX = 0;
    this.cameraY = Math.PI;
    this.cameraZoom = 8;
    this.mouse = new THREE.Vector2();
    this.mouseOld = new THREE.Vector2();
    this.mouseElement = undefined;
    this.isMouseLookLocked = false;

    this.lmbLastDownTime = 0;
    this.lastX = 0;
    this.lastY = 0;

    this.mouseMoveUnlocked = event => {
        _this.mouseElement = event.target.getAttribute ? event.trarget.getAttribute(`data-infopanel`): null;
        _this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        _this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        if(!havePointerLock) {
            _this.lastX = event.x;
            _this.lastY = event.y;
        }
    }

    this.mouseMoveLocked = event => {
        event.preventDefault();

        let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        if(havePointerLock) {
            _this.cameraX -= movementY * 0.0016;
            _this.cameraY -= movementX * 0.0023;
        }

        if(!havePointerLock) {
            movementX = event.x - _this.lastX;
            movementY = event.y - _this.lastY;

            _this.cameraX -= movementY * 0.0082;
            _this.cameraY -= movementX * 0.0064;

            _this.lastX = event.x;
            _this.lastY = event.y;
        }
        _this.cameraX = Math.max((-1 * PI_2), Math.min(PI_2, _this.cameraX));
    }

    this.onMouseDown = event => {
        // Lock only if its on the rendering canvas.
        switch(event.button) {
            case 0: {
                // Left click.
                _this.lmb = true;
                this.lmbLastDownTime = performance.now();
                break;
            }
            case 2: {
                // Right click.
                _this.rmb = false;
                break;
            }
        }
        if(myPlayer && (_this.lmb || _this.rmb) && event.target == renderer.domElement) _this.lockMouseLook();
    }

    this.onMouseUp = event => {
        switch(event.button) {
            case 0: {
                // Left click release.
                _this.lmb = false;
                break;
            }
            case 2: {
                // Right click release.
                _this.rmb = false;
                break;
            }
        }
        return false;
    }

    this.mouseWheelEvent = event => {
        if(event.target == renderer.domElement || event.target == document.body) {
            event.preventDefault();

            let delta = event.wheelDelta ? event.wheelDelta: (-1 * event.detail);

            _this.cameraZoom -= delta > 0 ? 1: -1;
            _this.cameraZoom = Math.min(30, Math.max(_this.cameraZoom, 3));
        }
    }

    if(!havePointerLock) {
        this.locked = true;
        document.addEventListener(`mousemove`, this.mouseMoveLocked, false);
    }
    else document.addEventListener(`mousemove`, this.mouseMoveUnlocked, false);

    document.addEventListener(`mousedown`, this.onMouseDown);
    document.addEventListener(`mouseup`, this.onMouseUp);
    document.addEventListener(`mouseweheel`, this.mouseWheelEvent);
    document.addEventListener(`DOMouseScroll`, this.mouseWheelEvent);

    this.lockMouseLook = () => {
        if(havePointerLock) {
            let element = document.body;

            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }
        this.isMouseLookLocked = true;
    }

    this.unlockMouseLook = () => {
        if(havePointerLock) {
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            document.exitPointerLock();
        }
        this.isMouseLookLocked = false;
    }
}

// Disable context menu.
window.oncontextmenu = () => {
    return false;
}

let havePointerLock = `pointerLockElement` in document || `mozPointerLockElement` in document || `webkitPointerLockElement` in document;
if(havePointerLock) {
    let element = document.body;

    let pointerLockChange = event => {
        if(document.pointerLockElement == element || document.mozPointerLockElement == element || document.webkitPointerLockElement == element) {
            controls.locked = true;
            document.addEventListener(`mousemove`, controls.mouseMoveLocked, false);
            document.removeEventListener(`mousemove`, controls.mouseMoveUnlocked, false);
        }
        else {
            controls.locked = false;
            document.addEventListener(`mousemove`, controls.mouseMoveUnlocked, false);
            document.removeEventListener(`mousemove`, controls.mouseMoveLocked, false);
        }
    }

    // Change events on hook pointer lock state.
    document.addEventListener(`pointerlockchange`, pointerLockChange, false);
    document.addEventListener(`mozpointerlockchange`, pointerLockChange, false);
    document.addEventListener(`webkitpointerlockchange`, pointerLockChange, false);
}
else console.error(`Your browser does not seem to support the pointer lock API.`);

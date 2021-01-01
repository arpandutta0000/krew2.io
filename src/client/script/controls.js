const {
    renderer
} = require(`./main.js`);

var GameControls = function () {
    var _this = this;
    var PI_2 = Math.PI / 2;

    this.blocker = document.getElementById('blocker');

    this.locked = false;
    this.lmb = false;
    this.rmb = false;
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

    this.mouseMoveUnlocked = function (event) {
        _this.mouseElement = event.target.getAttribute ? event.target.getAttribute('data-infopanel') : null;
        _this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        _this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        if (!havePointerLock) {
            _this.lastX = event.x;
            _this.lastY = event.y;
        }
    };

    this.mouseMoveLocked = function (event) {
        event.preventDefault();
        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        if (havePointerLock) {
            _this.cameraY -= movementX * 0.0023;
            _this.cameraX -= movementY * 0.0016;
        }

        if (!havePointerLock) {
            movementX = event.x - _this.lastX;
            movementY = event.y - _this.lastY;
            _this.cameraY -= movementX * 0.0082;
            _this.cameraX -= movementY * 0.0064;
            _this.lastX = event.x;
            _this.lastY = event.y;
        }

        _this.cameraX = Math.max(-PI_2, Math.min(PI_2, _this.cameraX));
    };

    this.onMouseDown = function (event) {

        // only lock if its the renderer element
        switch (event.button) {
            case 0: { // left click
                _this.lmb = true;
                this.lmbLastDownTime = performance.now();
                break;
            }

            case 2: { // right click
                _this.rmb = true;
                break;
            }
        }

        if (myPlayer && (_this.lmb || _this.rmb) && event.target === renderer.domElement) {
            _this.lockMouseLook();
        }
    };

    this.onMouseUp = function (event) {
        switch (event.button) {
            case 0: {
                _this.lmb = false;

                // if (performance.now() - this.lmbLastDownTime < 300) {
                //     // a click on something has happened
                // }

                break;
            }

            case 2: {
                _this.rmb = false;
                break;
            }
        }

        // if (!_this.lmb && !_this.rmb) _this.unLockMouseLook();

        return false;
    };

    this.mouseWheelEvent = function (event) {
        if (event.target == renderer.domElement || event.target == document.body) {
            event.preventDefault();
            var delta = event.wheelDelta ? event.wheelDelta : -event.detail;
            _this.cameraZoom -= delta > 0 ? 1 : -1;
            _this.cameraZoom = Math.min(30, Math.max(_this.cameraZoom, 3));
        }
    };

    if (!havePointerLock) {
        this.locked = true;
        document.addEventListener('mousemove', this.mouseMoveLocked, false);
    } else {
        document.addEventListener('mousemove', this.mouseMoveUnlocked, false);
    }

    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousewheel', this.mouseWheelEvent);
    document.addEventListener('DOMMouseScroll', this.mouseWheelEvent);

    this.lockMouseLook = function () {
        if (havePointerLock) {
            var element = document.body;
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();

        }

        this.isMouseLookLocked = true;
    };

    this.unLockMouseLook = function () {
        if (havePointerLock) {
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            document.exitPointerLock();
        }

        this.isMouseLookLocked = false;

    };
};

// disable contextmenu
window.oncontextmenu = function () {
    return false;
};

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {

    var element = document.body;

    var pointerlockchange = function (event) {

        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {

            //controls.blocker.style.display = 'none';
            controls.locked = true;
            document.addEventListener('mousemove', controls.mouseMoveLocked, false);
            document.removeEventListener('mousemove', controls.mouseMoveUnlocked, false);

        } else {
            //controls.blocker.style.display = '';
            controls.locked = false;
            document.addEventListener('mousemove', controls.mouseMoveUnlocked, false);
            document.removeEventListener('mousemove', controls.mouseMoveLocked, false);
        }

    };

    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

} else {
    console.log('ERROR: Your browser does seems to not support the pointer lock API.');

}

module.exports = GameControls;
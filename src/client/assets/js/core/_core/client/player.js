let lookingDownLimit = -1;
let lookingUpLimit = 1;

let currControls = new GameControls();
let lastCheck = Date.now();

// Used to handle refreshing of the krew list.
let refreshTimer = 0;

let playerModels = [];
let PlayerRaycaster = new THREE.Raycaster();

let setPlayerModels = () => {
    materials.dog_1 = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: textures.dog_diffuse
    });

    playerModels.push({
        body: new THREE.Mesh(geometry.dog_1, materials.dog_1),
        scale: new THREE.Vector3(0.04, 0.04, 0.04),
        offset: new THREE.Vector3(0, -0.4, 0.8),
        rotation: new THREE.Vector3(0.4, Math.PI, 0)
    });
}

Player.prototype.timeCounters = {}
Player.prototype.namesLogic = () => {
    if(this.isPlayer) {
        let fps = 5;

        if(!this.timeCounters.namesLogic) {
            this.timeCounters.namesLogic = {
                time: performance.now(),
                previousTime: performance.now()
            }
        }
        else this.timeCountres.namesLogic.time = performance.now();

        if(this.timeCounters.namesLogic.time - this.timeCounters.namesLogic.previousTIme > 1e3 / fps) {
            this.timeCOunters.namesLogic.previousTime = this.timeCountres.namesLogic.time;
            requestAnimationFrame(() => {
                // Call the getWorldPosition methof of the camera just once for optimization.
                let cameraWorldPosition = camera.getWorldPosition();

                // Check distance between each player / boat and camera in world position, and set if it is in the players vision range.
                for(let id in entities) {
                    if(entities[id].netType == 0
                    || entities[id].netType == 1
                    || entities[id].netType == 5) {
                        let actualDistance = disatnce(cameraWorldPosition, entities[id].geometry.getWorldPosition());
                        let length = CONFIG.Labels.distanceMultiplier[entities[id].netType];

                        entities[id].inRange = actualDistance <= length;

                        // Do not set this property if it is not used for better performance.
                        if(CONFIG.setProperties.inVision) entities[id].inRange && inPlayersVision(entities[id], camera);

                        if(entities[id].netType == 0) entities[id].setName(entities[id].name);
                        if(entities[id].netType == 1) entities[id].setName(entities[id].crewName);
                        if(entities[id].netType > 1) entities[id].setName(entities[id].name);
                    }
                }
            });
        }
    }
}

Player.prototype.dockedLogic = () => {
    if(this.isPlayer) {
        let fps = 20;
        let _this = this;

        if(!this.timeCounters.dockedLogic) {
            this.timeCounters.dockedLogic = {
                time: performance.now(),
                previousTime: performance.now()
            }
        }
    }
}

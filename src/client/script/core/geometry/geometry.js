/* Create reusable bodies */
let baseGeometry = {
    box: new THREE.BoxBufferGeometry(1, 1, 1),
    sphere: new THREE.SphereBufferGeometry(0.65),
    line: new THREE.Geometry(),
    plane: new THREE.PlaneGeometry(2, 2)
};

/* Create geometry using base geometry */
let geometry = {
    boat: baseGeometry.box,
    hook: baseGeometry.plane,
    impact_water: baseGeometry.sphere,
};

/* Create reusable materials */
let materials = {
    boat: new THREE.MeshLambertMaterial({
        color: 0x8A503E,
        side: THREE.DoubleSide
    }),

    sail: new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    }),

    sailRed: new THREE.MeshLambertMaterial({
        color: 0xd9534f,
        side: THREE.DoubleSide
    }),

    splinter: new THREE.MeshLambertMaterial({
        color: 0xCDAC8F,
        flatShading: true
    }),

    boundary: new THREE.MeshLambertMaterial({
        color: 0xB4EBFF,
        flatShading: true,
        opacity: 0.8,
        transparent: true
    }),

    impact_water: new THREE.MeshBasicMaterial({
        color: 0xE9F1FF,
        flatShading: true,
        opacity: 0.9,
        transparent: true
    }),

    islandradius: new THREE.MeshBasicMaterial({
        color: 0xd4f7ff,
        flatShading: false,
        opacity: 0.2,
        transparent: true
    }),

    smoke_enemy: new THREE.MeshBasicMaterial({
        color: 0xFFCACA,
        flatShading: true,
        opacity: 0.7,
        transparent: true
    }),

    smoke_friendly: new THREE.MeshBasicMaterial({
        color: 0xCDE6FF,
        flatShading: true,
        opacity: 0.7,
        transparent: true
    }),

    smoke_player: new THREE.MeshBasicMaterial({
        color: 0xE01E1E,
        flatShading: true,
        opacity: 0.5,
        transparent: true
    }),

    sky: new THREE.MeshBasicMaterial({
        color: 0x00c5ff,
        side: THREE.DoubleSide
    })
};

/* Set colors for text labels for player & boat names */
let labelcolors = {
    staff: new THREE.Color(0xd133ff),
    myself: new THREE.Color(0xafffa1),
    player: new THREE.Color(0xffffff),
    captain: new THREE.Color(0xff7a38)
};

/* Create global vectors */
let vectors = {
    modeloffsetCrab: new THREE.Vector3(0, 0.9, 0),
    modeloffsetFishShellClam: new THREE.Vector3(0, 0.3, 0),
    sizePlayer: new THREE.Vector3(1, 1, 1),
    sizeProjectile: new THREE.Vector3(0.3, 0.3, 0.3)
};
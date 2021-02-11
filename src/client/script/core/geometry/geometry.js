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
    impact_water: baseGeometry.sphere
};

/* Create reusable materials */
let materials = {
    boat: new THREE.MeshLambertMaterial({
        color: 0x8a503e,
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
        color: 0xcdac8f,
        flatShading: true
    }),

    boundary: new THREE.MeshLambertMaterial({
        color: 0xb4ebff,
        flatShading: true,
        opacity: 0.8,
        transparent: true
    }),

    impact_water: new THREE.MeshBasicMaterial({
        color: 0xe9f1ff,
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
        color: 0xffcaca,
        flatShading: true,
        opacity: 0.7,
        transparent: true
    }),

    smoke_friendly: new THREE.MeshBasicMaterial({
        color: 0xe7ffe6,
        flatShading: true,
        opacity: 0.7,
        transparent: true
    }),

    smoke_player: new THREE.MeshBasicMaterial({
        color: 0xe01e1e,
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
    admin: new THREE.Color(0x1f9aff),
    mod: new THREE.Color(0x8747ff),
    myself: new THREE.Color(0x2cf22f),
    clan: new THREE.Color(0xffe815),
    captain: new THREE.Color(0xff894e),
    krewmate: new THREE.Color(0xff4b2b),
    player: new THREE.Color(0xffffff),

    boat: new THREE.Color(0xc5a37c),
    landmark: new THREE.Color(0x5e9628),
    crosshair: new THREE.Color(0xffffff)
};

/* Create global vectors */
let vectors = {
    modeloffsetCrab: new THREE.Vector3(0, 0.9, 0),
    modeloffsetFishShellClam: new THREE.Vector3(0, 0.3, 0),
    sizePlayer: new THREE.Vector3(1, 1, 1),
    sizeProjectile: new THREE.Vector3(0.3, 0.3, 0.3)
};
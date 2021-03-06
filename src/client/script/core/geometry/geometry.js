/* Create reusable bodies */
let baseGeometry = {
    box: new THREE.BoxBufferGeometry(1, 1, 1),
    sphere: new THREE.SphereBufferGeometry(0.65),
    line: new THREE.Geometry(),
    plane: new THREE.PlaneGeometry(2, 2)
};

/* Create reusable materials */
let materials = {
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
    admin: new THREE.Color(0x2a92f9),
    mod: new THREE.Color(0x9d44e5),
    helper: new THREE.Color(0x63ecfd),
    designer: new THREE.Color(0x6075ff),
    myself: new THREE.Color(0x2cf22f),
    clan: new THREE.Color(0xffb411),
    captain: new THREE.Color(0xff5100),
    krewmate: new THREE.Color(0xff7640),
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

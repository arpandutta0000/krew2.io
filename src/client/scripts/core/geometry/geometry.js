/* Create reusable bodies */
let base_geometries = {
    box: new THREE.BoxBufferGeometry(1, 1, 1),
    sphere: new THREE.SphereBufferGeometry(0.65),
    line: new THREE.Geometry(),
    plane: new THREE.PlaneGeometry(2, 2)
};

/* Create geometry using base geometry */
geometry.player = base_geometries.box;
geometry.boat = base_geometries.box;
geometry.projectile = base_geometries.sphere;
geometry.hook = base_geometries.plane;
geometry.impact_water = base_geometries.sphere;
geometry.islandradius = new THREE.CylinderBufferGeometry(0.3, 1, 1, 20, 1);

/* Create reusable materials */
materials.player = new THREE.MeshLambertMaterial({
    color: 0xF9A022
});

materials.boat = new THREE.MeshLambertMaterial({
    color: 0x8A503E,
    side: THREE.DoubleSide
});

materials.sail = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
});

materials.sailRed = new THREE.MeshLambertMaterial({
    color: 0xd9534f,
    side: THREE.DoubleSide
});

materials.splinter = new THREE.MeshLambertMaterial({
    color: 0xCDAC8F,
    flatShading: true
});

materials.projectile = new THREE.MeshPhongMaterial({
    color: 0x1E1A28,
    shininess: 0.9,
    flatShading: true
});

materials.boundary = new THREE.MeshLambertMaterial({
    color: 0xB4EBFF,
    flatShading: true,
    opacity: 0.8,
    transparent: true
});

materials.impact_water = new THREE.MeshBasicMaterial({
    color: 0xE9F1FF,
    flatShading: true,
    opacity: 0.9,
    transparent: true
});

materials.islandradius = new THREE.MeshBasicMaterial({
    color: 0xd4f7ff,
    flatShading: false,
    opacity: 0.2,
    transparent: true
});

materials.smoke_enemy = new THREE.MeshBasicMaterial({
    color: 0xFFCACA,
    flatShading: true,
    opacity: 0.7,
    transparent: true
});

materials.smoke_friendly = new THREE.MeshBasicMaterial({
    color: 0xCDE6FF,
    flatShading: true,
    opacity: 0.7,
    transparent: true
});

materials.smoke_player = new THREE.MeshBasicMaterial({
    color: 0xE01E1E,
    flatShading: true,
    opacity: 0.5,
    transparent: true
});

materials.fishing_line = new THREE.MeshBasicMaterial({
    color: 0x000000,
    flatShading: true,
    opacity: 0.5,
    transparent: true
});

materials.sky = new THREE.MeshBasicMaterial({
    color: 0x00c5ff,
    side: THREE.DoubleSide
});

// Set colors for text labels for player & boat names
labelcolors.staff = new THREE.Color(0xbb15eb);
labelcolors.myself = new THREE.Color(0x00ff00);
labelcolors.player = new THREE.Color(0xffffff);
labelcolors.captain = new THREE.Color(0xff0000);

// Create global vectors
vectors.modeloffsetCrab = new THREE.Vector3(0, 0.9, 0);
vectors.modeloffsetFishShellClam = new THREE.Vector3(0, 0.3, 0);
vectors.sizeEntity = new THREE.Vector3(1, 1, 1);
vectors.sizePlayer = new THREE.Vector3(1, 1, 1);
vectors.sizeProjectile = new THREE.Vector3(0.3, 0.3, 0.3);

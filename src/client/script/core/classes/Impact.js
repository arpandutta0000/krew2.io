class Impact extends Entity {
    /* Constructor */
    constructor(type, x, z) {
        // Get parent class (Entity) methods and create properties
        super();

        // Set netType
        this.netType = 3;

        // Set sending snap and delta
        this.sendDelta = false;
        this.sendSnap = false;
        this.sendCreationSnapOnDelta = true;

        // Set impact timeout
        this.timeout = 1.0;

        // Set impact size
        this.size = new THREE.Vector3(1, 1, 1);

        // Set position
        this.position.x = x;
        this.position.y = 0;
        this.position.z = z;

        // Create particles based on impact type
        this.impactType = type;
        switch (type) {
            case 0: { // water
                this.baseGeometry = geometry.impact_water;
                this.baseMaterial = materials.impact_water;
                for (let i = 0; i < 3; ++i) {
                    createParticle({
                        vx: -5 + Math.random() * 10,
                        vy: 4 + Math.random() * 2,
                        vz: -5 + Math.random() * 10,
                        x: x,
                        z: z,
                        y: 0,
                        w: 0.3,
                        h: 0.3,
                        d: 0.3,
                        gravity: 5,
                        rotaSpeed: Math.random() * 20,
                        duration: 5,
                        sizeSpeed: -0.6,
                        material: materials.impact_water,
                        geometry: base_geometries.box
                    });
                };

                break;
            }

            case 1: { // ship
                GameAnalytics(`addDesignEvent`, `Game:Session:Hit`);
                for (let i = 0; i < 5; ++i) {
                    createParticle({
                        vx: -10 + Math.random() * 20,
                        vy: 5 + Math.random() * 5,
                        vz: -10 + Math.random() * 20,
                        x: x,
                        z: z,
                        y: 0,
                        w: 0.2 + Math.random() * 0.5,
                        h: 0.2 + Math.random() * 0.5,
                        d: 0.2 + Math.random() * 0.5,

                        gravity: 12,
                        rotaSpeed: Math.random() * 10,
                        duration: 2,
                        sizeSpeed: -0.8,
                        material: materials.splinter,
                        geometry: base_geometries.box

                    });
                };

                break;
            }
        }
    }

    logic(dt) {
        ImpactLogic.logic(dt, this);
    }

    clientlogic(dt) {
        ImpactLogic.clientLogic(dt, this);
    }

    getTypeSnap() {
        ImpactSnap.getTypeSnap(this);
    }

    parseTypeSnap(snap) {
        ImpactSnap.parseTypeSnap(snap, this);
    }

    getTypeDelta() {
        if (!this.spawnPacket) {
            this.spawnPacket = true;
            return this.getTypeSnap();
        }

        return undefined;
    }
};
/**
 * Impact class
 *
 * @class
 * @extends Entity
 */
class Impact extends Entity {
    /**
     * Entity Constructor
     *
     * @param {number} type Impact type
     * @param {number} x Impact x position
     * @param {number} z Impact z position
     */
    constructor (type, x, z) {
        // Inherit parent class methods
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
            // Water
            case 0: {
                this.baseGeometry = baseGeometry.sphere;
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
                        geometry: baseGeometry.box
                    });
                }

                break;
            }

            // Boat
            case 1: {
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
                        geometry: baseGeometry.box

                    });
                }

                break;
            }
        }
    }

    /**
     * Get an impact's delta type
     */
    getTypeDelta () {
        return ImpactDelta.getTypeDelta(this);
    }

    /**
     * Impact logic method
     *
     * @param {number} dt DT
     */
    logic (dt) {
        ImpactLogic.logic(dt, this);
    }

    /**
     * Impact client logic method
     *
     * @param {number} dt DT
     */
    clientlogic (dt) {
        ImpactLogic.clientlogic(dt, this);
    }

    /**
     * Method to parse an impact type snap
     *
     * @param {object} snap Snap to be parsed
     */
    parseTypeSnap (snap) {
        ImpactSnap.parseTypeSnap(snap, this);
    }
}

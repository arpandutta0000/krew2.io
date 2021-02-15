/**
 * Projectile class
 *
 * @class
 * @extends Entity
 */
class Projectile extends Entity {
    /**
     * Projectile Constructor
     */
    constructor () {
        // Inherit parent class methods
        super();

        // Set netType
        this.netType = 2;

        // size of a Projectile
        this.size = vectors.sizeProjectile;

        // Mute variables to not be sent via delta
        this.muted = [`x`, `z`];

        // Set sending snap and delta
        this.sendDelta = false;
        this.sendSnap = false;
        this.sendCreationSnapOnDelta = true;

        // Misc variables
        this.spawnPacket = false;
        this.type = -1; // 0 = cannon ball, 1 = fishing hook
        this.reel = false;
        this.shooterid = ``;
        this.impact = undefined;
        this.setProjectileModel = true;

        // Set geometry references
        this.particletimer = 0;
        this.shooterStartPos = new THREE.Vector3();
        this.startPoint = new THREE.Vector3();
        this.endPoint = new THREE.Vector3();
    }

    /**
     * Get a projectile's delta type
     */
    getTypeDelta () {
        return ProjectileDelta.getTypeDelta(this);
    }

    /**
     * Projectile logic method
     *
     * @param {number} dt DT
     */
    logic (dt) {
        ProjectileLogic.logic(dt, this);
    }

    /**
     * Projectile client logic method
     *
     * @param {number} dt DT
     */
    clientlogic (dt) {
        ProjectileLogic.clientlogic(dt, this);
    }

    /**
     * Method to parse a pprojectile type snap
     *
     * @param {object} snap Snap to be parsed
     */
    parseTypeSnap (snap) {
        ProjectileSnap.parseTypeSnap(snap, this);
    }
}

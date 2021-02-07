/* Projectile class */

class Projectile extends Entity {
    /* Constructor */
    constructor() {
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

    getTypeDelta() {
        return ProjectileDelta.getTypeDelta(this);
    }

    logic(dt) {
        ProjectileLogic.logic(dt, this);
    }

    clientlogic(dt) {
        ProjectileLogic.clientlogic(dt, this);
    }

    parseTypeSnap(snap) {
        ProjectileSnap.parseTypeSnap(snap, this);
    }
};
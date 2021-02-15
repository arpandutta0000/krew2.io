/**
 * Create a particle
 *
 * @param {object} params Particle parameters
 */
let createParticle = function (params) {
    if (!myPlayer || !myPlayer.parent || ((Math.pow(params.x - myPlayer.parent.position.x, 2) + Math.pow(params.z - myPlayer.parent.position.z, 2)) > 10000)) {
        return;
    }

    particles.push(new Particle(params));
};

/**
 * Particle class
 *
 * @class
 */
class Particle {
    /**
     * Particle constructor
     *
     * @param {object} params Particle parameters
     */
    constructor (params) {
        this.vx = params.vx;
        this.vy = params.vy;
        this.vz = params.vz;
        this.gravity = params.gravity;
        this.rotaSpeed = params.rotaSpeed;
        this.duration = params.duration;
        this.timeleft = this.duration;
        this.sizeSpeed = params.sizeSpeed;
        this.globalscale = 1;
        this.w = params.w; // size
        this.h = params.h;
        this.d = params.d;
        this.x = params.x;
        this.y = params.y;
        this.z = params.z;

        // create geometry
        this.geometry = new THREE.Mesh(params.geometry, params.material);
        this.geometry.position.set(params.x, params.y, params.z);
        this.geometry.scale.set(params.w, params.h, params.d);
        this.geometry.renderOrder = 24;

        // set this to true and the particle will be removed
        this.deleteMe = false;

        scene.add(this.geometry);
    }

    /**
     * Method to tick a particle
     *
     * @param {number} dt DT
     */
    tick (dt) {
        // subtract gravity
        this.vy -= this.gravity * dt;

        // update positioon
        this.geometry.position.set(
            this.geometry.position.x + this.vx * dt,
            this.geometry.position.y + this.vy * dt,
            this.geometry.position.z + this.vz * dt
        );

        // update rotation
        this.geometry.rotation.set(
            this.geometry.rotation.x + this.rotaSpeed * dt,
            this.geometry.rotation.y + this.rotaSpeed * dt,
            this.geometry.rotation.z + this.rotaSpeed * dt
        );

        // update scale
        this.globalscale += this.sizeSpeed * dt;
        this.geometry.scale.set(
            this.w * this.globalscale,
            this.h * this.globalscale,
            this.d * this.globalscale
        );

        this.timeleft -= dt;
        if (this.timeleft <= 0 || this.globalscale <= 0) {
            scene.remove(this.geometry);
            this.deleteMe = true;
        }
    }
}

/**
 * Tick all particles
 *
 * @param {number} dt DT
 */
let tickParticles = function (dt) {
    let i = particles.length;
    while (i--) {
        particles[i].tick(dt);
        if (particles[i].deleteMe) {
            particles.splice(i, 1);
        }
    }
};

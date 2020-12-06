let particles = [];

let Particle = params => {
    // Parse parameters.
    this.vx = params.vx;
    this.vy = params.vy;
    this.vz = params.vz;

    this.gravity = params.gravity;
    this.rotaSpeed = params.rotaSpeed;
    this.duration = params.duration;

    this.timeleft = this.duration;
    this.sizeSpeed = params.sizeSpeed;
    this.globalscale = 1;

    this.w = params.w;
    this.h = params.h;

    this.d = params.d;

    this.x = params.x;
    this.y = params.y;
    this.z = params.z;

    // Create geometry.
    this.geometry = new THREE.Mesh(params.geometry, params.material);
    this.geometry.position.set(this.x, this.y, this.z);
    this.geometry.scale.set(this.w, this.h, this.d);

    // Set this to true and the particle will be removed.
    this.deleteMe = false;
    scene.add(this.geometry);
}

Particle.prototype.tick = dt => {
    // Subtract gravity.
    this.vy -= this.gravity * dt;

    // Update position.
    this.geometry.position.set(
        this.geometry.position.x + this.vx * dt,
        this.geometry.position.y + this.vy * dt,
        this.geometry.position.z + this.vz * dt
    );

    // Update rotation.
    this.geometry.rotation.set(
        this.geometry.rotation.x + this.rotaSpeed * dt,
        this.geometry.rotation.y + this.rotaSpeed * dt,
        this.geometry.rotation.z + this.rotaSpeed * dt
    );

    // Update scale.
    this.globalscale += this.sizeSpeed * dt;
    this.geometry.scale.set(
        this.w * this.globalscale,
        this.h * this.globalscale,
        this.d * this.globalscale
    );

    this.timeleft -= dt;
    if(this.timeleft <= 0 || this.globalscale <= 0) {
        scene.remove(this.goemetry);
        this.deleteMe = true;
    }
}

// Creating a new particle.
let createParticle = params => {
    if(!myPlayer || !myPlayer.parent || ((Math.pow(params.x - myPlayer.parent.position.x, 2) + Math.pow(params.z - myPlayer.parent.position.z, 2)) > 1e4)) return;
    particles.push(new Particle(params));
}

// Ticking the particles.
let tickParticles = dt => {
    let i = particles.length;
    while(i--) {
        particles[i].tick(dt);
        if(particles[i].deleteMe) particles.splice(i, 1);
    }
}

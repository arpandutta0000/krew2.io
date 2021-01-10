let particles = [];

function Particle (params) {
    // parse parameters
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
    this.geometry.castShadow = true;

    // set this to true and the particle will be removed
    this.deleteMe = false;

    scene.add(this.geometry);
}

Particle.prototype.tick = function (dt) {
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
};

// creeating a new particle
let createParticle = function (params) {
    if (!myPlayer || !myPlayer.parent || ((Math.pow(params.x - myPlayer.parent.position.x, 2) + Math.pow(params.z - myPlayer.parent.position.z, 2)) > 10000)) {
        return;
    }

    particles.push(new Particle(params));
};

// -------- Ticking the particles
let tickParticles = function (dt) {
    let i = particles.length;
    while (i--) {
        particles[i].tick(dt);
        if (particles[i].deleteMe) {
            particles.splice(i, 1);
        }
    }
};

// var particles = []
// var activeParticles = [];
// var inactiveParticles = [];
// var particleBuffer = undefined;

// var particleCount = 400;

// var particleGeometry = undefined;
// var p_positions = undefined
// var p_sizes = undefined
// var p_colors = undefined
// var p_rotation = undefined

// var particleIndex = 0;

// // set up base particle stuff
// var initParticleSystem = function() {

// 	   materials.particles = new THREE.RawShaderMaterial( {
// 		uniforms: {
// 			texture: { value: textures.particle }
// 		},
// 		vertexShader: shaders['particle.vert'],
//         fragmentShader: shaders['particle.frag'],
// 		//depthTest: true,
// 		//transparent: true,
// 		alphaTest:0.5,
// 		depthWrite:false,
// 		transparent:true,
// 		blendSrc:THREE.SrcAlphaFactor,
// 		blendDst:THREE.OneMinusSrcAlphaFactor
// 	} );

// 	// set up particle buff
// 	particleGeometry = new THREE.BufferGeometry();

//     p_positions = new Float32Array(particleCount * 3);
//     p_sizes = new Float32Array(particleCount);
//     p_colors = new Float32Array(particleCount *4);

// 	particleGeometry.addAttribute( 'position', new THREE.BufferAttribute( p_positions, 3 ) );
// 	particleGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( p_colors, 4 ) );
// 	particleGeometry.addAttribute( 'size', new THREE.BufferAttribute( p_sizes, 1 ) );

//     particleBuffer = new THREE.Points( particleGeometry, materials.particles );
//     particleBuffer.frustumCulled = false;

// 	scene.add( particleBuffer );

// 	// create particle info containers
// 	for ( var i = 0, i3 = 0, i4 = 0; i < particleCount; i ++, i3 += 3, i4 +=4 ) {
// 		particles.push( new Particle(i3,i4,i));
// 		inactiveParticles.push(particles[i]);
// 	}
// }

// function Particle(posIndex, colIndex, scaleIndex) {

// 	this.posIndex = posIndex;
// 	this.colorIndex = colIndex;
// 	this.scaleIndex = scaleIndex;

// 	this.init({});
//     this.alive = false;
// }

// Particle.prototype.init = function(params) {

// 	this.vx = params.vx || 0;
//     this.vy = params.vy || 0
//     this.vz = params.vz || 0
//     this.gravity = params.gravity || 0

//     this.duration = params.duration || 10
//     this.timeleft = this.duration
//     this.sizeSpeed = params.sizeSpeed || 0
//     this.alphaChange = params.alphaChange || 0

//     p_sizes[ this.scaleIndex ]  = params.scale || 0

//    	p_positions[ this.posIndex + 0 ] = params.x || 0;
// 	p_positions[ this.posIndex + 1 ] = params.y || 0;
// 	p_positions[ this.posIndex + 2 ] = params.z || 0;

// 	p_colors[ this.colorIndex + 0 ] = params.r || 1;
// 	p_colors[ this.colorIndex + 1 ] = params.g || 0;
// 	p_colors[ this.colorIndex + 2 ] = params.b || 0;
// 	p_colors[ this.colorIndex + 3 ] = params.a || 0;

//     this.alive = true;

//     return this;
// }

// Particle.prototype.tick = function(dt) {

// 	if(!this.alive) return;

//     // subtract gravity
//     this.vy -= this.gravity * dt;

//     p_positions[ this.posIndex + 0 ] += this.vx * dt,
// 	p_positions[ this.posIndex + 1 ] += this.vy * dt,
// 	p_positions[ this.posIndex + 2 ] += this.vz * dt,

// 	// colors
// 	p_colors[ this.colorIndex + 3 ] += this.alphaChange * dt;

//     // update size / make size 0 for death
//     this.timeleft -= dt;
//     if (this.timeleft <= 0 ||
//     	p_sizes[ this.scaleIndex ] <= 0 ||
//     	p_colors[ this.colorIndex + 3 ] <= 0) {
//         this.alive = false;
//         // if dead, size is zero
//     	p_sizes[ this.scaleIndex ] = 0;
//     } else {
//     	// update scale
//     	p_sizes[ this.scaleIndex ] += this.sizeSpeed * dt;
//     }

// }

// // creeating a new particle
// var createParticle = function(params) {
// 	// count up the index until we get a dead particle slot
// 	if(inactiveParticles.length <= 0 ||
// 		// player distance check
// 		!myPlayer ||  !myPlayer.parent || ((Math.pow(params.x - myPlayer.parent.position.x, 2) + Math.pow(params.z - myPlayer.parent.position.z, 2)) > 50000)
// 		) return;
//     // init dead particle and add it to active particle array
//     activeParticles.push(inactiveParticles[inactiveParticles.length-1].init(params));
//     inactiveParticles.pop()

// }

// // -------- Ticking the particles
// var tickParticles = function(dt) {
//     var i = activeParticles.length
//     while (i--) {
//         activeParticles[i].tick(dt)
//         if (!activeParticles[i].alive) {
//             inactiveParticles.push(activeParticles[i]);
//             activeParticles.splice(i, 1)
//         }
//     }

//      particleGeometry.attributes.position.needsUpdate = true;
//     particleGeometry.attributes.customColor.needsUpdate = true;
//     particleGeometry.attributes.size.needsUpdate = true;

// }

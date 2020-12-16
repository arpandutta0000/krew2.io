// PLayers are entities, check core_entity.js for the base class
Projectile.prototype = new Entity();
Projectile.prototype.constructor = Projectile;

function Projectile(shooter) {
    this.createProperties();

    // netcode type
    this.netType = 2;

    // size of a Projectile
    this.size = vectors.sizeProjectile;


    // projectiles dont send a lot of delta data
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;
    this.muted = ['x', 'z'];
    this.shooterid = '';
    this.shooterStartPos = new THREE.Vector3(); //initial world position of shooter
    this.reel = false;
    this.impact = undefined;

    this.type = -1 // 0 = cannon ball, 1 = fishing hook

    // duration of projectile being airbourne
    this.airtime = 0;

    // this is a flag that is used to amke sure the info is sent insantly once the ball spawns
    this.spawnPacket = false;

    this.setProjectileModel = true;

    // set up references to geometry and material
    this.particletimer = 0;
    this.startPoint = new THREE.Vector3(0, 0, 0);
    this.endPoint = new THREE.Vector3(0, 0, 0);
}

Projectile.prototype.logic = function (dt) {

    // Remove if the soooter does not exists
    if (this.shooterid === '' || entities[this.shooterid] === undefined || (entities[this.shooterid] !== undefined && this.type != -1 && this.type != entities[this.shooterid].activeWeapon))
    {
        if(this.impact) this.impact.destroy = true;
        removeEntity(this);
        return;
    }


    if (entities[this.shooterid] !== undefined && entities[this.shooterid].use == false)
    {
        entities[this.shooterid].isFishing = false;
    }

    if (this.position.y >= 0) {
        // gravity is acting on the velocity
        this.velocity.y -= 25.0 * dt;
        this.position.y += this.velocity.y * dt;
    }

    if (entities[this.shooterid] !== undefined  && entities[this.shooterid].parent !== undefined) {
        var playerPos = entities[this.shooterid].worldPos();

        // If the player is on a boat, don't destroy the fishing rod if they are moving unless it's far from player
        if (entities[this.shooterid].parent !== undefined &&
            entities[this.shooterid].parent.netType === 5)
        {
            if (playerPos.z.toFixed(2) != this.shooterStartPos.z.toFixed(2) &&
                playerPos.x.toFixed(2) != this.shooterStartPos.x.toFixed(2)) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        }
        else
        {
            var fromPlayertoRod = playerPos.distanceTo(this.shooterStartPos);
            //var fromPlayertoRod = distance(playerPos,this.shooterStartPos)
            if (fromPlayertoRod >= 40) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        }
    }

    if (this.position.y < 10) {// if the cannon ball is below surface level, remove it

        var hasHitBoat = false;

        // if boat was hit or we fall in water, remove
        if (this.position.y < 0 || hasHitBoat) {

            //if boat was hit or
            if (
                this.reel ||
                this.shooterid === '' ||
                entities[this.shooterid] === undefined ||
                entities[this.shooterid].use == true ||
                entities[this.shooterid].activeWeapon === 0 ||
                this.position.x > worldsize ||
                this.position.z > worldsize ||
                this.position.x < 0 ||
                this.position.z < 0
            ) {
                if(this.impact) this.impact.destroy = true;
                removeEntity(this);
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
                if(myPlayer && this.shooterid == myPlayer.id)
                    ui.playAudioFile(false,'fishing');

                entities[this.shooterid].isFishing = true;
            }
        }
    }

    this.airtime += dt;
};

Projectile.prototype.clientlogic = function (dt) {

    // check if we didn't set a model yet
    var shootingPlayer = entities[this.shooterid];

    if (shootingPlayer === undefined ||
        (shootingPlayer && shootingPlayer.parent && shootingPlayer.parent.hp <= 0))
    {
        scene.remove(this.geometry);
        if (this.line !== undefined) {
            scene.remove(this.line);
            this.line.geometry.dispose();
        }
    }

    if (shootingPlayer && this.setProjectileModel == true) {
        scene.remove(this.geometry);
        /*if (scene.getObjectByName(shootingPlayer.id + "fishing_line"))
            scene.remove(scene.getObjectByName(shootingPlayer.id + "fishing_line"))*/

        // determine projectile model based on player active weapon
        if (shootingPlayer.activeWeapon === 0) {
            //this.baseGeometry = geometry.projectile;
            //this.baseMaterial = materials.projectile;
            this.geometry = new THREE.Sprite( materials.cannonball );
        } else if (shootingPlayer.activeWeapon === 1) {
            this.baseGeometry = geometry.hook;
            this.baseMaterial = materials.hook;

            var lineGeometry = base_geometries.line.clone();
            lineGeometry.vertices.push(this.startPoint);
            lineGeometry.vertices.push(this.endPoint);

            this.line = new THREE.Line(lineGeometry, new THREE.MeshBasicMaterial({ color: 0x000 }));
            sceneLines[this.id] = this.line;

            //this.line.name = shootingPlayer.id + "fishing_line";
            this.line.frustumCulled = false;
            if (entities[this.shooterid].weapon) {
                var boundariesBox = new THREE.Box3();
                boundariesBox.setFromObject(entities[this.shooterid].weapon);
                this.startPoint.set(boundariesBox.max.x - 0.5, boundariesBox.max.y, boundariesBox.max.z - 0.5);
            }

            scene.add(this.line);
            this.geometry = new THREE.Mesh(this.baseGeometry, this.baseMaterial);
        }

        //this.geometry = new THREE.Mesh(this.baseGeometry, this.baseMaterial);
        //this.geometry = projectileObj.clone();
        sceneCanBalls[this.id] = this.geometry;
        scene.add(this.geometry);
        this.setProjectileModel = false;
    }

    // this.geometry.rotation.y  = 0;
    this.geometry.position.set(this.position.x, this.position.y, this.position.z);

    // Check if we have the fishing line, adjust its position dynamically
    if (this.line) {
        // Make fishing line follow rod position
        if (shootingPlayer && shootingPlayer.weapon) {
            var boundariesBox = new THREE.Box3();
            boundariesBox.setFromObject(entities[this.shooterid].weapon);
            this.startPoint.set(boundariesBox.max.x - 0.5, boundariesBox.max.y, boundariesBox.max.z - 0.5);
        }

        this.endPoint.set(this.position.x, this.position.y, this.position.z);
        this.line.geometry.verticesNeedUpdate = true;

        this.geometry.rotation.y += 1.5 * dt;
    } else if (shootingPlayer && shootingPlayer.activeWeapon === 0) {

        this.particletimer -= dt;
        if (this.particletimer < 0) {
            var byPlayer = myPlayer && this.shooterid == myPlayer.id;
            var friendly = myPlayer && myPlayer.parent && myPlayer.parent.children[this.shooterid];
            this.particletimer = 0.04;
            createParticle({
                vx: 0,
                vy: 0,
                vz: 0,
                x: this.position.x,
                z: this.position.z,
                y: this.position.y,
                w: byPlayer ? 0.7 : 0.4,
                h: byPlayer ? 0.7 : 0.4,
                d: byPlayer ? 0.7 : 0.4,
                gravity: 0,
                duration: 2,
                rotaSpeed: Math.random() * 5,
                sizeSpeed: -1.8,
                material: byPlayer ? materials.smoke_player : (friendly ? materials.smoke_friendly : materials.smoke_enemy),

                geometry: base_geometries.box,
            });

        }
    }

};

// Projectile.prototype.getTypeSnap = function () {
//     var snap = {
//         x: this.position.x.toFixed(2), // x and z position relative to parent
//         z: this.position.z.toFixed(2),
//         y: this.position.y.toFixed(2),
//         vx: this.velocity.x.toFixed(2),
//         vy: this.velocity.y.toFixed(2),
//         vz: this.velocity.z.toFixed(2),
//         i: this.shooterid,
//         r: this.reel,
//         sx: this.shooterStartPos.x.toFixed(2),
//         sz: this.shooterStartPos.z.toFixed(2),
//     };
//
//     return snap;
// };

Projectile.prototype.getTypeDelta = function () {
    if (!this.spawnPacket) {
        this.spawnPacket = true;
        return this.getTypeSnap();
    }

    return undefined;
};

// function that parses a snapshot
Projectile.prototype.parseTypeSnap = function (snap) {
    if (snap.vx !== undefined) {this.velocity.x = parseFloat(snap.vx);}

    if (snap.vy !== undefined) {this.velocity.y = parseFloat(snap.vy);}

    if (snap.vz !== undefined) {this.velocity.z = parseFloat(snap.vz);}

    if (snap.x !== undefined) {this.position.x = parseFloat(snap.x);}

    if (snap.z !== undefined) {this.position.z = parseFloat(snap.z);}

    if (snap.y !== undefined) {this.position.y = parseFloat(snap.y);}

    if (snap.i !== undefined && snap.i != this.shooterid) {this.shooterid = snap.i;}

    if (snap.r !== undefined && snap.r != this.reel) {this.reel = parseBool(snap.r);}

    if (snap.sx !== undefined) {this.shooterStartPos.x = parseFloat(snap.sx);}

    if (snap.sz !== undefined) {this.shooterStartPos.z = parseFloat(snap.sz);}

};

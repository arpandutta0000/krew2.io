// Function for logging.
const log = require(`../utils/log.js`);
const { removeEntity, boats } = require("./postConcat.js");

Projectile.prototype = new Entity();
Projectile.prototype.constructor = Projectile;

let Projectile = shooter => {
    this.createProperties();

    // Netcode type.
    this.netType = 2;

    // Size of a projectile.
    this.size = new THREE.Vector3(0.3, 0.3, 0.3);
    
    // Projectiles don't send a lot of delta data.
    this.sendDelta = false;
    this.sendSnap = false;
    this.sendCreationSnapOnDelta = true;
    this.muted = [`x`, `z`];
    this.shooterid = ``;
    this.shooterStartPos = new THREE.Vector3(); // Initial world position of shooter.
    this.reel = false;
    this.impact = undefined;

    this.type = -1; // 0 = cannon ball, 1 = fishing hook.

    // Duration of projectile being airborne.
    this.airtime = 0;

    // This is a flag that is used to make sure the info is sent instantly once hte ball spawns.
    this.spawnPacket = false;

    // Setup references to geometry and material.
    this.setProjectileModel = true;

    // Remove projectile if it shouldn't be there.
    if(!shooter
    || shooter.activeWeapon == -1
    || shooter.activeWeapon == 2
    || shooter.parent.netType == 5
    || shooter.activeWeapon == 0
    || shooter.parent.hp < 1
    || (shooter.activeWeapon == 0 &&
        shooter.parent.shipState == -1
        || shooter.parent.shipState == 4
        || shooter.parent.shipState == 3)
    ) {
        if(this.impact) this.impact.destroy = true;
        removeEntity(this);
        return;
    }

    this.shooterid = shooter.id;
    this.shooter = shooter;

    let pos = shooter.worldPos();

    this.position.x = pos.x;
    this.position.z = pos.z;

    if(shooter.parent.netType == 1) this.position.y = this.shooter.parent.getHeightAboveWater() + 0.5;
    else this.position.y = 2.4;
    
    this.rotation = shooter.rotation + (shooter.parent ? this.shooter.parent.rotation: 0);
    this.shooterStartPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    
    let moveVector = new THREE.Vector3(0, 0, -1);
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
    this.velocity = moveVector;

    let vertspeed, upspeed;
    if(this.shooter && this.shooter.activeWeapon == 1) {
        vertspeed = Math.cos(shooter.pitch * 0.75) * (40 + (Math.min(1e4, parseFloat(shooter.score)) / 2e3));
        upspeed = Math.sin(shooter.pitch * 0.75) * (40 + (Math.min(1e4, parseFloat(shooter.score)) / 2e3));

        this.velocity.x *= vertspeed;
        this.velocity.z *= vertspeed;

        this.velocity.y = upspeed;
        this.type = 1;
    }
    else if(this.shooter && this.shooter.activeWeapon == 0) {
        let attackDistanceBonus = (1 + (parseFloat(shooter.attackDistanceBonus) + shooter.pointsFormula.getDistance()) / 100);
        vertspeed = Math.cos(shooter.pitch * attackDistanceBonus) * (40 + (Math.min(1e4, parseFloat(shooter.score)) / 2e3));
        upspeed = Math.sin(shooter.pitch * attackDistanceBonus) * (40 + (Math.min(1e4), parseFloat(shooter.score) / 2e3));

        this.velocity.x *= vertspeed * attackDistanceBonus;
        this.velocity.z *= vertspeed * attackDistanceBonus;

        this.velocity.y = upspeed * attackDistanceBonus;
        this.shooter.shotsFired++;
        this.type = 0;
    }
}

Projectile.prototype.logic = dt => {
    // Remove if the shooter does not exist.
    if(this.shooterid == ``
    || entities[this.shooterid] == undefined
    || (entities[this.shooterid] != undefined
    && this.type != -1
    && this.type != entities[this.shooterid].activeWeapon)) {
        if(this.impact) this.impact.destroy = true;
        removeEntity(this);
        return;
    }

    if(this.position.y >= 0) {
        // Gravity is acting on the velocity.
        this.velocity.y -= 25.0 * dt;
        this.position.y += this.velocity.y * dt;
    }

    if(entities[this.shooterid] != undefined) {
        let playerPos = entities[this.shooterid].worldPos();

        // If the player is on a boat, don't destory the fishing rod if they are moving unless it's far from the player.
        if(entities[this.shooterid].parent != undefined && entities[this.shooterid].parent.netType == 5) {
            if(playerPos.z.toFixed(2) != this.shooterStartPos.z.toFixed(2)
            && playerPos.x.toFixed(2) != this.shooterStartPos.x.toFixed(2)) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        }
        else {
            let fromPlayerToRod = playerPos.distanceTo(this.shooterStartPos);
            if(fromPlayerToRod >= 40) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        }
    }

    if(this.position.y < 10) {
        // If the cannonball is below surface level, remove it.
        let hasHitBoat = false;

        // On the server, we will spawn an impact.
        if(this.shooter && this.shooter.parent.captain) {
            // If player's active weapon is cannon.
            if(this.shooter.activeWeapon == 0) {
                // Counter for hits done per shot.
                this.shooter.overallHits = 0;

                // Check against all boats.
                boats.forEach(boat => {
                    // Don't check against boats that have died or are docked.
                    if(boat.hp < 1 || boat.shipState == 3 || boat.shipState == -1 || boat.shipState == 4) return;

                    let loc = boat.toLocal(this.position);

                    // Then do an AABB and only take damage if the person who shot this projectile is from another boat (can't shoot our own boat).
                    if(this.shooter.parent != boat
                    && !(Math.abs(loc.x) > Math.abs(boat.size.x / 2)
                    || Math.abs(loc.z) > Math.abs(boat.size.z / 2))
                    && this.position.y < boat.getHeightAboveWater() + 3
                    && boat.captain
                    && (!this.shooter.parent.captain.clan
                    || this.shooter.parent.captain.clan == ``
                    || this.shooter.parent.captain.clan !== boat.captain.clan)) {
                        hasHitBoat = true;

                        // Count the amount of boats the player hit at the same time as well as the amount of shots hit.
                        this.shooter.overallHits++;
                        this.shooter.shotsHit++;

                        // Sum up all allocated points.
                        let countAllocatedPoints = 0;
                        this.shooter.points.forEach(point => countAllocatedPoints += point);

                        // Check if player has too many allocated points --> kick.
                        if(countAllocatedPoints > 52) {
                            log(`Exploit (stats hacking, allocated stats: ${countAllocatedPoints} | IP: ${this.shooter.socket.handshake.address}`);
                            this.shooter.socket.disconnect();
                        }

                        let attackDamageBonus = parseInt(this.shooter.attackDamageBonus + this.shooter.pointsFormula.getDamage());
                        let attackSpeedBonus = parseFloat((this.shooter.attackSpeedBonus + this.shooter.pointsFormula.getFireRate()) / 100);
                        let attackDistanceBonus = ((this.airtime ^ 2) / 2) * (1 + ((this.shooter.attackDistanceBonus + this.shooter.pointsFormula.getDistance()) / 8));

                        let damage = 8 + attackDamageBonus + attackDistanceBonus;
                        if(entities[boat.captainId]) damage += (damage * attackSpeedBonus) - (damage * entities[boat.captainId].armorBonus) / 100;

                        if(this.shooter.parent.crewName != undefined) {
                            this.shooter.socket.emit(`showDamageMessage`, `+ ${parseFloat(damage).toFixed(1)} hit`, 2);
                            this.shooter.addScore(damage);
                        }

                        // Update the player experience based on the damage dealt.
                        this.shooter.updateExperience(damage);
                        boat.hp -= damage;

                        boat.children.forEach(child => child.socket.emit(`showDamageMessage`, `- ${parseFloat(damage).toFixed(1)} hit`, 1));

                        if(boat.hp < 1) {
                            // If player destroyed a boat, increase the score.
                            this.shooter.shipsSank++;

                            // Levels for pirate quests.
                            if(this.shooter.shipsSank == 1) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship tester: +1,000 gold +100 XP`, 3);
                                this.shooter.gold += 1e3;
                                this.shooter.experience += 100;
                            }
                            else if(this.shooter.shipsSank == 5) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship tester: +5,000 gold +500 XP`, 3);
                                this.shooter.gold += 5e3;
                                this.shooter.experience += 500;
                            }
                            else if(this.shooter.shipsSank == 10) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship tester: +1,000 gold +100 XP`, 3);
                                this.shooter.gold += 1e4;
                                this.shooter.experience += 100;
                            }
                            else if(this.shooter.shipsSank == 20) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship tester: +1,000 gold +100 XP`, 3);
                                this.shooter.gold += 1e3;
                                this.shooter.experience += 100;
                            }
                        }
                    }
                });
            }
        }
    }
}
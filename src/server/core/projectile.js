Projectile.prototype = new Entity();
Projectile.prototype.constructor = Projectile;

function Projectile(shooter) {
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
        || (
            shooter.activeWeapon == 0
            && shooter.parent.shipState == -1
            || shooter.parent.shipState == 4
            || shooter.parent.shipState == 3
        )
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
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Teaser: +1,000 gold +100 XP`, 3);
                                this.shooter.gold += 1e3;
                                this.shooter.experience += 100;
                            }
                            else if(this.shooter.shipsSank == 5) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Teaser: +5,000 gold +500 XP`, 3);
                                this.shooter.gold += 5e3;
                                this.shooter.experience += 500;
                            }
                            else if(this.shooter.shipsSank == 10) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Teaser: +10,000 gold +1,000 XP`, 3);
                                this.shooter.gold += 1e4;
                                this.shooter.experience += 1e3;
                            }
                            else if(this.shooter.shipsSank == 20) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Teaser: +20,000 gold +1,000 XP`, 3);
                                this.shooter.gold += 2e4;
                                this.shooter.experience += 1e3;
                            }

                            // Calculate the amount of killed ships (by all crew members).
                            let crewKillCount = 0;
                            core.players.forEach(player => {
                                if(player.parent != undefined && this.shooter.parent.id == player.parent.id) crewKillCount += player.shipsSank;
                            });
                            this.shooter.parent.overallKills = crewKillCount;

                            // Add death to entity of all players on boat which was sunk.
                            boat.children.forEach(player => {
                                player.deaths = (player.deaths == undefined ? 0: player.deaths);
                                player.deaths++;
                            });

                            // Emit and log kill chain.
                            let killText = `${this.shooter.name} sunk ${boat.crewName}`;
                            io.emit(`showKillMessage`, killText);

                            let victimGold = 0;
                            boat.children.forEach(child => victimGold += child.gold);

                            log(`${whoKilledWho} | Kill count boat: ${this.shooter.parent.overallKills} | Shooter gold: ${this.shooter.gold} | Victim gold: ${victimGold}`);

                            // Update player highscore in MongoDB (if in Server 1).
                            if(this.shooter.isLoggedIn == true && this.shooter.serverNumber == 1 && (this.shooter.gold > this.shooter.highScore)) {
                                this.shooter.highscore = this.shooter.gold;
                                User.updateOne({ name: this.shooter.name }, { highscore: this.shooter.highscore }); // May cause errors as mongoose queries are normally async.
                            }
                        }
                    }
                });

                // Check for 'Sea is lava' hack. If detected, kick the shooter.
                if(this.shooter.overallHits >= 10) {
                    log(`Exploit detected: Sea is lava hack --> Kick | Player: ${this.shooter.name} | IP: ${this.shooter.socket.handshake.address} | Server ${this.shooter.serverNumber}`);
                    this.shooter.socket.disconnect();
                }
            }

            // If player's active weapon is fishing rod.
            else if(this.shooter.activeWeapon == 1) {
                // Check against all pickups.
                let pickupCount = 0;
                pickups.forEach(pickup => {
                    if(pickup.type == 0 || pickup.type == 1 || pickup.type == 4 && (pickup.picking != true)) {
                        if(pickupCount > 2) return;
                        let pickLock = pickup.toLocal(this.position);

                        if(!(Math.abs(pickLock.x) > Math.abs(pickup.size.x * 2) || Math.abs(pickLock.z) > Math.abs(pickup.size.z * 2))) {
                            pickup.picking = true;
                            pickup.pickerId = this.shooterid;

                            let bonus = pickup.bonusValues[pickup.pickupSize];

                            let pickupReward = 0;
                            if(pickup.type == 1) {
                                this.shooter.isFishing = false;
                                bonus *= 3;
                            }
                            if(pickup.type == 4) pickupReward = bonus;
                            else pickupReward = Math.floor(Math.random() * bonus) + 20;

                            this.shooter.gold += pickupReward;
                            this.shooter.updateExperience(Math.round(bonus / 10));
                            this.reel = true;
                            pickupCount++;
                        }
                    }
                });
            }
        }

        // If boat was hit or we fall in water, remove.
        if(this.position.y < 0 || hasHitBoat) {
            if(this.impact != undefined) removeEntity(this.impact);
            this.impact = new this.impact(hasHitBoat ? 1: 0, this.position.x, this.position.z);

            // Give the impact a unique id.
            let id;
            while(!id || entities[id] != undefined) id = `i${Math.round(Math.random() * 5000)}`;
            entities[id] = this.impact;
            this.impact.id = id;

            // If boat was hit, shooter does not exist, shooter's weapon is not that of the impact's parent, or impact is outside of the world boundary, remove the impact.
            if(this.reel
            || this.shooterid == ``
            || entities[this.shooterid] == undefined
            || entities[this.shooterid].use == true
            || entities[this.shooterid].activeWeapon == 0
            || this.position.x > worldsize
            || this.position.z > worldsize
            || this.position.x < 0
            || this.position.z < 0) {
                if(this.impact) this.impact.destroy = true;
                removeEntity(this);
            }
            else {
                this.velocity.x = 0;
                this.velocity.z = 0;
                entities[this.shooterid].isFishing = true;

                // If player is sailing, increase probabilty of them catching a fish.
                let fishProb = (entities[this.shooterid].parent 
                    && entities[this.shooterid].parent.netType == 1
                    && entities[this.shooterid].parent.shipState != 3) ? Math.random() - 0.04: Math.random();

                if(fishProb <= 0.01) {
                    let biggerFish = Math.floor(math.random() * 2) + 1;
                    let fish = createPickup(biggerFish, this.position.x, this.position.z, 1, false);

                    fish.picking = true;
                    fish.pickerId = this.shooterid;
                }
            }
        }
    }
    this.airtime += dt;
}

Projectile.prototype.getTypeSnap = () => {
    let snap = {
        // X and Z positions are relative to parent.
        x: this.position.x.toFixed(2),
        y: this.position.y.toFixed(2),
        z: this.position.z.toFixed(2),
        vx: this.velocity.x.toFixed(2),
        vy: this.velocity.y.toFixed(2),
        vz: this.velocity.z.toFixed(2),
        i: this.shooterid,
        r: this.reel,
        sx: this.shooterStartPos.x.toFixed(2),
        xz: this.shooterStartPos.z.toFixed(2)
    }
    return snap;
}

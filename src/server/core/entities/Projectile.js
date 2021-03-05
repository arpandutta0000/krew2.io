const THREE = require(`../../../client/libs/js/three.min.js`);
const { entities } = require(`../core.js`);

const Entity = require(`./Entity.js`);
const Boat = require(`./Boat.js`);

const utils = require(`../utils.js`);

class Projectile extends Entity {
    constructor (shooterId) {
        const shooter = entities.find(entity => entity.id === shooterId);
        super(shooter.position.x, shooter.position.y, shooter.position.z);

        // Network type.
        this.netType = 2;

        // Size of a projectile.
        this.size = new THREE.Vector3(0.3, 0.3, 0.3);

        // Initial shooter data.
        this.shooterID = shooter.id;
        this.shooterStartPos = new THREE.Vector3(shooter.position.x, shooter.position.y, shooter.position.z);

        this.type = -1;
        this.reel = false;
        this.airtime = 0;

        if (!shooter || shooter.activeWeapon === 2 || (shooter.parent.netType === 5 && shooter.activeWeapon === 0) || shooter.parent.shipState === -1 || shooter.parent.shipState === 4 || shooter.parent.shipState === 3) this.destroy();

        this.rotation = shooter.rotation + (shooter.parent ? shooter.parent.rotation : 0);

        const moveVector = new THREE.Vector3(0, 0, -1);
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);

        this.velocity = moveVector;

        const distanceBonus = 1 + parseFloat(shooter.bonus.distance) + shooter.points.filter(point => point.type === 1).length;

        const horzSpeed = Math.cos(shooter.pitch * distanceBonus) * (40 + (Math.min (1e4, parseFloat(shooter.gold)) / 2e3));
        const vertSpeed = Math.sin(shooter.pitch * distanceBonus) * (40 + (Math.min(1e4, parseFloat(shooter.gold)) / 2e3));

        this.velocity.x *= horzSpeed;
        this.velocity.z *= horzSpeed;

        this.velocity.y = vertSpeed;
        this.type = this.activeWeapon;

        if (shooter.activeWeapon === 0) shooter.shotsFired++;
    }

    logic = dt => {
        const shooter = entities.find(entity => entity.id === shooterId);
        if (!shooter || this.type !== shooter.activeWeapon) this.destroy();
    }
}

Projectile.prototype.logic = function (dt) {
    // Remove if the soooter does not exists
    if (
        this.shooterid === `` ||
        entities[this.shooterid] === undefined ||
        (entities[this.shooterid] !== undefined &&
            this.type !== -1 && this.type !== entities[this.shooterid].activeWeapon)
    ) {
        if (this.impact) this.impact.destroy = true;
        removeEntity(this);
        return;
    }

    if (entities[this.shooterid] !== undefined && entities[this.shooterid].use === false) {
        entities[this.shooterid].isFishing = false;
    }

    if (this.position.y >= 0) {
        // gravity is acting on the velocity
        this.velocity.y -= 25.0 * dt;
        this.position.y += this.velocity.y * dt;
    }

    if (entities[this.shooterid] !== undefined) {
        let playerPos = entities[this.shooterid].worldPos();

        // If the player is on a boat, don't destroy the fishing rod if they are moving unless it's far from player
        if (entities[this.shooterid].parent !== undefined &&
            entities[this.shooterid].parent.netType === 5) {
            if (playerPos.z.toFixed(2) !== this.shooterStartPos.z.toFixed(2) &&
                playerPos.x.toFixed(2) !== this.shooterStartPos.x.toFixed(2)) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        } else {
            let fromPlayertoRod = playerPos.distanceTo(this.shooterStartPos);
            // let fromPlayertoRod = distance(playerPos,this.shooterStartPos)
            if (fromPlayertoRod >= 40) {
                this.reel = true;
                entities[this.shooterid].isFishing = false;
            }
        }
    }

    if (this.position.y < 10) { // if the cannon ball is below surface level, remove it
        let hasHitBoat = false;

        // on the server, we will spawn an impact
        if (this.shooter && this.shooter.parent.captain) {
            // if player's active weapon is cannon
            if (this.shooter.activeWeapon === 0) {
                // counter for hits done "per shot"
                this.shooter.overall_hits = 0;
                // check against all boats
                for (b in boats) {
                    let boat = boats[b];

                    // dont check against boats that have died or are docked
                    if (boat == undefined || boat.hp < 1 || boat.shipState === 3 || boat.shipState === -1 || boat.shipState === 4) {
                        continue;
                    }

                    let loc = boat.toLocal(this.position);

                    // then do a AABB && only take damage if the person who shot this projectile is from another boat (cant shoot our own boat)
                    if (
                        this.shooter.parent !== boat &&
                        !(Math.abs(loc.x) > Math.abs(boat.size.x * 0.5) || Math.abs(loc.z) > Math.abs(boat.size.z * 0.5)) &&
                        this.position.y < boat.getHeightAboveWater() + 3 && boat.captain &&
                        // check if captains are in the same clan
                        (!this.shooter.parent.captain.clan || this.shooter.parent.captain.clan === `` || this.shooter.parent.captain.clan !== boat.captain.clan)
                    ) {
                        hasHitBoat = true;
                        // count the amount of boats the player hit at the same time
                        this.shooter.overall_hits += 1;
                        // count the amount of shots hit
                        this.shooter.shotsHit += 1;

                        // sum up all allocated points
                        let countAllocatedPoints = 0;
                        for (let i in this.shooter.points) {
                            countAllocatedPoints += this.shooter.points[i];
                        }

                        // check if player has too many allocated points --> kick
                        if (countAllocatedPoints > 52) {
                            log(`cyan`, `Exploit (stats hacking), allocated stats: ${countAllocatedPoints} | IP ${this.shooter.socket.handshake.address}`);
                            this.shooter.socket.disconnect();
                        }

                        let attackDamageBonus = parseInt(this.shooter.attackDamageBonus + this.shooter.pointsFormula.getDamage());
                        let attackSpeedBonus = parseFloat((this.shooter.attackSpeedBonus + this.shooter.pointsFormula.getFireRate()) / 100);
                        let attackDistanceBonus = (this.airtime * this.airtime / 2) *
                            (1 + ((this.shooter.attackDistanceBonus + this.shooter.pointsFormula.getDistance()) / 8));

                        let damage = 8 + attackDamageBonus + attackDistanceBonus;
                        if (entities[boat.captainId]) damage = damage + (damage * attackSpeedBonus) - (damage * entities[boat.captainId].armorBonus) / 100;

                        if (this.shooter.parent.crewName !== undefined) {
                            this.shooter.socket.emit(`showDamageMessage`, `+ ${parseFloat(damage).toFixed(1)} hit`, 2);
                            this.shooter.addScore(damage);
                        }

                        // Update the player experience based on the damage dealt
                        this.shooter.updateExperience(damage);

                        boat.hp -= damage;

                        for (let s in boat.children) {
                            boat.children[s].socket.emit(`showDamageMessage`, `- ${parseFloat(damage).toFixed(1)} hit`, 1);
                        }

                        if (boat.hp < 1) {
                            // if player destroyed a boat, increase the score
                            this.shooter.shipsSank += 1;
                            // levels for pirate quests
                            if (this.shooter.shipsSank === 1) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship teaser: +1,000 gold +100 XP`, 3);
                                this.shooter.gold += 1000;
                                this.shooter.experience += 100;
                            }
                            if (this.shooter.shipsSank === 5) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship sinker: +5,000 gold +500 XP`, 3);
                                this.shooter.gold += 5000;
                                this.shooter.experience += 500;
                            }
                            if (this.shooter.shipsSank === 10) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship killer: +10,000 gold +1,000 XP`, 3);
                                this.shooter.gold += 10000;
                                this.shooter.experience += 1000;
                            }
                            if (this.shooter.shipsSank === 20) {
                                this.shooter.socket.emit(`showCenterMessage`, `Achievement ship slayer: +20,000 gold +1,000 XP`, 3);
                                this.shooter.gold += 20000;
                                this.shooter.experience += 1000;
                            }

                            // calculate amount of killed ships (by all crew members)
                            let crew_kill_count = 0;
                            for (y in core.players) {
                                let otherPlayer = core.players[y];
                                if (otherPlayer.parent !== undefined && this.shooter.parent.id === otherPlayer.parent.id) {
                                    crew_kill_count += otherPlayer.shipsSank;
                                }
                            }
                            this.shooter.parent.overall_kills = crew_kill_count;

                            // add death to entity of all players on boat which was sunk
                            for (p in boat.children) {
                                boat.children[p].deaths = (boat.children[p].deaths === undefined ? 0 : boat.children[p].deaths);
                                boat.children[p].deaths += 1;
                            }

                            // emit + log kill chain
                            let whoKilledWho = `${this.shooter.name} sunk ${boat.crewName}`;
                            io.emit(`showKillMessage`, whoKilledWho);
                            let victimGold = 0;
                            for (let p in boat.children) {
                                victimGold += boat.children[p].gold;
                            }
                            log(`magenta`, `${whoKilledWho} | Kill count boat: ${this.shooter.parent.overall_kills} | Shooter gold: ${this.shooter.gold} | Victim gold: ${victimGold}`);
                        }
                    }
                }
                // Check for "Sea-is-lava-hack". If detected, kick the shooter
                if (this.shooter.overall_hits >= 10) {
                    console.log(`${get_timestamp()}Exploit detected: Sea-is-lava-hack | Player: ${this.shooter.name} | Adding IP ${this.shooter.socket.handshake.address} to bannedIPs`);
                    // kick the hacker
                    this.shooter.socket.disconnect();
                }
            }

            // if player's active weapon is fishing rod
            else if (this.shooter.activeWeapon === 1) {
                // check against all pickups
                let pickupCount = 0;
                for (let p in pickups) {
                    let pickup = pickups[p];
                    if (pickup.type === 0 || pickup.type === 1 || pickup.type === 4 && (pickup.picking !== true)) {
                        let pickLoc = pickup.toLocal(this.position);

                        if (!(Math.abs(pickLoc.x) > Math.abs(pickup.size.x * 2) || Math.abs(pickLoc.z) > Math.abs(pickup.size.z * 2))) {
                            pickup.picking = true;
                            pickup.pickerId = this.shooterid;
                            let bonus = pickup.bonusValues[pickup.pickupSize];
                            let pickupReward = 0;
                            if (pickup.type === 1) {
                                this.shooter.isFishing = false;
                                bonus = bonus * 3;
                            }
                            if (pickup.type === 4) {
                                pickupReward = bonus;
                            } else {
                                pickupReward = Math.floor(Math.random() * bonus) + 20;
                            }

                            this.shooter.gold += pickupReward;
                            this.shooter.updateExperience(Math.round(bonus / 10));
                            this.reel = true;
                            pickupCount++;
                            if (pickupCount > 2) {
                                break;
                            }
                        }
                    }
                }
            }
        }

        // if boat was hit or we fall in water, remove
        if (this.position.y < 0 || hasHitBoat) {
            if (this.impact !== undefined) removeEntity(this.impact);
            this.impact = new Impact(hasHitBoat ? 1 : 0, this.position.x, this.position.z);

            // give the impact some random id
            let id;
            while (!id || entities[id] !== undefined) {
                id = `i${Math.round(Math.random() * 5000)}`;
            }
            entities[id] = this.impact;
            this.impact.id = id;

            // if boat was hit or
            if (
                this.reel ||
                this.shooterid === `` ||
                entities[this.shooterid] === undefined ||
                entities[this.shooterid].use === true ||
                entities[this.shooterid].activeWeapon === 0 ||
                this.position.x > worldsize ||
                this.position.z > worldsize ||
                this.position.x < 0 ||
                this.position.z < 0
            ) {
                if (this.impact) this.impact.destroy = true;
                removeEntity(this);
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
                entities[this.shooterid].isFishing = true;
                // if player is sailing, increase probability of them catching a fish
                let fishProb = (entities[this.shooterid].parent && entities[this.shooterid].parent.netType === 1 &&
                    entities[this.shooterid].parent.shipState !== 3)
                    ? Math.random() - 0.04
                    : Math.random();
                if (fishProb <= 0.01) {
                    let biggerFish = Math.floor(Math.random() * 2) + 1;
                    let fish = createPickup(biggerFish, this.position.x, this.position.z, 1, false);
                    fish.picking = true;
                    fish.pickerId = this.shooterid;
                }
            }
        }
    }
    this.airtime += dt;
};

Projectile.prototype.getTypeSnap = function () {
    let snap = {
        x: this.position.x.toFixed(2), // x and z position relative to parent
        z: this.position.z.toFixed(2),
        y: this.position.y.toFixed(2),
        vx: this.velocity.x.toFixed(2),
        vy: this.velocity.y.toFixed(2),
        vz: this.velocity.z.toFixed(2),
        i: this.shooterid,
        r: this.reel,
        sx: this.shooterStartPos.x.toFixed(2),
        sz: this.shooterStartPos.z.toFixed(2)
    };

    return snap;
};

module.exports = Projectile;

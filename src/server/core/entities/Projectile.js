const THREE = require(`../../../client/libs/js/three.min.js`);
const { entities } = require(`../core.js`);

const Entity = require(`./Entity.js`);
const Boat = require(`./Boat.js`);

const utils = require(`../utils.js`);
const { io } = require(`../../socketForClients.js`);

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

        const horzSpeed = Math.cos(shooter.pitch * distanceBonus) * (40 + (Math.min(1e4, parseFloat(shooter.gold)) / 2e3));
        const vertSpeed = Math.sin(shooter.pitch * distanceBonus) * (40 + (Math.min(1e4, parseFloat(shooter.gold)) / 2e3));

        this.velocity.x *= horzSpeed;
        this.velocity.z *= horzSpeed;

        this.velocity.y = vertSpeed;
        this.type = this.activeWeapon;

        if (shooter.activeWeapon === 0) shooter.shotsFired++;
    }

    logic = dt => {
        const shooter = entities.find(entity => entity.id === shooterId);
        if (!shooter || this.type !== shooter.activeWeapon) return this.destroy();

        if (!shooter.use) shooter.isFishing = false;

        if (this.position.y >= 0) {
            this.velocity.y -= 25 * dt; // Gravity is not constant! Acceleration exists!!!
            this.position.y += this.velocity.y * dt;
        }

        const distancePlayerMoved = utils.distance(shooter.position.x, this.shooterStartPos.x, shooter.position.z, this.shooterStartPos.z);
        const distanceToPlayer = utils.distance(shooter.position.x, this.position.x, shooter.position.z, this.position.z);

        if (shooter.parent && shooter.parent.netType === 5 && distancePlayerMoved > 0) {
            this.reel = true;
            shooter.isFishing = false;
        } else if (distanceToPlayer > (40 + 2 * shooter.bonus.distance)) {
            this.reel = true;
            shooter.isFishing = false;
        }

        if (this.position.y < 10) {
            // If the cannon ball is below surface level, spawn an impact and destroy the projectile.
            if (shooter.activeWeapon === 0) {
                shooter.shotsFired++;

                const boats = entities.filter(entity => entity.netType === 3 && entity.hp > 1 && entity.shipState !== 3 && entity.shipState !== -1 && entity.shipState !== 4);
                for (const boat of boats) {
                    let hasHitBoat = false;
                    const locPos = boat.localPos(this.position);

                    const shooterBoat = entities.find(entity => entity.id === shooter.parent);

                    const shooterCaptain = entities.find(entity => entity.id === shooterBoat.captain);
                    const receiverCaptain = entities.find(entity => entity.id === boat.captain);

                    if (shooterBoat !== boat && !(Math.abs(locPos.x) > Math.abs(boat.size.x * 0.5) || Math.abs(locPos.z) > Math.abs(boat.size.z) * 0.5) && this.position.y < boat.getHeight() + 3 && receiverCaptain.clan !== shooterCaptain.clan) {
                        hasHitBoat = true;

                        shooter.shotsHit++;

                        if (shooter.points.length > 50) {
                            log(`cyan`, `Exploit detected: (stats hacking) | IP ${this.shooter.socket.handshake.address}`);
                            shooter.socket.disconnect();

                            const attackDamageBonus = shooter.bonus.damage + shooter.getPoints(2);
                            const attackDistanceBonus = ((this.airtime ^ 2) / 2) * (((shooter.bonus.distance + shooter.getPoints(1)) / 8) + 1);

                            const projectileDamage = attackDamageBonus + attackDistanceBonus + 8;

                            if (entities.find(entity => entity.id === shooter.parent).name) shooter.socket.emit(`showDamageMessage`, `+ ${parseFloat(damage).toFixed(1)}`, 2);

                            // Update the player experience based on the damage dealt.
                            shooter.updateExperience(damage);

                            boat.hp -= damage;

                            for (const childID of boat.children) entities.find(entity => entity.id === childID).socket.emit(`showDamageMessage`, `- ${parseFloat(damage).toFixed(1)}`, 1);

                            if (boat.hp < 1) {
                                shooter.shipSank++;

                                switch (shooter.shipsSank) {
                                    case 1:
                                        shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Teaser: +1,000 Gold +100 XP`, 3);
                                        shooter.gold += 1e3;
                                        shooter.experience += 100;
                                        break;
                                    case 2:
                                        shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Sinker: +5,000 Gold +500 XP`, 3);
                                        shooter.gold += 5e3;
                                        shooter.experience += 500;
                                        break;
                                    case 10:
                                        shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Killer: +10,000 Gold +1,000 XP`, 3);
                                        shooter.gold += 2e4;
                                        shooter.experience += 1e3;
                                        break;
                                    case 20:
                                        shooter.socket.emit(`showCenterMessage`, `Achievement: Ship Slayer: +20,000 Gold + 2,000 XP`, 3);
                                        shooter.gold += 2e4;
                                        shooter.experience += 1e3;
                                        break;
                                }

                                // Tell the crew members on the sunken boat that the show is over.
                                for (const childID of boat.children) entities.find(entity => entity.id === childID).deaths++;

                                // Notify the kill chain.
                                const killChainMsg = `${shooter.name} sunk ${boat.name}`;
                                io.emit(`showKillMessage`, killChainMsg);
                            }
                        }
                    }
                }
            }
        }
    }
}
/*
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
*/
module.exports = Projectile;

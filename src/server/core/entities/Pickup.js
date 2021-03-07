const THREE = require(`../../../client/libs/js/three.min.js`);
const Entity = require(`./Entity.js`);

const { entities } = require(`../core.js`);
const utils = require(`../utils.js`);

class Pickup extends Entity {
    constructor (type, x, z, size, specialBonus) {
        super(x, 0, z);

        // Network type.
        this.netType = 4;

        // Pickup size and type.
        this.pickupType = type;
        this.pickupSize = size;

        // Bonus values.
        this.bonusValues = [50, 75, 100, 1e5];
        this.bonus = this.bonusValues[size] || 25;

        // Pickup scaling.
        let scale = 1;
        if (type === 0) scale = parseInt(size) + 1;
        else if (type === 1) scale = size * 0.05;
        else if (type === 2 || type === 3) scale = 0.02;
        else if (type === 4) scale = 2;

        // Scaled pickup size.
        this.size = new THREE.Vector3(scale, scale, scale);

        this.timeout = 1;
        this.catchingFish = false;

        this.picking = type === 1;

        this.specialBonus = specialBonus || 0;
    }

    getTypeSnap = () => {
        const snap = {
            s: this.pickupSize,
            p: this.picking,
            i: this.pickerId,
            t: this.pickupType
        };

        return snap;
    }

    logic = dt => {
        if (this.picking) {
            this.timeout -= 0.5 * dt;

            if (this.timeout <= 0 || this.timeout === 1) this.destroy();
            if (this.pickerId !== `` && !entities.find(entity => entity.id === this.pickerId)) this.destroy();
        } else {
            if (this.pickupType === 0 || this.pickupType === 4) {
                const boats = entities.filter(entity => entity.netType === 1 && entity.hp > 0);
                for (const boat of boats) {
                    const locPos = boat.localPos(this.position);
                    if (Math.abs(locPos.x) > Math.abs(boat.size.x * 0.6 + 3) || Math.abs(locPos.z) > Math.abs(boat.size.z * 0.6 + 3)) continue;

                    const bonus = this.bonusValues[this.pickupSize] + this.specialBonus;
                    let captainsCut = bonus;

                    let totalScore = 0;
                    for (const childID of boat.children) {
                        const child = entities.find(entity => entity.id === childID);
                        totalScore += child.gold;
                    }

                    for (const childID of boat.children) {
                        const child = entities.find(entity => entity.id === childID);
                        if (child.id !== boat.captain) {
                            const playersCut = (child.gold / totalScore) * (1 - this.captainsCutRatio) * bonus;

                            child.gold += playersCut;
                            captainsCut -= playersCut;
                        }
                    }

                    const captain = entities.find(entity => entity.id === boat.captain);
                    if (captain) captain.gold += captainsCut;

                    boat.hp = Math.min(boatTypes[boat.type].hp, boat.hp + (bonus * 0.2));
                    this.destroy();
                }
            } else if (this.pickupType === 2 || this.pickupType === 3) {
                const players = entities.filter(entity => entity.netType === 0);
                for (const player of players) {
                    const distanceFromPlayer = utils.distance(this.position.x, player.position.x, this.position.z, player.position.z);

                    if (distanceFromPlayer < 2) {
                        if (distanceFromPlayer < 1.6) this.destroy();

                        this.picking = true;
                        this.pickerId = player.id;

                        player.gold += (this.bonusValues[this.pickupSize] / 3 * 2) + this.specialBonus;
                        player.updateExperience(Math.round(this.bonusValues[this.pickupSize] / 20));
                    }
                }
            }
        }
    }
}

module.exports = Pickup;

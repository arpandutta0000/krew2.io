class Boat extends Entity {
    constructor(captainId, krewName) {
        super();

        this.netType = 1;

        let captainsName = entities[captainId] !== undefined ? entities[captainId].name : ``;
        this.krewName = typeof krewName === `string` ? krewName : `${captainsName}'${captainsName.charAt(captainsName.length - 1) === `s` ? `` : `s`} krew`;

        if (captainId && entities[captainId]) {
            this.captainId = captainId;
            this.clan = entities[captainId].clan;
        } else {
            this.captainId = ``;
            this.clan = ``;
        }

        this.krewCount = 0;

        this.shipState = -1;

        this.setShipClass(1);
    }

    setShipClass(classId) {
        this.shipclassId = classId;

        this.maxHp = boatTypes[classId].hp;
        this.hp = this.maxHp;
        this.image = boatTypes[classId].image;
        this.boatName = boatTypes[classId].name;
        this.maxKrewCapacity = boatTypes[classId].maxKrewCapacity;
    }

    parseTypeSnap(snap) {
        if (snap.h !== undefined && snap.h !== this.hp) this.hp = parseInt(snap.h);
        if (snap.c !== undefined && snap.c !== this.shipclassId) this.setShipClass(snap.c);
        if (snap.k !== undefined && snap.k !== this.krewCount) this.krewCount = snap.k;
        if (snap.b !== undefined && snap.b !== this.captainId) this.captainId = snap.b;
        if (snap.t !== undefined && snap.t !== this.shipState) this.shipState = parseInt(snap.t);
    }
};
class Player extends Entity {
    constructor(data) {
        super();

        this.netType = 0;

        this.name = data !== undefined ? (data.name || ``) : ``;

        this.isLoggedIn = data.t.l;

        this.activeWeapon = 0;

        this.level = 0;

        this.clan = data.t.cl === `` ? undefined : data.t.cl;
    }

    parseTypeSnap(snap) {
        if (snap.e !== undefined && snap.e.l !== undefined && snap.e.l !== this.level) this.level = parseInt(snap.e.l);
        if (snap.w !== undefined && snap.w !== this.activeWeapon) this.activeWeapon = parseInt(snap.w);
    }
};
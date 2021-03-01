class Player extends Entity {
    constructor(data) {
        super();

        this.netType = 0;

        this.name = data !== undefined ? (data.name || ``) : ``;

        this.isLoggedIn = data.t.l;

        this.activeWeapon = 0;

        this.level = 0;
        this.points = {
            fireRate: 0,
            distance: 0,
            damage: 0
        };

        this.clan = data.t.cl === `` ? undefined : data.t.cl;
    }

    parseTypeSnap(snap) {
        if (snap.e !== undefined) {
            if (snap.e.l !== undefined && snap.e.l !== this.level) this.level = parseInt(snap.e.l);
            if (snap.e.p.fr !== undefined && snap.e.p.fr !== this.points.fireRate) this.points.fireRate = parseInt(snap.e.p.fr);
            if (snap.e.p.ds !== undefined && snap.e.p.ds !== this.points.distance) this.points.distance = parseInt(snap.e.p.ds);
            if (snap.e.p.dm !== undefined && snap.e.p.dm !== this.points.damage) this.points.damage = parseInt(snap.e.p.dm);
        }

        if (snap.w !== undefined && snap.w !== this.activeWeapon) this.activeWeapon = parseInt(snap.w);
    }
}
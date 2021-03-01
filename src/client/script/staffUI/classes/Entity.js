class Entity {
    constructor() {
        this.netType = -1;
        this.gold = 0;

        this.children = {};
        this.parent = undefined;

        this.position = {
            x: 0,
            y: 0,
            z: 0
        };
    }

    addChildren(entity) {
        this.children[entity.id] = entity;
        entity.parent = this;
    }

    parseSnap(snap, id) {
        if (snap.del !== undefined) delete entities[this.id];
        if (snap.p !== undefined && entities[snap.p] !== undefined && this.parent !== entities[snap.p]) entities[snap.p].addChildren(this);
        if (snap.t !== undefined) this.parseTypeSnap(snap.t);

        if (this.netType !== 0) {
            if (snap.x !== undefined) this.position.x = parseFloat(snap.x);
            if (snap.y !== undefined) this.position.y = parseFloat(snap.y);
            if (snap.z !== undefined) this.position.z = parseFloat(snap.z);
        }
    }
};
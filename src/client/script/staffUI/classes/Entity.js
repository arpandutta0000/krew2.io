class Entity {
    constructor() {
        this.netType = -1;
        this.gold = 0;

        this.children = {};
        this.parent = undefined;
    }

    addChildren(entity) {
        this.children[entity.id] = entity;
        entity.parent = this;
    }

    parseSnap(snap, id) {
        if (snap.del !== undefined) delete entities[this.id];
        if (snap.p !== undefined && entities[snap.p] !== undefined && this.parent !== entities[snap.p]) entities[snap.p].addChildren(this);
        if (snap.t !== undefined) this.parseTypeSnap(snap.t);
    }
}
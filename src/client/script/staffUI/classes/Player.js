/**
 * Player class
 *
 * @class
 * @extends Entity
 */
class Player extends Entity {
    /**
     * Player constructor
     *
     * @param {object} data Player data
     */
    constructor (data) {
        super();

        this.netType = 0;

        this.name = data !== undefined ? (data.name || ``) : ``;

        this.isLoggedIn = data.t.l;

        this.activeWeapon = 0;

        this.level = 0;

        this.clan = data.t.cl === `` ? undefined : data.t.cl;
    }

    /**
     * Method to parse a player type snap
     *
     * @param {object} snap Snap to be parsed
     */
    parseTypeSnap (snap) {
        if (snap.e !== undefined && snap.e.l !== undefined && snap.e.l !== this.level) this.level = parseInt(snap.e.l);
        if (snap.w !== undefined && snap.w !== this.activeWeapon) this.activeWeapon = parseInt(snap.w);
    }
}

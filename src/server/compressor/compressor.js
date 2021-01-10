let events = {};

// returns a full snapshot of the world
// force = force the entities to return snapshot, even if they are usually disabled (stuff like pickups)
exports.getSnapshot = function (force) {
    let snap = {};
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            snap[e] = entities[e].getSnap(force);
        }
    }

    return snap;
};

// returns a delta snapshot
exports.getDelta = function () {
    let delta = {};
    for (e in entities) {
        if (entities.hasOwnProperty(e)) {
            let d = entities[e].getDelta();
            if (d) {
                delta[e] = d;
            }
        }
    }

    if (!isEmpty(events)) {
        Object.assign(delta, events);
        events = {};
        exports.events = events;
    }

    if (isEmpty(delta)) {
        delta = undefined;
    }

    return delta;
};

let isEmpty = function (obj) {
    // check if object is completely empty
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
        return true;
    }

    // check if object is full of undefined
    for (p in obj) {
        if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
            return false;
        }
    }

    return true;
};

exports.events = events;

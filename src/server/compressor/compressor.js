let events = {}
module.exports.getDelta = () => {
    let delta = {}
    entities.forEach((entity, i) => {
        let d = entity.getDelta();
        if(d) delta[i] = d;
    });

    if(!isEmpty(events)) {
        Object.assign(delta, events);
        events = {}
        module.exports.events = events;
    }

    if(isEmpty(delta)) delta = undefined;
    return delta;
}

let isEmpty = obj => {
    // Check if object is completely empty.
    if(Object.keys(obj).length == 0 && obj.constructor == Object) return true;

    // Check of object is full of undefined.
    for(let i in obj) {
        if(obj.hasOwnProperty(i) && obj[i] != undefined) return false;
    }
    return true;
}

module.exports.events = events;
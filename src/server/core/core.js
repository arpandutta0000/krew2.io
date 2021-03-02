const entities = [];

let iterateEntities = function (dt) {
    // Tick each entity.
    for (const entity of entities) entity.tick(dt);
};

module.exports = {
    entities,
    iterateEntities
};

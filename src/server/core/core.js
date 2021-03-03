const entities = [];

const iterateEntities = dt => {
    // Tick each entity.
    for (const entity of entities) entity.tick(dt);
};

module.exports = {
    entities,
    iterateEntities
};

/* Import Entity class for JSDoc typing */
const Entity = require(`./entities/Entity`);

/**
 * Entities array. Includes all entity objects
 * 
 * @type {Entity[]}
 */
const entities = [];

/**
 * Iterate through every entity and run logic
 * 
 * @param {number} dt DT
 * @returns {void}
 */
const iterateEntities = (dt) => {
    // Tick each entity.
    for (const entity of entities) entity.tick(dt);
};

module.exports = {
    entities,
    iterateEntities
};
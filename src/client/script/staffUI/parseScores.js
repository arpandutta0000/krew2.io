/**
 * Method to parse scores data
 *
 * @param {object} data Data object of an entity
 */
let parseScores = (data) => {
    if (entities[data.id] !== undefined) {
        if (entities[data.id].gold !== undefined) entities[data.id].gold = parseInt(data.g);
        if (entities[data.id].netType === 1) entities[data.id].krewName = data.cN;
    }
};

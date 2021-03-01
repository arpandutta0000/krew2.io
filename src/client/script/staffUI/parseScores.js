let parseScores = (data) => {
    if (entities[data.id] !== undefined && entities[data.id].gold !== undefined) entities[data.id].gold = parseInt(data.g);
};
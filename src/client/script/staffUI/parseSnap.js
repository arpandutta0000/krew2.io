let parseSnap = (snap) => {
    // Check if entity doesn't exist
    if (entities[id] === undefined) {
        // Switch for entity type
        switch (data.n) {
            default: {
                break;
            }

            // Player
            case 0: {
                entities[id] = new Player(data);
                break;
            }

            // Boat
            case 1: {
                entities[id] = new Boat(data.t.b);
                break;
            }
        }

        // If the entity is defined
        if (entities[id] !== undefined) entities[id].id = id;
    }

    // Once the entity is defined, parse the snap data
    if (entities[id] !== undefined) {
        entities[id].parseSnap(data, id);
    }
}
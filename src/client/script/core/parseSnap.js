/**
 * Parse a snap
 *
 * @param {any} id ID of the snap/entity
 * @param {object} data Entity data
 */
let parseSnap = (id, data) => {
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
                entities[id].playerModel = data.playerModel ? data.playerModel : 0;
                entities[id].hatModel = data.hatModel ? data.hatModel : 0;

                // If the snap is the user's player
                if (id === myPlayerId) {
                    myPlayer = entities[id];
                    myPlayer.isPlayer = true;
                }

                break;
            }

            // Boat
            case 1: {
                entities[id] = new Boat(data.t.b);
                break;
            }

            // Projectile
            case 2: {
                entities[id] = new Projectile();
                break;
            }

            // Impact
            case 3: {
                entities[id] = new Impact(parseInt(data.t.a), parseFloat(data.x), parseFloat(data.z));
                break;
            }

            // Pickup
            case 4: {
                entities[id] = new Pickup(parseInt(data.t.s), parseFloat(data.x), parseFloat(data.z), parseInt(data.t.t));
                break;
            }

            // Landmark
            case 5: {
                entities[id] = new Landmark(parseInt(data.t.t), parseFloat(data.x), parseFloat(data.z), data.t);
                break;
            }

            // Bot (Depreciated)
            case 6: {
                // entities[id] = new Bot();
                break;
            }
        }

        // If the entity is defined
        if (entities[id] !== undefined) {
            entities[id].id = id;
            entities[id].createBody();
        }
    }

    // Once the entity is defined, parse the snap data
    if (entities[id] !== undefined) {
        entities[id].parseSnap(data, id);
    }
};

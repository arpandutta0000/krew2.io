let parseSnap = (id, data) => {
    // This is the function that reads the snapshot data for a single entity.

    // First, check if we have already created the entity.
    if(entities[id] == undefined) {
        // Switch on the netcode id. Depending on the id, we create an entity of that type.
        switch(data.n) {
            default: console.warn(`Parse error: Unknown entity type!`); break;
            case 0: {
                // Player entity.
                entities[id] = new playerName(data);

                // If this entity has the id that the player was assigned, then we known its the player ID.
                if(id == myPlayerId) {
                    myPlayer = entities[id];
                    myPlayer.isPlayer = true;
                }
                break;
            }
            case 1: {
                // Boat entity.
                entities[id] = new Boat(data.t.b);
                break;
            }
            case 2: {
                // Projectile entity.
                entities[id] = new Projectile();
                break;
            }
            case 3: {
                // Impact entity.
                entities[id] = new Impact(parseInt(data.t.a), parseFloat(data.x), parseFloat(data.z));
                break;
            }
            case 4: {
                // Pickup entity.
                entities[id] = new Pickup(parseInt(data.t.s), parseFloat(data.x), parseFloat(data.z), parseInt(data.t.t));
                break;
            }
            case 5: {
                // Landmark entity.
                entities[id] = new Landmarks(parseInt(data.t.t), parseFloat(data.x), parseFloat(data.z), data.t);
                break;
            }
            case 6: {
                // Bot entity.
                entities[id] = new bots();
                break;
            }
        }

        // Now that we have made sure that we have the entity, we give it the data.
        if(entities[id] != undefined) entities[id].parseSnap(data, id);
    }
}

let parseSnap = (id, data) => {
    // this is the function that reads in the snapshot data for a single entity
    // first, check if we have already created the entity
    if (entities[id] === undefined) {
        // switch on the data.n (netcode id). depending on id, we create a entity of that tpye
        switch (data.n) {
            default: {
                // console.log("Error: unknown entitiy type!")
                break;
            }

            case 0: { // its a player
                // console.log('parseSnap new player', data);
                entities[id] = new Player(data);
                entities[id].playerModel = data.playerModel ? data.playerModel : 0;

                // if this entity has the id that the player was assigned, then we know its the player id
                if (id === myPlayerId) {
                    myPlayer = entities[id];
                    myPlayer.isPlayer = true;
                }

                break;
            }

            case 1: { // its a boat
                entities[id] = new Boat(data.t.b);
                break;
            }

            case 2: { // its a projectile
                entities[id] = new Projectile();
                break;
            }

            case 3: { // its an impact
                entities[id] = new Impact(parseInt(data.t.a), parseFloat(data.x), parseFloat(data.z));
                break;
            }

            case 4: { // its a
                entities[id] = new Pickup(parseInt(data.t.s), parseFloat(data.x), parseFloat(data.z), parseInt(data.t.t));
                break;
            }

            case 5: { // its a
                entities[id] = new Landmark(parseInt(data.t.t), parseFloat(data.x), parseFloat(data.z), data.t);
                break;
            }

            case 6: {
                entities[id] = new Bot();
                break;
            }
        }

        if (entities[id] !== undefined) {
            entities[id].id = e;
            entities[id].clientInit();
        }
    }

    // now that we have made sure that we have the entity, we give it the data
    if (entities[id] !== undefined) {
        entities[id].parseSnap(data, id);
    }
};
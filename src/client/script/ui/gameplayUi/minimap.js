/**
 * Create minimap and update player position every frame
 */
let createMinimap = () => {
    let map = CanvasMap(document.getElementById(`minimap`), config.worldsize, config.worldsize);

    map.useRadians = true;
    map.zoom = 0.9;

    // Create compass shown in the middle of the map
    let compass = {
        x: map.text({
            x: middle,
            y: middle,
            text: `+`,
            fill: `rgba(84,48,13,0.7)`,
            size: 150,
            baseline: `middle`
        }),
        n: map.text({
            x: middle,
            y: middle - 350,
            text: `N`,
            fill: `rgba(84,48,13,0.7)`,
            size: 160,
            baseline: `middle`
        }),
        s: map.text({
            x: middle,
            y: middle + 350,
            text: `S`,
            fill: `rgba(84,48,13,0.7)`,
            size: 190,
            baseline: `middle`
        }),
        w: map.text({
            x: middle - 350,
            y: middle,
            text: `W`,
            fill: `rgba(84,48,13,0.7)`,
            size: 190,
            baseline: `middle`
        }),
        e: map.text({
            x: middle + 350,
            y: middle,
            text: `E`,
            fill: `rgba(84,48,13,0.7)`,
            size: 190,
            baseline: `middle`
        }),
        boundary: map.rect({
            x: 0,
            y: 0,
            width: config.worldsize,
            height: config.worldsize,
            stroke: {
                color: `rgba(84,48,13,1)`,
                width: 8
            }
        })
    };

    // Add compas elements to map
    map
        .add(compass.x)
        .add(compass.n)
        .add(compass.s)
        .add(compass.w)
        .add(compass.e)
        .add(compass.boundary);

    // Create loop to update player position
    let loop = () => {
        // If a new frame
        if (performance.now() - time > 1000 / 24) {
            // Checks if there are no entities defined
            if (entities === undefined) {
                map.elements = {};
            } else {
                // Remove entities to be redrawn from the map elements object (Chest, Player, and Islands)
                for (let id in map.elements) {
                    if ((map.elements[id].netType === 5 || map.elements[id].netType === 0 || map.elements[id].netType === 4) && entities[id] === undefined) {
                        map.remove(map.elements[id]);
                    }
                }

                // Redraw entities
                for (let id in entities) {
                    // If the entity is an island
                    if (entities[id].netType === 5) {
                        if (map.elements[id] === undefined) {
                            map
                                .add(map.point({
                                    x: entities[id].position.x,
                                    y: entities[id].position.z,
                                    r: entities[id].dockRadius,
                                    fill: `green`,
                                    id: id,
                                    netType: 5
                                }))
                                .add(map.text({
                                    x: entities[id].position.x,
                                    y: entities[id].position.z - 120,
                                    text: entities[id].name,
                                    fill: `rgba(84,48,13,1)`,
                                    font: `serif`,
                                    id: `${id}-label`,
                                    size: 180
                                }));
                        }
                    }

                    // If the entity is a chest
                    if (entities[id].netType === 4 && entities[id].type === 4) {
                        if (map.elements[id] === undefined) {
                            map
                                .add(map.text({
                                    x: entities[id].position.x,
                                    y: entities[id].position.z,
                                    text: `x`,
                                    fill: `rgba(204, 10, 10, 1)`,
                                    font: `sans-serif`,
                                    id: id,
                                    size: 140,
                                    netType: 4
                                }));
                        }
                    }
                }

                for (let id in markers) {
                    if (map.elements[id] === undefined) {
                        map.add(map.point({
                            x: markers[id].x,
                            y: markers[id].y,
                            r: 30,
                            d: 0.5,
                            id: id,
                            creatTime: performance.now(),
                            fill: `rgba(255, 0, 0, 0.5)`
                        }));
                    }
                    if (map.elements[id] !== undefined) {
                        if (map.elements[id].creatTime < performance.now() - 10000) {
                            map.remove(map.elements[id]);
                            delete markers[id];
                        } else {
                            map.elements[id].r = map.elements[id].r + Math.sin(map.elements[id].d) * 5;
                            map.elements[id].d += 0.2;
                        }
                    }
                }
            }

            // If the entity is the user's player
            if (myPlayer && myPlayer.geometry) {
                let position = myPlayer.geometry.getWorldPosition(new THREE.Vector3());
                let quaternion = new THREE.Quaternion();
                let extraRotation;

                // Get quartertation based off of ship status
                if (myPlayer.parent && myPlayer.parent.netType === 1 && myPlayer.parent.shipState === 0) {
                    myPlayer.parent.geometry.getWorldQuaternion(quaternion);
                    extraRotation = 180;
                } else {
                    myPlayer.geometry.getWorldQuaternion(quaternion);
                    extraRotation = 0;
                }
                // Calculate heading in degrees
                let pVec = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
                let heading = Math.atan2(pVec.z, pVec.x) * 180 / Math.PI;
                heading = heading > 0 ? heading : heading + 360;
                // Return heading in radians
                let rotation = (heading % 360 + extraRotation) * Math.PI / 180;

                // Dray player triangle
                if (map.elements[myPlayer.id] === undefined) {
                    map.add(map.triangle({
                        x: myPlayer.position.x,
                        y: myPlayer.position.z,
                        size: 80,
                        rotation: rotation,
                        fill: `white`,
                        stroke: {
                            color: `black`,
                            width: 15
                        },
                        id: myPlayer.id,
                        netType: 0
                    }));
                }

                // Update player position
                if (map.elements[myPlayer.id] !== undefined) {
                    map.elements[myPlayer.id].x = position.x;
                    map.elements[myPlayer.id].y = position.z;
                    map.elements[myPlayer.id].rotation = rotation;
                }
            }

            // Draw all elements in the map object
            map.draw();
            time = performance.now();
        }
    };

    map.update = loop;

    return map;
};

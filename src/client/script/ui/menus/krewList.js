(function (window) {
    let h = hyperapp.h;
    let state = {
        boats: []
    };
    let actions = {
        boats: () => function (state) {
            let boat;
            let boats = [];
            if (typeof entities === `object` && entities !== null) {
                for (let id in entities) {
                    boat = entities[id];

                    if (
                        myPlayer &&
                        boat &&
                        boat.anchorIslandId &&
                        (boat.shipState === 3 || boat.shipState === 2 || boat.shipState === -1 || boat.shipState === 4) &&
                        boat.recruiting === true
                    ) {
                        if (
                            (myPlayer.parent.netType === 1 && boat.anchorIslandId === myPlayer.parent.anchorIslandId) ||
                            boat.anchorIslandId === myPlayer.parent.id
                        ) {
                            boats.push(boat);
                            $(`#docked-krews-count`).html(boats.length);
                        }
                    }
                }
            }

            boats.sort(
                (a, b) => {
                    if (a.departureTime === b.departureTime) {
                        return a.id < b.id ? -1 : a.id === b.id ? 0 : 1;
                    }

                    return a.departureTime - b.departureTime;
                }
            );
            if (boats.length === 0)
                $(`#toggle-krew-list-modal-button`).popover(`hide`);
            // $('#docked-krews-count').html(boats.length);
            return {
                boats: boats
            };
        }
    };
    let view = (state, actions) => h(`div`, {}, [
        h(`table`, {
            class: `table table-sm`
        }, [
            h(`thead`, {
                class: `thead-inverse`
            }, [
                h(`tr`, {}, [
                    h(`th`, {}, `Krew Name`),
                    h(`th`, {}, `Capacity`),
                    h(`th`)
                ])
            ]),
            h(`tbody`, {}, state.boats.map((boat) => {
                if (myPlayer !== undefined && myPlayer.parent !== undefined && boat !== undefined && entities[boat.captainId] !== undefined) {
                    let test = `'#${boat.id}'`;
                    $(document).on(`click`, `#${boat.id}`, () => {
                        let id = boat.id;
                        if (
                            entities[id] === undefined ||
                            entities[id].maxKrewCapacity === entities[id].krewCount ||
                            entities[id].captainId === myPlayerId
                        ) {
                            return;
                        }
                        socket.emit(`joinKrew`, id, (callback) => {
                            if (callback === 0) {
                                $(`#exit-island-button`).hide();
                                $(`#toggle-invite-link-button`).hide();
                                $(`#invite-div`).hide();

                                if ($(`#departure-modal`).is(`:visible`)) {
                                    $(`#departure-modal`).hide();
                                }

                                GameAnalytics(`addDesignEvent`, `Game:Session:JoinedBoat`);

                                $(`#abandon-ship-button`).show();
                            }
                        });
                    });

                    return h(`tr`, {
                        key: boat.id
                    }, [
                        h(`td`, {}, [
                            `${boat.crewName}(${boatTypes[boat.shipclassId].name})`,
                            h(`br`),
                            h(`small`, {}, boat.shipState === 4 ? `Departing in ${Math.round(boat.departureTime)} seconds` : ``)
                        ]),
                        h(`td`, {}, `${boat.krewCount}/${boatTypes[boat.shipclassId].maxKrewCapacity}`),
                        h(`td`, {}, boat.id === myPlayer.parent.id
                            ? `My Krew`
                            : h(`button`, {
                                id: boat.id,
                                class: `btn btn-primary btn-md`,
                                role: `button`,
                                disabled: entities[boat.id] === undefined ||
                                    entities[boat.id].maxKrewCapacity === entities[boat.id].krewCount ||
                                    entities[boat.id].captainId === myPlayerId

                            }, `Join`))
                    ]);
                }
            }))
        ])
    ]);

    window.KREWLISTCOMPONENT = hyperapp.app(state, actions, view, document.getElementById(`krews-list`));
    window.DEPARTINGKREWLISTCOMPONENT = hyperapp.app(state, actions, view, document.getElementById(`departing-krews-list`));
})(window);

/**
 * Update krew list
 */
let updateKrewList = getFixedFrameRateMethod(2, () => {
    KREWLISTCOMPONENT.boats();
    DEPARTINGKREWLISTCOMPONENT.boats();
});

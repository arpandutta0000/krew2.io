/**
 * Enable island menus
 */
let showIslandMenu = () => {
    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
    ui.closeAllPagesExcept(`#shopping-modal`);

    updateStore();
    updateKrewList();
};

/**
 * Update UI when a user docks
 *
 * @param {object} data Docking data
 */
let enterIsland = (data) => {
    if (data.captainId === myPlayerId) {
        if (myPlayer && myPlayer.parent && myPlayer.parent.shipState !== 2) {
            $(`#docking-modal`).show();
        }
    }
    if ($(`#toggle-shop-modal-button`).hasClass(`enabled`)) {
        $(`#docking-modal`).hide();
    }

    if (myPlayer) audio.changeMusic(`island`, false);
};

/**
 * Initiates island UI
 */
let setUpIslandUI = () => {
    socket.emit(`anchor`);

    $(`#docking-modal`).hide();

    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);

    if (!$(`#exit-island-button`).is(`:visible`)) {
        $(`#exit-island-button`).show();
    }

    $(`#recruiting-div`).fadeIn(`slow`);
    controls.unLockMouseLook();
};

/**
 * Update info for island docking/departure timers
 */
let islandTimer = () => {
    // Update the alive timer
    ++secondsAlive;
    $(`#seconds`).html(pad(secondsAlive % 60));
    $(`#minutes`).html(pad(parseInt(secondsAlive % 3600 / 60)));
    $(`#hours`).html(pad(parseInt(secondsAlive / 3600)));

    if (myPlayer && myPlayer.parent) {
        if (myPlayer.parent.shipState === -1 || myPlayer.parent.shipState === 3) {
            $(`#docking-modal-button`).removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
            $(`.port-name`).text(entities[myPlayer.parent.anchorIslandId].name);
            $(`#docking-modal-button`).find(`span`).text(`Countdown...`);
            $(`#cancel-exit-button`).find(`span`).text(`Sail (c)`);
            return;
        }

        if (myPlayer.parent.netType === 5) {
            $(`.port-name`).text(myPlayer.parent.name);
            if ($(`#docking-modal`).is(`:visible`)) {
                $(`#docking-modal`).hide();
                showIslandMenu();
            }
        }

        if ($(`#docking-modal`).hasClass(`initial`)) {
            $(`#docking-modal`).removeClass(`initial`).find(`#you-are-docked-message`).remove();
        }

        if (myPlayer.parent.shipState !== 1) {
            countDown = 8;
        }

        if (myPlayer.parent.shipState === 1) {
            if (countDown === 8) {
                socket.emit(`dock`);
            }
            $(`#cancel-exit-button`).find(`span`).text(`Cancel (c)`);

            if (countDown !== 0 && countDown > 0) {
                $(`#docking-modal-button`).find(`span`).text(`Docking in ${countDown} seconds`);
            } else {
                $(`#docking-modal-button`).find(`span`).text(`Dock (z)`);
                $(`#docking-modal-button`).removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
            }

            countDown--;
        }

        if (myPlayer.parent.shipState === 4) {
            $(`#docking-modal`).hide();
            if (!$(`#departure-modal`).is(`:visible`)) {
                $(`#departure-modal`).show(0);
            }

            $(`#cancel-departure-button`).find(`span`).text(`${(myPlayer && myPlayer.isCaptain ? `Departing in ` : `Krew departing in `) + entities[myPlayer.id].parent.departureTime} seconds`);
        }

        if (((!myPlayer.isCaptain && myPlayer.parent.shipState !== 4) || (myPlayer.isCaptain && myPlayer.parent.shipState === 0)) && $(`#departure-modal`).is(`:visible`)) {
            $(`#departure-modal`).hide();
        }
    }
};
let timer = setInterval(() => {
    islandTimer();
}, 1000);

/**
 * Upate ui when a user departs
 *
 * @param {object} data Departure data
 */
let exitIsland = (data) => {
    controls.lockMouseLook();

    if (data.captainId === myPlayerId) {
        $(`#docking-modal`).hide();
        $(`#departure-modal`).hide();
    }

    ui.hideSuggestionBox = true;
    if (myPlayer) audio.changeMusic(`ocean`, false);

    $(`#exit-island-button`).hide();
    ui.closeAllPages();
    updateStore();

    $(`#docking-modal-button`).removeClass(`btn btn-primary enabled btn-lg`).addClass(`btn btn-primary disabled btn-lg`);
    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
};

/**
 * Updates the store
 */
let updateStore = () => {
    $(`#shopping-item-list`).html(``);

    if ($(`#buy-items`).hasClass(`active`)) {
        if ($(`#abandon-existing-krew`).is(`:visible`)) $(`#abandon-existing-krew`).hide();
        getItems((div) => $(`#shopping-item-list`).html(div));
        return;
    }

    if ($(`#buy-ships`).hasClass(`active`)) {
        if (myPlayer !== undefined && myPlayer.parent !== undefined &&
            myPlayer.parent.captainId !== myPlayer.id && myPlayer.parent.netType === 1) {
            $(`#abandon-existing-krew`).show();
        }
        getShips((div) => $(`#shopping-item-list`).html(div));
        return;
    }

    if ($(`#buy-goods`).hasClass(`active`)) {
        if ($(`#abandon-existing-krew`).is(`:visible`)) $(`#abandon-existing-krew`).hide();
        GoodsComponent.getList();
    }
};

/**
 * Updates buttons based on docked status
 *
 * @param {any} id The entity's ID
 */
let setActiveBtn = (id) => {
    if (myPlayer.clan !== `` && myPlayer.clan !== undefined) {
        $(`#li-clan-chat`).show();
    }
    if (config.Admins.includes(myPlayer.name) || config.Mods.includes(myPlayer.name) || config.Helpers.includes(myPlayer.name) || config.Designers.includes(myPlayer.name)) $(`#li-staff-chat`).show();
    if (entities[id].netType === 5) {
        $(`#toggle-krew-list-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
        $(`#toggle-shop-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`);
    } else if (entities[id].netType === 1) {
        if (entities[id].shipState === 3) {
            $(`#toggle-krew-list-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
            $(`#toggle-shop-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`);
        }
    }
};

/**
 * Island departure
 */
let departure = () => {
    if (myPlayer && entities[myPlayer.id] && entities[myPlayer.id].parent) {
        audio.playAudioFile(false, false, 1, `sail`);
        $(`#docking-modal`).hide();
        socket.emit(`departure`, 0);
    }
};

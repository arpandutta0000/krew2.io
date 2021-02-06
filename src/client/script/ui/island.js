// Create variables
let $dockingModalButton = $(`#docking-modal-button`);
let $dockingModalButtonSpan = $dockingModalButton.find(`span`);
let $portName = $(`.port-name`);
let $cancelExitButton = $(`#cancel-exit-button`);
let $cancelExitButtonSpan = $cancelExitButton.find(`span`);
let $dockingModal = $(`#docking-modal`);

/* Enable island menus */
let showIslandMenu = () => {
    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
    if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
        $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
    }
    $(`#exit-island-button`).hide();
    updateStore($(`.btn-shopping-modal.active`));
    updateKrewList();
};

/* Update ui when a user docks */
let enterIsland = (data) => {
    if (data.captainId === myPlayerId) {
        if (myPlayer && myPlayer.parent && myPlayer.parent.shipState !== 2) {
            $(`#docking-modal`).show();
        }
    }
    if ($(`#toggle-shop-modal-button`).hasClass(`enabled`)) {
        $(`#docking-modal`).hide();
    }

    if (myPlayer) {
        stopAudioFile(`ocean-music`);
        playAudioFile(true, `island-music`);
    }
};

/* Update info for island docking/departure timers */
let islandTimer = () => {
    // Update the alive timer
    ++secondsAlive;
    $(`#seconds`).html(pad(secondsAlive % 60));
    $(`#minutes`).html(pad(parseInt(secondsAlive % 3600 / 60)));
    $(`#hours`).html(pad(parseInt(secondsAlive / 3600)));

    if (myPlayer && myPlayer.parent) {
        if (myPlayer.parent.shipState === -1 || myPlayer.parent.shipState === 3) {
            $dockingModalButton.removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
            $portName.text(entities[myPlayer.parent.anchorIslandId].name);
            $dockingModalButtonSpan.text(`Countdown...`);
            $cancelExitButtonSpan.text(`Sail (c)`);
            return;
        }

        if (myPlayer.parent.netType === 5) {
            $portName.text(myPlayer.parent.name);
            if ($dockingModal.is(`:visible`)) {
                $dockingModal.hide();
                showIslandMenu();
            }
        }

        if ($dockingModal.hasClass(`initial`)) {
            $dockingModal.removeClass(`initial`).find(`#you-are-docked-message`).remove();
        }

        if (myPlayer.parent.shipState !== 1) {
            countDown = 8;
        }

        if (myPlayer.parent.shipState === 1) {
            if (countDown === 8) {
                socket.emit(`dock`);
            }
            $cancelExitButtonSpan.text(`Cancel (c)`);

            if (countDown !== 0 && countDown > 0) {
                $dockingModalButtonSpan.text(`Docking in ${countDown} seconds`);
            } else {
                $dockingModalButtonSpan.text(`Dock (z)`);
                $dockingModalButton.removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
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

/* Upate ui when a user departs */
let exitIsland = (data) => {
    controls.lockMouseLook();

    if (data.captainId === myPlayerId) {
        $(`#docking-modal`).hide();
        $(`#departure-modal`).hide();
    }

    ui.hideSuggestionBox = true;
    if (myPlayer) {
        stopAudioFile(`island-music`);
        playAudioFile(true, `ocean-music`);
    }

    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
    $(`#exit-island-button`).hide();
    $(`#shopping-modal`).hide();
    $(`#krew-list-modal`).hide();
    updateStore($(`.btn-shopping-modal.active`));

    $(`#docking-modal-button`).removeClass(`btn btn-primary enabled btn-lg`).addClass(`btn btn-primary disabled btn-lg`);
    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
};

/**
 * Updates the store
 */
let updateStore = () => {
    let $shoppingItemList = $(`#shopping-item-list`);

    $shoppingItemList.html(``);

    if ($(`#buy-ships`).hasClass(`active`)) {
        if (myPlayer !== undefined && myPlayer.parent !== undefined &&
            myPlayer.parent.captainId !== myPlayer.id && myPlayer.parent.netType === 1) {
            $(`#abandon-existing-krew`).show();
        }

        getShips((div) => {
            $shoppingItemList.html(div);
        });

        return;
    }

    if ($(`#buy-items`).hasClass(`active`)) {
        if ($(`#abandon-existing-krew`).is(`:visible`)) {
            $(`#abandon-existing-krew`).hide();
        }

        getItems((div) => {
            $shoppingItemList.html(div);
        });
        return;
    }

    if ($(`#buy-goods`).hasClass(`active`)) {
        if ($(`#abandon-existing-krew`).is(`:visible`)) {
            $(`#abandon-existing-krew`).hide();
        }

        GoodsComponent.getList();
        return;
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
    if (config.Admins.includes(myPlayer.name) || config.Mods.includes(myPlayer.name) || config.Devs.includes(myPlayer.name)) $(`#li-staff-chat`).show();
    if (entities[id].netType === 5) {
        $(`#toggle-krew-list-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
        $(`#toggle-shop-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`);

        if (entities[id].name === `Labrador`) {
            $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
        } else {
            $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md disabled toggle-bank-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
        }
    } else if (entities[id].netType === 1) {
        if (entities[id].shipState === 3) {
            $(`#toggle-krew-list-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
            $(`#toggle-shop-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`);

            if (entities[entities[id].anchorIslandId].name === `Labrador`) {
                $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
            } else {
                $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md disabled toggle-bank-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
            }
        }
    }
};
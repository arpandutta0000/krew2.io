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
    ui.updateStore($(`.btn-shopping-modal.active`));
    ui.updateKrewList();
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
        ui.stopAudioFile(`ocean-music`);
        ui.playAudioFile(true, `island-music`);
    }
};

/* Upate ui when a user departs */
let exitIsland = (data) => {
    controls.lockMouseLook();

    if (data.captainId === myPlayerId) {
        $(`#docking-modal`).hide();
        $(`#departure-modal`).hide();
    }

    krewListUpdateManually = false;
    ui.hideSuggestionBox = true;
    if (myPlayer) {
        ui.stopAudioFile(`island-music`);
        ui.playAudioFile(true, `ocean-music`);
    }

    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
    $(`#exit-island-button`).hide();
    $(`#shopping-modal`).hide();
    $(`#krew-list-modal`).hide();
    ui.updateStore($(`.btn-shopping-modal.active`));

    $(`#docking-modal-button`).removeClass(`btn btn-primary enabled btn-lg`).addClass(`btn btn-primary disabled btn-lg`);
    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
};
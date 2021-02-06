/**
 * Update ship stats
 * 
 * @param {object} data Ship data
 */
let updateShipStats = (data) => {
    if (myPlayer && myPlayer.parent && myPlayer.parent.netType === 1) {
        $(`.ship-hp`).html(myPlayer.parent.hp);
        $(`.ship-max-hp`).html(myPlayer.parent.maxHp);

        $(`#ship-name`).html(boatTypes[myBoat.shipclassId].name);
        $(`.ship-speed`).html(myPlayer.parent.speed.toFixed(1));

        let cargoSize = boatTypes[myBoat.shipclassId].cargoSize;

        $(`#cargo-size`).html(cargoSize);

        $(`.ship-krew-count`).html(data.krewCount);
        $(`.ship-max-capacity`).html(boatTypes[myBoat.shipclassId].maxKrewCapacity);
    } else {
        $(`.ship-hp`).html(``);
        $(`.ship-max-hp`).html(``);
        $(`#ship-name`).html(``);
        $(`#cargo-size`).html(``);
        $(`.ship-krew-count`).html(``);
        $(`.ship-max-capacity`).html(``);
        $(`.ship-speed`).html(`/`);
    }
};

/**
 * Show ship status
 */
let showShipStatus = () => {
    $(`#clan-management`).removeClass(`active`);
    $(`#ship-status`).addClass(`active`);
    $(`#notLoggedIn-container`).hide();
    if (!$(`#ship-status-container`).is(`:visible`)) {
        $(`#ship-status-container`).show();
        $(`#clan-management-container`).hide();
    }
};
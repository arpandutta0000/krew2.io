/**
 * Update ship stats
 *
 * @param {object} data Ship data
 */
let updateShipStats = (data) => {
    if (myPlayer && myPlayer.parent && myPlayer.parent.netType === 1) {
        $(`.ship-hp`).html(myPlayer.parent.hp);
        $(`.ship-max-hp`).html(myPlayer.parent.maxHp);

        $(`#ship-name`).html(boatTypes[myPlayer.parent.shipclassId].name);
        $(`.ship-speed`).html(myPlayer.parent.speed.toFixed(1));

        let cargoSize = boatTypes[myPlayer.parent.shipclassId].cargoSize;

        $(`#cargo-size`).html(cargoSize);

        $(`.ship-krew-count`).html(data.krewCount);
        $(`.ship-max-capacity`).html(boatTypes[myPlayer.parent.shipclassId].maxKrewCapacity);
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

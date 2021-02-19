/**
 * Init economy UI
 */
let ecoUiInit = () => {
    // When shop button is pressed open shop modal
    $(`.toggle-shop-modal-button`).on(`click`, () => {
        if ($(`#toggle-shop-modal-button`).hasClass(`enabled`)) {
            if ($(`#shopping-modal`).is(`:visible`)) {
                $(`#shopping-modal`).hide();
            } else {
                $(`#toggle-shop-modal-button`).popover(`hide`);
                $(`#shopping-modal`).show();
            }
        }
        showIslandMenu();
    });

    // Create listeners for the shop
    $(`#buy-items`).on(`click`, () => {
        $(`.btn-shopping-modal`).removeClass(`active`);
        $(`#buy-items`).addClass(`active`);
        updateStore();
    });
    $(`#buy-ships`).on(`click`, () => {
        $(`.btn-shopping-modal`).removeClass(`active`);
        $(`#buy-ships`).addClass(`active`);
        updateStore();
    });
    $(`#buy-goods`).on(`click`, () => {
        $(`.btn-shopping-modal`).removeClass(`active`);
        $(`#buy-goods`).addClass(`active`);
        updateStore();
    });

    // Create bank keybind listeners
    $(`#make-deposit`).on(`keypress`, (e) => {
        if (e.keyCode === 13) {
            makeDeposit();
        }
    });
    $(`#take-deposit`).on(`keypress`, (e) => {
        if (e.keyCode === 13) {
            takeDeposit();
        }
    });

    $(`#close-bank-button`).on(`click`, () => {
        $(`#bank-modal`).hide();
    });
    $(`#btn-make-deposit`).on(`click`, () => {
        makeDeposit();
    });
    $(`#btn-take-deposit`).on(`click`, () => {
        takeDeposit();
    });
};

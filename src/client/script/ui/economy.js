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
                ui.closeAllPagesExcept(`#shopping-modal`);

                $(`.btn-shopping-modal`).removeClass(`active`);
                $(`#buy-ships`).addClass(`active`);
                $(`#bankContainer`).hide();
                $(`#nabankContainer`).hide();
                updateStore();
            }
        }
        showIslandMenu();
    });

    // Create listeners for the shop
    $(`#buy-items`).on(`click`, () => {
        $(`.btn-shopping-modal`).removeClass(`active`);
        $(`#buy-items`).addClass(`active`);
        $(`#bankContainer`).hide();
        $(`#nabankContainer`).hide();
        updateStore();
    });
    $(`#buy-ships`).on(`click`, () => {
        $(`.btn-shopping-modal`).removeClass(`active`);
        $(`#buy-ships`).addClass(`active`);
        $(`#bankContainer`).hide();
        $(`#nabankContainer`).hide();
        updateStore();
    });
    $(`#buy-goods`).on(`click`, () => {
        $(`.btn-shopping-modal`).removeClass(`active`);
        $(`#buy-goods`).addClass(`active`);
        $(`#bankContainer`).hide();
        $(`#nabankContainer`).hide();

        updateStore();
    });
    $(`#open-bank-menu`).on(`click`, () => {
        $(`.btn-shopping-modal`).removeClass(`active`);
        $(`#open-bank-menu`).addClass(`active`);
        $(`#bankContainer`).show();
        $(`#nabankContainer`).hide();
        updateStore();

        $(`#successTakeDepoMess`).hide();
        $(`#successMakeDepoMess`).hide();
        $(`#errorMakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
        getBankData();
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

    $(`#btn-make-deposit`).on(`click`, () => {
        makeDeposit();
    });
    $(`#btn-take-deposit`).on(`click`, () => {
        takeDeposit();
    });
};

/**
 * Init economy UI
 */
let ecoUiInit = () => {
    // When shop button is pressed open shop modal
    $(`#show-shopping-modal-button`).on(`click`, () => {
        $(`#shopping-modal`).fadeIn();
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
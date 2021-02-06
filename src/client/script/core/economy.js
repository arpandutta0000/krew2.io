/* When a user makes a deposit */
let makeDeposit = () => {
    let deposit = +$(`#make-deposit`).val();
    let sumDeposits = parseInt($(`#my-deposits`).text()) + deposit;
    if (deposit <= myPlayer.gold && sumDeposits <= 150000) {
        socket.emit(`bank`, {
            deposit: deposit
        });
        playAudioFile(false, `deposit`);
        $(`#make-deposit`).val(``).focus();
        $(`#successMakeDepoMess`).show();
        $(`#errorMakeDepoMess`).hide();
        $(`#successTakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    } else if (sumDeposits > 150000) {
        $(`#errorFullDepoMess`).show();
        $(`#successMakeDepoMess`).hide();
        $(`#errorMakeDepoMess`).hide();
        $(`#successTakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
    } else {
        $(`#errorMakeDepoMess`).show();
        $(`#successMakeDepoMess`).hide();
        $(`#successTakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    }
};

/* When a user makes a withdrawl */
let takeDeposit = () => {
    let deposit = +$(`#take-deposit`).val();
    if (deposit <= +$(`#my-deposits`).text()) {
        socket.emit(`bank`, {
            takedeposit: deposit
        });
        $(`#take-deposit`).val(``).focus();
        $(`#successTakeDepoMess`).show();
        $(`#successMakeDepoMess`).hide();
        $(`#errorMakeDepoMess`).hide();
        $(`#errorTakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    } else {
        $(`#errorTakeDepoMess`).show();
        $(`#successTakeDepoMess`).hide();
        $(`#successMakeDepoMess`).hide();
        $(`#errorMakeDepoMess`).hide();
        $(`#errorFullDepoMess`).hide();
    }
};

/* Create socket emit to get bank data */
let getBankData = () => {
    socket.emit(`bank`);
};

let ecoUiInit = () => {
    let $btnShoppingModal = $(`.btn-shopping-modal`);

    // When shop button is pressed open shop modal
    $(`#show-shopping-modal-button`).on(`click`, () => {
        $(`#shopping-modal`).fadeIn();
    });

    // Update store
    $btnShoppingModal.each(() => {
        let $this = $(this);
        $this.on(`click`, () => {
            $btnShoppingModal.removeClass(`active`);
            $this.addClass(`active`);
            updateStore($this);
        });
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
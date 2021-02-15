/**
 * Sets bank data
 *
 * @param {object} data Bank data
 */
let setBankData = (data) => {
    if (data.warn) {
        $(`#bankContainer`).hide();
        $(`#nabankContainer`).show();
    } else {
        $(`#bankContainer`).show();
        $(`#nabankContainer`).hide();
        $(`#my-deposits`).text(data.my);

        $(`#make-deposit`).attr({
            max: myPlayer.gold
        });
        $(`#take-deposit`).attr({
            max: data.my
        });
    }
};

/**
 * When a user makes a deposit to the bank
 */
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

/**
 * When a user withdraws from the bank
 */
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

/**
 * Create socket emit to get bank data
 */
let getBankData = () => {
    socket.emit(`bank`);
};

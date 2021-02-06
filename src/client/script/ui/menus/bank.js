/**
 * Sets bank data
 * 
 * @param {object} data Bank data
 */
setBankData = (data) => {
    if (data.warn) {
        $(`#bankContainer`).hide();
        $(`#nabankContainer`).show();
    } else {
        $(`#bankContainer`).show();
        $(`#nabankContainer`).hide();
        $(`#my-deposits`).text(data.my);
        if (data.total >= 1000 && data.total.toString().length <= 6) {
            var goldTotalScore = `${Math.floor(data.total / 1000)} K`;
            $(`#total-deposits`).text(goldTotalScore);
        } else if (data.total.toString().length >= 7) {
            goldTotalScore = `${Math.floor(data.total / 1000) / 1000} M`;
            $(`#total-deposits`).text(goldTotalScore);
        } else {
            goldTotalScore = data.total;
            $(`#total-deposits`).text(goldTotalScore);
        }
        $(`#make-deposit`).attr({
            max: myPlayer.gold
        });
        $(`#take-deposit`).attr({
            max: data.my
        });
    }
};
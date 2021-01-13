/* Pre-gameplay UI init to be ran after document is ready */
let preGamplayUiInit = () => {
    // Show more button on Wall of Fame
    $(`#show-more`).on(`click`, () => {
        if ($(`#show-more`).text().indexOf(`Show more`) > -1) {
            $(`.top50`).show();
            $(`#show-more`).html(`<i class="icofont icofont-medal"></i> Show less`);
        } else {
            $(`.top50`).hide();
            $(`#show-more`).html(`<i class="icofont icofont-medal"></i> Show more`);
        }
    });

    // Play button
    $(`#play-button`).on(`click`, () => {
        GameAnalytics(`addDesignEvent`, `Game:Session:ClickedPlayButton`);

        if (threejsStarted) {
            ui.showAdinplayCentered();
            login();
            setUpKeybinds();
            ui.LoadingWheel(`show`);
            ui.playAudioFile(false, `wheelspin`);
            ui.playAudioFile(true, `ocean-ambience`);
        }
    }).text(`Loading...`).attr(`disabled`, true);
}
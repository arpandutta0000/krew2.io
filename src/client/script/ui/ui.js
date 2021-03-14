let ui = {
    /* Create variables */
    hideSuggestionBox: false,
    serverList: {},
    lastGold: 0,
    markerMapCount: performance.now(),
    allPagesId: [`#ship-status-modal`, `#shopping-modal`, `#krew-list-modal`, `#game-settings-modal`, `#quests-modal`, `#help-modal`],

    /**
     * Captain configuration, sets the active property if player is the captain
     *
     * @type {object}
     */
    captainUiConfiguration: {
        editingName: false,
        active: false
    },

    /**
     * Set the initial UI listeners
     */
    setListeners: () => {
        /* Hide bootstrap elements as bootstrap by default un-hides elements inside .tab */
        $(`#global-chat-alert`).hide();

        /* Init set quality settings */
        ui.setQualitySettings();

        /* Update Music volume on music control change */
        $(`#music-control`).on(`change`, () => audio.updateMusicVolume());

        /* Prevent splash UI from closing */
        $(`#splash-modal`).modal({
            backdrop: `static`,
            keyboard: false
        });

        /* Show splash modal */
        $(`#splash-modal`).modal(`show`);

        /* Show more button on Wall of Fame */
        $(`#show-more`).on(`click`, () => {
            if ($(`#show-more`).text().indexOf(`Show more`) > -1) {
                $(`.top50`).show();
                $(`#show-more`).html(`<i class="icofont icofont-medal"></i> Show less`);
            } else {
                $(`.top50`).hide();
                $(`#show-more`).html(`<i class="icofont icofont-medal"></i> Show more`);
            }
        });

        /* Check if an invite link is being used */
        if (getUrlVars().sid && getUrlVars().bid) {
            $(`#invite-is-used`).show();
            $(`#select-server`).hide();
            $(`#select-spawn`).hide();
        }

        /* Play button */
        $(`#play-button`).on(`click`, () => {
            GameAnalytics(`addDesignEvent`, `Game:Session:ClickedPlayButton`);

            if (threejsStarted) {
                initGameUi();
                ecoUiInit();
                showAdinplayCentered();
                splash.loadingWheel(`show`);
                audio.playAudioFile(false, false, 1, `wheelspin`);
                audio.playAudioFile(true, false, 0.7, `ocean-ambience`);
            }
        }).text(`Loading...`).attr(`disabled`, true);
    },

    /**
     * Generate an invite link
     */
    getInviteLink: () => `${window.location.protocol}//${window.location.hostname}${window.location.hostname === `localhost` ? `:8080/?sid=` : `/?sid=`}${$(`#server-list`).val()}&bid=${myPlayer.parent.id}`,

    /**
     * Formats and updates gold
     *
     * @param {number} gold Amount of gold
     */
    checkGoldDelta: (gold) => {
        let glowGoldTimeout = 0;

        // update player gold in shopping window
        let deltaGold = gold - ui.lastGold;
        ui.lastGold = gold;
        if (deltaGold > 0) {
            myPlayer.notifiscationHeap[Math.random().toString(36).substring(6, 10)] = {
                text: `+ ${deltaGold} Gold!`,
                type: 1,
                isNew: true
            };
            if (!$(`#gold`).hasClass(`glow-gold-plus`) && glowGoldTimeout === 0) {
                $(`#gold`).addClass(`glow-gold-plus`);
                glowGoldTimeout = 1;
                setTimeout(() => {
                    $(`#gold`).removeClass(`glow-gold-plus`);
                    glowGoldTimeout = 0;
                }, 3500);
            }
            // shorten gold number by using K for thousand and M for million
            let gold_short;
            if (gold > 99999 && gold < 999999) {
                gold_short = `${Math.floor(gold / 1000)} K`;
            } else if (gold > 999999) {
                gold_short = `${Math.floor(gold / 1000) / 1000} M`;
            } else {
                gold_short = gold;
            }
            // update gold value
            $(`.my-gold`).text(gold_short);
        } else if (deltaGold < 0) {
            if (!$(`#gold`).hasClass(`glow-gold-minus`) && glowGoldTimeout === 0) {
                $(`#gold`).addClass(`glow-gold-minus`);
                glowGoldTimeout = 1;
                setTimeout(() => {
                    $(`#gold`).removeClass(`glow-gold-minus`);
                    glowGoldTimeout = 0;
                }, 3500);
            }
            // shorten gold number by using K for thousand and M for million
            let gold_short;
            if (gold > 99999 && gold < 999999) {
                gold_short = `${Math.floor(gold / 1000)} K`;
            } else if (gold > 999999) {
                gold_short = `${Math.floor(gold / 1000) / 1000} M`;
            } else {
                gold_short = gold;
            }
            // update gold value
            $(`.my-gold`).text(gold_short);
        }
    },

    /**
     * Closes all modals
     */
    closeAllPages: () => {
        for (let page of ui.allPagesId) $(page).hide();
    },

    /**
     * Closes all modals except a specified modal
     *
     * @param {string} paramId The modal to leave open
     */
    closeAllPagesExcept: (pageId) => {
        for (let page of ui.allPagesId) {
            if (pageId !== page) $(page).hide();
        }
    },

    /**
     * Create quality selection menu
     */
    setQualitySettings: () => {
        let $quality;

        $(`#quality-list`).html(``);
        $quality = $(`<option/>`, {
            html: `High Quality (slow)`,
            value: 3
        });
        $(`#quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Medium Quality (fast)`,
            value: 2
        });
        $(`#quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Low Quality (faster)`,
            value: 1
        });
        $(`#quality-list`).append($quality);

        $(`#account-quality-list`).html(``);
        $quality = $(`<option/>`, {
            html: `High Quality (slow)`,
            value: 3
        });
        $(`#account-quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Medium Quality (fast)`,
            value: 2
        });
        $(`#account-quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Low Quality (faster)`,
            value: 1
        });
        $(`#account-quality-list`).append($quality);
    },

    /**
     * Updates captain UI
     */
    updateCaptainUi: () => {
        // If i am the captain and i am not editing the name, show the editing button
        if (ui.captainUiConfiguration.active && !ui.captainUiConfiguration.editingName) {
            $(`#crew-name-edit-button`).removeClass(`hidden`);
        } else { // If i am not the captain hide the edit button
            $(`#crew-name-edit-button`).addClass(`hidden`);
        }
    },

    /**
     * Returns true if a text field is focused
     */
    textFieldFocused: () => $(`input[type=text], input[type=number], input[type=password], input[type=email]`).is(`:focus`)
};

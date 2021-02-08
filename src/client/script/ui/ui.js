let ui = {
    /* Create variables */
    hideSuggestionBox: false,
    serverList: {},
    lastGold: 0,
    markerMapCount: performance.now(),

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

        /* Setting Krew name */
        $(`#crew-name-edit-button`).on(`click`, () => {
            $(`#crew-name-edit-button`).addClass(`hidden`);
            if (ui.captainUiConfiguration.active) {
                $(`#crew-name`).addClass(`hidden`);
                ui.captainUiConfiguration.editingName = true;
                $(`#crew-name-edit-input`).val($(`#crew-name`).html()).removeClass(`hidden`);
            }
        });
        $(`#krew-name-form`).on(`submit`, (e) => {
            ui.captainUiConfiguration.editingName = false;
            $(`#crew-name`).removeClass(`hidden`);
            $(`#crew-name-edit-input`).addClass(`hidden`);
            if (ui.captainUiConfiguration.active) {
                $(`#crew-name-edit-button`).removeClass(`hidden`);
                let val = $(`#crew-name-edit-input`).val().trim().slice(0, 20);
                if (val.length > 0 && !val.includes(`⚔`)) {
                    myBoat.setName(val);
                    $(`#crew-name`).text(myBoat.crewName);
                    socket.emit(`updateKrewName`, myBoat.crewName);
                }
            }
            $(`#crew-name-edit-input`).val(``);
            e.preventDefault();
        });

        /* Open Shop */
        $(`.toggle-shop-modal-button`).on(`click`, () => {
            if ($(`#toggle-shop-modal-button`).hasClass(`enabled`)) {
                if ($(`#shopping-modal`).is(`:visible`)) {
                    $(`#shopping-modal`).hide();
                } else {
                    $(`#toggle-shop-modal-button`).popover(`hide`);
                    $(`#shopping-modal`).show();
                }
            }
        });

        /* View list of docked Krews */
        $(`.toggle-krew-list-modal-button`).on(`click`, () => {
            if ($(`#toggle-krew-list-modal-button`).hasClass(`enabled`)) {
                if ($(`#krew-list-modal`).is(`:visible`)) {
                    $(`#krew-list-modal`).hide();
                } else {
                    $(`#toggle-shop-modal-button`).popover(`hide`);
                    $(`#krew-list-modal`).show();
                }
            }
        });

        /* Open bank */
        $(`.toggle-bank-modal-button`).on(`click`, () => {
            if ($(`#toggle-bank-modal-button`).hasClass(`enabled`)) {
                if ($(`#bank-modal`).is(`:visible`)) {
                    $(`#bank-modal`).hide();
                } else {
                    ui.closeAllPagesExcept(`#bank-modal`);
                    $(`#bank-modal`).show();
                    $(`#successTakeDepoMess`).hide();
                    $(`#successMakeDepoMess`).hide();
                    $(`#errorMakeDepoMess`).hide();
                    $(`#errorTakeDepoMess`).hide();
                    getBankData();
                }
            }
        });

        /* Button to toggle map */
        $(`#toggle-map-button`).on(`click`, () => {
            if ($(`#minimap-container`).is(`:visible`)) {
                $(`#minimap-container`).hide();
            } else {
                $(`#minimap-container`).show();
            }
        });

        /* Toggle ship status */
        $(`.toggle-ship-status-button`).on(`click`, () => {
            if ($(`#ship-status-modal`).is(`:visible`)) {
                $(`#ship-status-modal`).hide();
            } else {
                ui.closeAllPagesExcept(`#ship-status-button`);
                showShipStatus();
                $(`#ship-status-modal`).show();
                if (myPlayer.isCaptain !== true) {
                    $(`#lock-krew-label`).hide();
                } else {
                    $(`#lock-krew-label`).show();
                    if (myBoat && myBoat.isLocked !== true) {
                        $(`#lock-krew-button`).prop(`checked`, false);
                        $(`#lock-krew-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`Lock krew...`);
                    } else {
                        $(`#lock-krew-button`).prop(`checked`, true);
                        $(`#lock-krew-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`Unlock krew...`);
                    }
                }
            }
        });
        $(`#ship-status`).on(`click`, () => {
            showShipStatus();
        });

        /* Clan managment panel */
        $(`#clan-management`).on(`click`, () => {
            $(`#clan-management`).addClass(`active`);
            $(`#ship-status`).removeClass(`active`);
            if (myPlayer.isLoggedIn === true) {
                clanUi.setClanData();
                if (!$(`#clan-management-container`).is(`:visible`)) {
                    $(`#clan-management-container`).show();
                    $(`#ship-status-container`).hide();
                    clanUi.setClanData(`force`);
                }
            } else {
                $(`#ship-status-container`).hide();
                $(`#notLoggedIn-container`).show();
            }
        });

        /* Leave clan button */
        $(`#leave-clan-button`).on(`click`, () => {
            socket.emit(`clan`, `leave`, (callback) => {
                if (callback === true) {
                    clanUi.setClanData(`force`);
                }
            });
            myPlayer.clan = ``;
            clanUi.setClanData();
        });

        /* Request to join a clan button */
        $(`#request-clan-button`).on(`click`, () => {
            $(`#clan-table`).hide();
            $(`#clan-request-table`).show();
            $(`#view-clan-button`).show();
        });

        /* View clan button */
        $(`#view-clan-button`).on(`click`, () => {
            $(`#clan-table`).show();
            $(`#clan-request-table`).hide();
            $(`#view-clan-button`).hide();
        });

        /* Hide errors on clan request */
        $(`#clan-request`).on(`click`, () => {
            clanUi.hideAllClanErrors();
        });

        /* Join clan button */
        $(`#join-clan-button`).on(`click`, () => {
            clanUi.hideAllClanErrors();
            let clanRequest = $(`#clan-request`).val();
            if (isAlphaNumeric(clanRequest) !== true) {
                $(`#errorInput`).show();
            } else if (clanRequest.length < 1 || clanRequest.length > 4) {
                $(`#errorLength`).show();
            } else if (!myPlayer.clanRequest || myPlayer.clanRequest === ``) {
                socket.emit(`clan`, {
                    action: `join`,
                    id: clanRequest
                }, (callback) => {
                    if (callback === true) {
                        myPlayer.clanRequest = clanRequest;
                        clanUi.setClanData(`force`);
                    } else if (callback === 404) {
                        $(`#error404`).show();
                    } else {
                        $(`#errorUndefined`).show();
                    }
                });
            }
        });

        /* Create clan button */
        $(`#create-clan-button`).on(`click`, () => {
            clanUi.hideAllClanErrors();
            let clanRequest = $(`#clan-request`).val();
            if (isAlphaNumeric(clanRequest) !== true) {
                $(`#errorInput`).show();
            } else if (clanRequest.length < 1 || clanRequest.length > 4) {
                $(`#errorLength`).show();
            } else {
                socket.emit(`clan`, {
                    action: `create`,
                    id: clanRequest
                }, (callback) => {
                    if (callback === true) {
                        myPlayer.clan = clanRequest;
                        myPlayer.clanLeader = true;
                        clanUi.setClanData(`force`);
                    } else if (callback === 409) {
                        $(`#errorExists`).show();
                    } else if (callback === 403) {
                        $(`#errorUnauthorized`).show();
                    } else {
                        $(`#errorUndefined`).show();
                    }
                });
            }
        });

        /* Clan table */
        $(`#clan-table`).on(`click`, (e) => {
            let clanEvent = e.target.getAttribute(`data-event`);
            let clanId = e.target.getAttribute(`data-id`);

            if (clanEvent === `promote-clan`) {
                socket.emit(`clan`, {
                    action: `promote`,
                    id: clanId
                }, (callback) => {
                    if (callback === true) {
                        clanUi.setClanData(`force`);
                    }
                });
                clanUi.setClanData();
            } else if (clanEvent === `kick-clan`) {
                socket.emit(`clan`, {
                    action: `kick`,
                    id: clanId
                }, (callback) => {
                    if (callback === true) {
                        clanUi.setClanData(`force`);
                    }
                });
            }
        });

        /* Clan request table */
        $(`#clan-request-table`).on(`click`, (e) => {
            let requestEvent = e.target.getAttribute(`data-event`);
            let requestPlayer = e.target.getAttribute(`data-id`);

            if (requestEvent === `accept-request`) {
                socket.emit(`clan`, {
                    action: `accept`,
                    id: requestPlayer
                }, (callback) => {
                    if (callback === true) {
                        clanUi.setClanData(`force`);
                    }
                });
            } else if (requestEvent === `decline-request`) {
                socket.emit(`clan`, {
                    action: `decline`,
                    id: requestPlayer
                }, (callback) => {
                    if (callback === true) {
                        clanUi.setClanData(`force`);
                    }
                });
            }
        });

        /* Player request table */
        $(`#player-request-table`).on(`click`, (e) => {
            let cancelRequestEvent = e.target.getAttribute(`data-event`);
            if (cancelRequestEvent === `cancel-request`) {
                if (myPlayer.clanRequest && myPlayer.clanRequest !== ``) {
                    socket.emit(`clan`, {
                        action: `cancel-request`,
                        id: myPlayer.clanRequest
                    }, (callback) => {
                        if (callback === true) {
                            myPlayer.clanRequest = ``;
                            clanUi.setClanData(`force`);
                        }
                    });
                }
            }
        });

        /* Add marker on minimap click */
        $(`#minimap`).on(`click`, (e) => {
            if (ui.markerMapCount < performance.now() - 5000) {
                ui.markerMapCount = performance.now();
                let x = (((e.offsetX === undefined ? e.layerX : e.offsetX) - 10) / 180) * config.worldsize;
                let y = (((e.offsetY === undefined ? e.layerY : e.offsetY) - 10) / 180) * config.worldsize;
                socket.emit(`addMarker`, {
                    x: x,
                    y: y
                });
            }
        });

        /* Kick a krew member*/
        $(`#krew-list`).on(`click`, (e) => {
            let dataEvent = e.target.getAttribute(`data-event`);
            if (dataEvent === `kick`) {
                var dataId = e.target.getAttribute(`data-id`);
                if (typeof dataId === `string` && dataId.length > 0) {
                    socket.emit(`bootMember`, dataId);
                    $(e.target).closest(`.player-list-item`).remove();
                    if ($(`#buy-goods`).hasClass(`active`)) {
                        GoodsComponent.getList();
                    }
                }
            } else if (dataEvent === `transfer`) {
                var dataId = e.target.getAttribute(`data-id`);
                if (typeof dataId === `string` && dataId.length > 0) {
                    socket.emit(`transferShip`, dataId);
                    if ($(`#buy-goods`).hasClass(`active`)) {
                        GoodsComponent.getList();
                    }
                }
            }
        });

        /* Update Music volume on music control change */
        $(`#music-control`).on(`change`, () => updateMusic());

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
                setUpKeybinds();
                showAdinplayCentered();
                splash.loadingWheel(`show`);
                playAudioFile(false, `wheelspin`);
                playAudioFile(true, `ocean-ambience`);
            }
        }).text(`Loading...`).attr(`disabled`, true);
    },

    /**
     * Generate an invite link
     */
    getInviteLink: () => `${window.location.protocol}//${window.location.hostname}${window.location.hostname === `localhost` ? `:8080/?sid=` : `/?sid=`}${$(`#server-list`).val()}&bid=${myBoat.id}`,

    /**
     * Formats and updates gold
     * 
     * @param {number} gold Amount of gold
     */
    checkGoldDelta: (gold) => {
        let glowGoldTimeout = 0;

        // update player gold in shopping window
        deltaGold = gold - ui.lastGold;
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
            if (gold > 99999 && gold < 999999) {
                var gold_short = `${Math.floor(gold / 1000)} K`;
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
            if (gold > 99999 && gold < 999999) {
                var gold_short = `${Math.floor(gold / 1000)} K`;
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
     * Closes all modals except a specified modal
     * 
     * @param {string} paramId The modal to leave open
     */
    closeAllPagesExcept: (pageId) => {
        let allPagesId = [`#help-modal`, `#bank-modal`, `#krew-list-modal`, `#shopping-modal`, `#quests-modal`, `#ship-status-modal`];
        for (let i = 0; i < allPagesId.length; i++) {
            if (pageId !== allPagesId[i]) {
                $(allPagesId[i]).hide();
            }
        }
    },

    /**
     * Create quality selection menu
     */
    setQualitySettings: () => {
        $(`#quality-list`).html(``);
        var $quality = $(`<option/>`, {
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
        var $quality = $(`<option/>`, {
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
    }
};
/**
 * Disconnect/game end listener
 *
 * @param {number} gold Amount of gold
 * @param {number} fired Number of times the user fired
 * @param {number} hit Number of times the user hit another boat
 * @param {number} sank Number of ships user sank
 */
let endTheGame = (gold, fired, hit, sank) => {
    //miniplaySend2API(`gameover`, 1);
    //miniplaySend2API(`ships`, sank);

    controls.unLockMouseLook();

    $(`.local-chat`).remove();
    $(`#game-over-modal`).modal(`show`);

    setHighlights(gold, fired, hit, sank);
    myPlayer.state = 1;
};

/**
 * Initiate game UI
 */
let initGameUi = () => {
    connect($(`#server-list`).val());

    initChatListeners();

    $.ajax({
        url: `/account_game_settings`,
        type: `GET`,
        success: function (res) {
            if (res.fpMode) {
                $(`#account-fp-mode-button`).prop(`checked`, true);
                $(`#fp-mode-button`).prop(`checked`, true);
            } else {
                $(`#account-fp-mode-button`).prop(`checked`, false);
                $(`#fp-mode-button`).prop(`checked`, false);
            }

            $(`#account-fov-control`).val(res.fov ? res.fov : 10);

            $(`#account-music-control`).val(res.musicVolume ? res.musicVolume : 50);
            $(`#music-control`).val(res.musicVolume ? res.musicVolume : 50);
            $(`#account-sfx-control`).val(res.sfxVolume ? res.sfxVolume : 50);
            $(`#sfx-control`).val(res.sfxVolume ? res.sfxVolume : 50);

            $(`#account-quality-list`).val(res.qualityMode ? res.qualityMode : 2);
            $(`#quality-list`).val(res.qualityMode ? res.qualityMode : 2);

            $(`#account-game-settings-save-notice`).removeClass(`hidden`);

            updateMusic();
            updateQuality();
        },
        error: function (res) {
            $(`#account-fp-mode-button`).prop(`checked`, false);
            $(`#fp-mode-button`).prop(`checked`, false);

            $(`#account-music-control`).val(50);
            $(`#music-control`).val(50);
            $(`#account-sfx-control`).val(50);
            $(`#sfx-control`).val(50);

            $(`#account-quality-list`).val(2);
            $(`#quality-list`).val(2);

            $(`#quality-list`).emit(`change`);
            $(`#music-control`).emit(`change`);

            updateMusic();
            updateQuality();
        }
    });

    /* Play again button on game over */
    $(`#play-again-button`).on(`click`, () => {
        if (threejsStarted) {
            showAdinplayCentered();
            secondsAlive = 0;
            socket.emit(`respawn`);
            myPlayer.itemId = undefined;
            myPlayer.state = 2;

            $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
            $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
            $(`#toggle-bank-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
        }
    });

    /* When the quality option is changed, update quality settings */
    $(`#quality-list`).on(`change`, () => updateQuality());

    /* Sliders */
    $(`#crew_count, #ship_health, #food`).slider();
    $(`#crew_count`).on(`slide`, (slideEvt) => {
        $(`#crew_count_val`).text(slideEvt.value);
    });
    $(`#ship_health`).on(`slide`, (slideEvt) => {
        $(`#ship_health_val`).text(slideEvt.value);
    });

    /* Setup docking modal button */
    $(`#docking-modal-button`).on(`click`, () => {
        if ($(`#docking-modal-button`).hasClass(`enabled`)) {
            if (myPlayer && myPlayer.parent) {
                playAudioFile(false, `dock`);
                socket.emit(`anchor`);
                $(`.btn-shopping-modal`).eq(2).trigger(`click`);
                if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
                    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                }
                if (myPlayer.parent.netType === 1 && !$(`#exit-island-button`).is(`:visible`)) {
                    $(`#exit-island-button`).show();
                }
            }

            controls.unLockMouseLook();
            $(`#docking-modal`).hide();

            $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
            $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);

            updateStore();
            $(`#recruiting-div`).fadeIn(`slow`);
        }
    });

    /* Set game over modal attributes */
    $(`#game-over-modal`).modal({
        show: false,
        backdrop: `static`,
        keyboard: false
    });

    /* Invite link button */
    $(`#toggle-invite-link-button`).on(`click`, () => {
        if ($(`#invite-div`).is(`:visible`)) {
            $(`#invite-div`).hide();
        } else {
            $(`#invite-link`).val(ui.getInviteLink());
            $(`#invite-div`).show();
        }
    });

    /* Depart button */
    $(`#exit-island-button`).on(`click`, () => departure());

    /* Help button */
    $(`#toggle-help-button`).on(`click`, () => {
        if ($(`#help-modal`).is(`:visible`)) {
            $(`#help-modal`).hide();
        } else {
            ui.closeAllPagesExcept(`#help-modal`);
            $(`#help-modal`).show();
        }
    });

    /* Get and display quest info */
    $(`#toggle-quest-button`).on(`click`, () => {
        if ($(`#quests-modal`).is(`:visible`)) {
            $(`#quests-modal`).hide();
        } else {
            socket.emit(`get-stats`, (data) => {
                let json_data = JSON.parse(data);
                $(`.pirate-progress`).text(json_data.shipsSank);
                $(`.crew-pirate-progress`).text(json_data.overall_kills);
                if (json_data.shipsSank >= 1) {
                    $(`#completed-quest-table`).append($(`#pirate-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#pirate-quest-2`).show();
                    $(`#crew-pirate-quest-1`).show();
                }
                if (json_data.shipsSank >= 5) {
                    $(`#completed-quest-table`).append($(`#pirate-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#pirate-quest-3`).show();
                }
                if (json_data.shipsSank >= 10) {
                    $(`#completed-quest-table`).append($(`#pirate-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#pirate-quest-4`).show();
                }
                if (json_data.shipsSank >= 20) {
                    $(`#completed-quest-table`).append($(`#pirate-quest-4`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }
                if (json_data.overall_kills >= 10) {
                    $(`#completed-quest-table`).append($(`#crew-pirate-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-pirate-quest-2`).show();
                }
                if (json_data.overall_kills >= 20) {
                    $(`#completed-quest-table`).append($(`#crew-pirate-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-pirate-quest-3`).show();
                }
                if (json_data.overall_kills >= 50) {
                    $(`#completed-quest-table`).append($(`#crew-pirate-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }
                $(`.trade-progress`).text(json_data.overall_cargo);
                $(`.crew-trade-progress`).text(json_data.crew_overall_cargo);
                if (json_data.overall_cargo >= 1000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#trade-quest-2`).show();
                    $(`#crew-trade-quest-1`).show();
                }
                if (json_data.overall_cargo >= 6000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#trade-quest-3`).show();
                }
                if (json_data.overall_cargo >= 15000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#trade-quest-4`).show();
                }
                if (json_data.overall_cargo >= 30000) {
                    $(`#completed-quest-table`).append($(`#trade-quest-4`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }
                if (json_data.crew_overall_cargo >= 12000) {
                    $(`#completed-quest-table`).append($(`#crew-trade-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-trade-quest-2`).show();
                }
                if (json_data.crew_overall_cargo >= 50000) {
                    $(`#completed-quest-table`).append($(`#crew-trade-quest-2`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#crew-trade-quest-3`).show();
                }
                if (json_data.crew_overall_cargo >= 150000) {
                    $(`#completed-quest-table`).append($(`#crew-trade-quest-3`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                }
                $(`#other-progress-1`).text(myPlayer.jump_count);
                if (myPlayer.jump_count >= 50) {
                    $(`#completed-quest-table`).append($(`#other-quest-1`).last());
                    $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                    $(`#other-quest-2`).show();
                }
            });
            ui.closeAllPagesExcept(`#quests-modal`);
            $(`#quests-modal`).show();
        }
    });

    /* Close quests modal button */
    $(`#close-quests-button`).on(`click`, () => {
        $(`#quests-modal`).css(`display`, `none`);
    });

    /* Close quests modal button */
    $(`#close-help-button`).on(`click`, () => {
        $(`#help-modal`).css(`display`, `none`);
    });

    /* Cancel docking */
    $(`#cancel-exit-button`).on(`click`, () => {
        if ($(`#cancel-exit-button`).find(`span`).text() === `Cancel (c)`) {
            socket.emit(`exitIsland`);
            $(`#docking-modal-button`).find(`span`).text(`Countdown...`);
        }
    });

    /* Abandon ship button */
    $(`#abandon-ship-button`).on(`click`, () => {
        if (myBoat.hp <= 0) {
            return;
        }

        if (myPlayer.goods && (myBoat.shipState === 3 || myBoat.shipState === 4)) {
            for (let k in myPlayer.goods) {
                if (myPlayer.goods[k] > 0) {
                    socket.emit(`buy-goods`, {
                        quantity: myPlayer.goods[k],
                        action: `sell`,
                        good: k
                    }, (err, data) => {
                        if (err) return
                        if (!err) {
                            myPlayer.gold = data.gold;
                            myPlayer.goods = data.goods;
                        }
                    });
                }
            }
        }
        socket.emit(`abandonShip`);
        $(`#abandon-ship-button`).hide();
        if (myBoat !== undefined) {
            if (myBoat.shipState === 3 || myBoat.shipState === -1 || myBoat.shipState === 4) {
                // $('#island-menu-div').show();
                $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
                $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
                if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
                    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                }
                updateStore();
            } else if (myBoat.shipState === 1) {
                $(`#docking-modal`).show();
            }
        }
    });

    /* Lock krew button */
    $(`#lock-krew-button`).on(`click`, () => {
        if ($(`#lock-krew-button`).is(`:checked`)) {
            $(`#lock-krew-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`Unlock krew...`);
            socket.emit(`lock-krew`, true);
        } else {
            $(`#lock-krew-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`Lock krew...`);
            socket.emit(`lock-krew`, false);
        }
    });

    /* FP mode switch */
    $(`#fp-mode-button`).on(`click`, () => {
        if ($(`#fp-mode-button`).is(`:checked`)) {
            $(`#fp-mode-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`FP Camera (Enabled)`);
        } else {
            $(`#fp-mode-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`FP Camera (Disabled)`);
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
                ui.closeAllPagesExcept(`#krew-list-modal`);
            }
        }
    });

    /* Setting Krew name buttons */
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

    /* Kick a krew member */
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

    /* Make sure player leaderboard is hidden */
    $(`#player-leaderboard`).hide();

    /* On FOV slider update */
    $(`#fov-control`).on(`change`, () => fov = document.getElementById(`fov-control`).value / 10);
};

/**
 * Set player session highlights for respawn window
 *
 * @param {number} gold Amount of gold
 * @param {number} fired Number of times the user fired
 * @param {number} hit Number of times the user hit another boat
 * @param {number} sank Number of ships user sank
 */
let setHighlights = (gold, fired, hit, sank) => {
    $(`#total-gold-collected`).html(gold.toFixed(0));
    $(`#total-shots-fired`).html(fired);
    $(`#total-shots-hit`).html(hit);
    $(`#accuracy`).html(Math.round((hit / fired) * 100));
    $(`#total-ships-sank`).html(sank);
    $(`#supplies-cut`).html((0.3 * gold).toFixed(0));
    if ($(`#docking-modal`).is(`:visible`)) {
        $(`#docking-modal`).hide();
    }
};
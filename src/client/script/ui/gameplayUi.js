// Create variables
let $btnShoppingModal = $(`.btn-shopping-modal`);

/* When a user joins the game */
let login = function () {
    connect($(`#server-list`).val());

    ui.setQualitySettings();

    $.ajax({
        url: `/account_game_settings`,
        type: `GET`,
        success: function (res) {
            if (!res.errors) {
                if (res.fpMode) {
                    $(`#account-fp-mode-button`).prop(`checked`, true);
                    $(`#fp-mode-button`).prop(`checked`, true);
                } else {
                    $(`#account-fp-mode-button`).prop(`checked`, false);
                    $(`#fp-mode-button`).prop(`checked`, false);
                }

                $(`#account-music-control`).val(res.musicVolume);
                $(`#music-control`).val(res.musicVolume);
                $(`#account-sfx-control`).val(res.sfxVolume);
                $(`#sfx-control`).val(res.sfxVolume);

                $(`#account-quality-list`).val(res.qualityMode);
                $(`#quality-list`).val(res.qualityMode);

                $(`#account-game-settings-save-notice`).removeClass(`hidden`);
            } else {
                $(`#account-fp-mode-button`).prop(`checked`, false);
                $(`#fp-mode-button`).prop(`checked`, false);

                $(`#account-music-control`).val(50);
                $(`#music-control`).val(50);
                $(`#account-sfx-control`).val(50);
                $(`#sfx-control`).val(50);

                $(`#account-quality-list`).val(2);
                $(`#quality-list`).val(2);
            }

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
};

/* Update info for island docking/departure timers */
let islandTimer = () => {
    // Update the alive timer
    ++secondsAlive;
    $(`#seconds`).html(pad(secondsAlive % 60));
    $(`#minutes`).html(pad(parseInt(secondsAlive % 3600 / 60)));
    $(`#hours`).html(pad(parseInt(secondsAlive / 3600)));

    if (myPlayer && myPlayer.parent) {
        if (myPlayer.parent.shipState === -1 || myPlayer.parent.shipState === 3) {
            $dockingModalButton.removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
            $portName.text(entities[myPlayer.parent.anchorIslandId].name);
            $dockingModalButtonSpan.text(`Countdown...`);
            $cancelExitButtonSpan.text(`Sail (c)`);
            return;
        }

        if (myPlayer.parent.netType === 5) {
            $portName.text(myPlayer.parent.name);
            if ($dockingModal.is(`:visible`)) {
                $dockingModal.hide();
                showIslandMenu();
            }
        }

        if ($dockingModal.hasClass(`initial`)) {
            $dockingModal.removeClass(`initial`).find(`#you-are-docked-message`).remove();
        }

        if (myPlayer.parent.shipState !== 1) {
            countDown = 8;
        }

        if (myPlayer.parent.shipState === 1) {
            if (countDown === 8) {
                socket.emit(`dock`);
            }
            $cancelExitButtonSpan.text(`Cancel (c)`);

            if (countDown !== 0 && countDown > 0) {
                $dockingModalButtonSpan.text(`Docking in ${countDown} seconds`);
            } else {
                $dockingModalButtonSpan.text(`Dock (z)`);
                $dockingModalButton.removeClass(`btn btn-primary disabled btn-lg`).addClass(`btn btn-primary enabled btn-lg`);
            }

            countDown--;
        }

        if (myPlayer.parent.shipState === 4) {
            $(`#docking-modal`).hide();
            if (!$(`#departure-modal`).is(`:visible`)) {
                $(`#departure-modal`).show(0);
            }

            $(`#cancel-departure-button`).find(`span`).text(`${(myPlayer && myPlayer.isCaptain ? `Departing in ` : `Krew departing in `) + entities[myPlayer.id].parent.departureTime} seconds`);
        }

        if (((!myPlayer.isCaptain && myPlayer.parent.shipState !== 4) || (myPlayer.isCaptain && myPlayer.parent.shipState === 0)) && $(`#departure-modal`).is(`:visible`)) {
            $(`#departure-modal`).hide();
        }
    }
};
let timer = setInterval(() => {
    islandTimer();
}, 1000);

/* Set player session highlights for respawn window */
let setHighlights = (gold, fired, hit, sank) => {
    $(`#total-score`).html(lastScore);
    $(`#total-damage`).html(lastScore);
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

/* Disconnect/game end listener */
let endTheGame = (gold, fired, hit, sank) => {
    miniplaySend2API(`gameover`, 1);
    miniplaySend2API(`ships`, sank);

    controls.unLockMouseLook();

    $(`.local-chat`).remove();
    $(`#game-over-modal`).modal(`show`);

    setHighlights(gold, fired, hit, sank);
    myPlayer.state = 1;
};

/* Gameplay UI init to be ran after document is ready */
let gameplayUiInit = () => {
    // Play again button on game over
    $(`#play-again-button`).on(`click`, () => {
        if (threejsStarted) {
            ui.showAdinplayCentered();
            secondsAlive = 0;
            socket.emit(`respawn`);
            myPlayer.itemId = undefined;
            myPlayer.state = 2;

            $(`#toggle-shop-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`);
            $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md enabled toggle-krew-list-modal-button`).addClass(`btn btn-md disabled toggle-krew-list-modal-button`);
            $(`#toggle-bank-modal-button`).removeClass(`btn btn-md enabled toggle-shop-modal-button`).addClass(`btn btn-md disabled toggle-shop-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
        }
    });

    // When the quality option is changed, update quality settings
    $(`#quality-list`).on(`change`, () => updateQuality());

    // Sliders
    $(`#crew_count, #ship_health, #food`).slider();
    $(`#crew_count`).on(`slide`, (slideEvt) => {
        $(`#crew_count_val`).text(slideEvt.value);
    });
    $(`#ship_health`).on(`slide`, (slideEvt) => {
        $(`#ship_health_val`).text(slideEvt.value);
    });

    // Setup docking modal button
    $(`#docking-modal-button`).on(`click`, () => {
        if ($(`#docking-modal-button`).hasClass(`enabled`)) {
            if (myPlayer && myPlayer.parent) {
                ui.playAudioFile(false, `dock`);
                socket.emit(`anchor`);
                $btnShoppingModal.eq(2).trigger(`click`);
                if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
                    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                }
                if (myPlayer.parent.netType === 1 && !$(`#exit-island-button`).is(`:visible`)) {
                    $(`#exit-island-button`).show();
                }
            }

            lastScore = 0;
            controls.unLockMouseLook();
            $(`#docking-modal`).hide();
            $(`#supply`).tooltip(`show`);

            $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
            $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);

            ui.updateStore($(`.btn-shopping-modal.active`));
            $(`#recruiting-div`).fadeIn(`slow`);
        }
    });

    // Set game over modal attributes
    $(`#game-over-modal`).modal({
        show: false,
        backdrop: `static`,
        keyboard: false
    });

    // Invite link button
    $(`#toggle-invite-link-button`).on(`click`, () => {
        if ($(`#invite-div`).is(`:visible`)) {
            $(`#invite-div`).hide();
        } else {
            $(`#invite-link`).val(ui.getInviteLink());
            $(`#invite-div`).show();
        }
    });

    // Depart button
    $(`#exit-island-button`).on(`click`, () => departure());

    // Help button
    $(`#toggle-help-button`).on(`click`, () => {
        if ($(`#help-modal`).is(`:visible`)) {
            $(`#help-modal`).hide();
        } else {
            ui.closeAllPagesExcept(`#help-modal`);
            $(`#help-modal`).show();
        }
    });

    // Get and display quest info
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

    // Close quests modal button
    $(`#close-quests-button`).on(`click`, () => {
        $(`#quests-modal`).css(`display`, `none`);
    });

    // Cancel docking
    $(`#cancel-exit-button`).on(`click`, () => {
        if ($cancelExitButtonSpan.text() === `Cancel (c)`) {
            socket.emit(`exitIsland`);
            $dockingModalButtonSpan.text(`Countdown...`);
        }
    });

    // Abandon ship button
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
                        if (err) {
                            console.log(err);
                        }
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
                $(`#supply`).tooltip(`show`);
                // $('#island-menu-div').show();
                $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
                $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
                if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
                    $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                }
                ui.updateStore($(`.btn-shopping-modal.active`));
            } else if (myBoat.shipState === 1) {
                $(`#docking-modal`).show();
            }
        }
    });

    // Lock krew burron
    $(`#lock-krew-button`).on(`click`, () => {
        if ($(`#lock-krew-button`).is(`:checked`)) {
            $(`#lock-krew-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`Unlock krew...`);
            socket.emit(`lock-krew`, true);
        } else {
            $(`#lock-krew-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`Lock krew...`);
            socket.emit(`lock-krew`, false);
        }
    });

    // FP mode switch
    $(`#fp-mode-button`).on(`click`, () => {
        if ($(`#fp-mode-button`).is(`:checked`)) {
            $(`#fp-mode-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`FP Camera (Enabled)`);
        } else {
            $(`#fp-mode-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`FP Camera (Disabled)`);
        }
    });
};
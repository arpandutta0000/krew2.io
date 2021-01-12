let keys_walkLeft = false;
let keys_walkRight = false;
let keys_walkFwd = false;
let keys_walkBwd = false;
let keys_rotRight = false;
let keys_rotLeft = false;
let keys_jump = false;
let keys_boot = false;
let keyboard;
let disableKeyboard = false;

let setUpKeyboard = function (renderer) {
    let my_defaults = {
        is_unordered: true,
        prevent_repeat: true,
        prevent_default: true
    };
    keyboard = new window.keypress.Listener(document.getElementById(`body`), my_defaults);

    // stop listening when foxusing a text field
    $(`input[type=text], input[type=number], input[type=password], input[type=email]`)
        .bind(`focus`, () => {
            keyboard.stop_listening();
        })
        .bind(`blur`, () => {
            keyboard.listen();
        });

    // escape keybind. we cant use keyboard js because it doesnt regster escape with mouslock
    document.onkeyup = function (evt) {
        evt = evt || window.event;

        if (evt.keyCode === 27) {
            if (myPlayer) {
                myPlayer.target = undefined;
            }
        } else if (evt.keyCode === 13) {
            if (!$(`#chat-message`).is(`:focus`)) {
                $(`#chat-message`).focus();
            } else {
                $(`#chat-message`).blur();
            }
        } else if (evt.keyCode === 38 && !$(`#chat-message`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
            keys_walkFwd = false;
        } else if (evt.keyCode === 39 && !$(`#chat-message`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
            keys_walkRight = false;
        } else if (evt.keyCode === 40 && !$(`#chat-message`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
            keys_walkBwd = false;
        } else if (evt.keyCode === 37 && !$(`#chat-message`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
            keys_walkLeft = false;
        } else if (evt.keyCode === 16 && !$(`#chat-message`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
            $(`#player-leaderboard`).hide();
        }
    };

    // setUpKeybinds();
};

document.onkeydown = function (evt) {
    evt = evt || window.event;
    if (evt.keyCode === 38 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) { // Up arrow to move forward
        keys_walkFwd = true;
    } else if (evt.keyCode === 39 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) { // Right arrow to move right
        keys_walkRight = true;
    } else if (evt.keyCode === 40 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) { // Down arrow to move backwards
        keys_walkBwd = true;
    } else if (evt.keyCode === 37 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) { // Left arrow to move left
        keys_walkLeft = true;
    } else if (!$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && (evt.keyCode === 49 || evt.keyCode === 97) && !$(`#crew-name-edit-input`).is(`:focus`)) {
        if (myPlayer && myPlayer.geometry && myPlayer.activeWeapon !== 0) {
            socket.emit(`changeWeapon`, 0);
            myPlayer.isFishing = false;
        }
    } else if (!$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && (evt.keyCode === 50 || evt.keyCode === 98) && !$(`#crew-name-edit-input`).is(`:focus`)) {
        if (myPlayer && myPlayer.geometry && myPlayer.activeWeapon !== 1) {
            socket.emit(`changeWeapon`, 1);
            myPlayer.isFishing = false;
        }
    } else if (!$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && (evt.keyCode === 51 || evt.keyCode === 99) && !$(`#crew-name-edit-input`).is(`:focus`)) {
        if (myPlayer && myPlayer.geometry && myPlayer.activeWeapon !== 2) {
            socket.emit(`changeWeapon`, 2);
            myPlayer.isFishing = false;
        }
    } else if (evt.keyCode === 77 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
        if (!$(`#minimap-container`).is(`:visible`)) {
            $(`#minimap-container`).show();
        } else {
            $(`#minimap-container`).hide();
        }
    } else if (evt.keyCode === 16 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
        $(`#player-leaderboard`).show();
    } else if (evt.keyCode === 81 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
        if (!$(`#quests-modal`).is(`:visible`)) {
            document.getElementById(`toggle-quest-button`).click();
        } else {
            $(`#quests-modal`).hide();
        }
    } else if (evt.keyCode === 188 && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#crew-name-edit-input`).is(`:focus`)) {
        if (!$(`#show-chat`).is(`:visible`)) {
            $(`#show-chat`).show();
            $(`#chat-div`).hide();
        } else {
            $(`#show-chat`).hide();
            $(`#chat-div`).show();
        }
    }
    // else if (evt.keyCode === 84 && !$('#chat-message').is(':focus')) {
    //     if ($('#krew-div').is(':visible')) {
    //         $('#krew-div').hide();
    //
    //     } else {
    //         $('#krew-div').show();
    //     }
    // }
    else if (evt.keyCode === 51 || evt.keyCode === 99) {
        if (ui.hideSuggestionBox &&
            myPlayer !== undefined && myPlayer.parent !== undefined &&
            myPlayer.parent.netType !== 1) {
            socket.emit(`purchase`, {
                type: 0,
                id: `1`
            }, (err) => {
                if (err) {
                    console.warn(err);
                }
            });

            if (myPlayer.gold > 500) {
                GameAnalytics(`addDesignEvent`, `Game:Session:PurchasedBoat`);
                $(`#raft-shop-div`).hide();
                $(`#krew-div`).show();
                let shop = document.getElementById(`suggestion-ui`).innerHTML;
                let shopPopover = $(`#toggle-shop-modal-button`).attr(`data-content`, shop).data(`bs.popover`);
                if (shopPopover !== undefined) {
                    shopPopover.setContent();
                    $(`#toggle-shop-modal-button`).popover(`hide`);
                }
            }
        }
    }
    // For experience points allocation
    else if (evt.keyCode >= 53 && evt.keyCode <= 55 &&
        myPlayer && myPlayer.geometry && !$(`#chat-message`).is(`:focus`) && !$(`#clan-request`).is(`:focus`) && !$(`#make-deposit`).is(`:focus`) && !$(`#take-deposit`).is(`:focus`)) {
        let attribute = EXPERIENCEPOINTSCOMPONENT.keys[evt.keyCode];
        EXPERIENCEPOINTSCOMPONENT.clearStore().setStore((Store) => {
            Store.allocatedPoints[attribute] = 1;
            EXPERIENCEPOINTSCOMPONENT.allocatePoints(() => {
                ui.updateUiExperience();
            });
        });
    }
};

let setUpIslandUI = function () {
    socket.emit(`anchor`);

    lastScore = 0;

    // $('.btn-shopping-modal').eq(2).trigger('click');
    $(`#docking-modal`).hide();
    $(`#supply`).tooltip(`show`);

    // $("#shopping-modal").show();
    // $('#island-menu-div').show();
    if (entities[myPlayer.parent.anchorIslandId].name === `Labrador`) {
        $(`#toggle-bank-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
    }

    $(`#toggle-shop-modal-button`).removeClass(`btn btn-md disabled toggle-shop-modal-button`).addClass(`btn btn-md enabled toggle-shop-modal-button`);
    $(`#toggle-krew-list-modal-button`).removeClass(`btn btn-md disabled toggle-krew-list-modal-button`).addClass(`btn btn-md enabled toggle-krew-list-modal-button`);

    if (!$(`#exit-island-button`).is(`:visible`)) {
        $(`#exit-island-button`).show();
    }

    // ui.updateStore($('.btn-shopping-modal.active'));
    $(`#recruiting-div`).fadeIn(`slow`);
    controls.unLockMouseLook();
};

let setUpKeybinds = function () {
    keyboard.reset();

    // movement
    keyboard.register_combo({
        keys: `w`,
        on_keydown: function () {
            keys_walkFwd = true;
        },

        on_release: function () {
            keys_walkFwd = false;
        }
    });

    keyboard.register_combo({
        keys: `s`,
        on_keydown: function () {
            keys_walkBwd = true;
        },

        on_release: function () {
            keys_walkBwd = false;
        }
    });

    keyboard.register_combo({
        keys: `d`,
        on_keydown: function () {
            keys_walkRight = true;
        },

        on_release: function () {
            keys_walkRight = false;
        }
    });

    keyboard.register_combo({
        keys: `a`,
        on_keydown: function () {
            keys_walkLeft = true;
        },

        on_release: function () {
            keys_walkLeft = false;
        }
    });

    keyboard.register_combo({
        keys: `k`,
        on_keydown: function () {
            keys_boot = true;
        },

        on_release: function () {
            keys_boot = false;
        }
    });

    keyboard.register_combo({
        keys: `space`,
        on_keydown: function () {
            keys_jump = true;
            myPlayer.jump_count++;

            // code for christmas event
            // var playerPosition = myPlayer.geometry.getWorldPosition(new THREE.Vector3());

            // if (playerPosition.x >= 850 && playerPosition.x <= 870 && playerPosition.z >= 850 && playerPosition.z <= 870 && myPlayer.jump_count < 1000) {
            //     socket.emit('christmas')
            // }
            if (myPlayer.jump_count === 50) {
                ui.showCenterMessage(`Jumping Hero! New quest available`, 3);
            }
        },

        on_release: function () {
            keys_jump = false;
        }
    });

    keyboard.register_combo({
        keys: `c`,
        on_release: function () {
            if (myPlayer && myPlayer.parent) {
                if ((myPlayer.parent.shipState === 1 || myPlayer.parent.shipState === -1) && $cancelExitButtonSpan.text() === `Cancel (c)`) {
                    socket.emit(`exitIsland`);
                    $dockingModalButtonSpan.text(`Countdown...`);
                } else if (myPlayer.parent.shipState === 3) {
                    departure();
                }
            }
        }
    });

    keyboard.register_combo({
        keys: `z`,
        on_release: function () {
            if (myPlayer &&
                myPlayer.parent &&
                (myPlayer.parent.shipState === 1 || myPlayer.parent.shipState === -1) &&
                $(`#docking-modal-button`).hasClass(`enabled`)
            ) {
                ui.playAudioFile(false, `dock`);
                setUpIslandUI();
            }
        }
    });

    keyboard.register_combo({
        keys: `tab`,
        on_release: function () {
            if ($(`#li-staff-chat`).is(`:visible`) && $(`#li-clan-chat`).is(`:visible`)) {
                // If the player is both a staff member and in a clan.
                if (staffChatOn) toggleClanChat();
                else if (clanChatOn) toggleLocalChat();
                else if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleStaffChat();
            } else if ($(`#li-staff-chat`).is(`:visible`)) {
                // If the player is a staff member but not in a clan.
                if (staffChatOn) toggleLocalChat();
                else if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleStaffChat();
            } else if ($(`#li-clan-chat`).is(`:visible`)) {
                // If a player is not a staff member but is in a clan.
                if (clanChatOn) toggleLocalChat();
                else if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleClanChat();
            } else {
                // If the player is neither a staff member nor in a clan.
                if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleLocalChat();
            }
        }
    });
    keyboard.register_combo({
        keys: `h`,
        on_release: function () {
            if ($(`#help-modal`).is(`:visible`)) $(`#help-modal`).hide();
            else $(`#help-modal`).show();
        }
    });
};

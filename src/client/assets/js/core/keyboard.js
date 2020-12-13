let keys = {
    walkLeft: false,
    walkRight: false,
    walkFwd: false,
    walkBwd: false,
    rotRight: false,
    rotLeft: false,
    jump: false,
    boot: false
}
let keyboard, disableKeyboard = false;

let setUpKeyboard = renderer => {
    let myDefaults = {
        is_unordered: true,
        prevent_repeat: true,
        prevent_default: true
    }
    keyboard = new window.keypress.Listener(document.querySelector(`body`), myDefaults);

    // Stop listening when an input or textarea is focused.
    $(`input, textarea`)
        .bind(`focus`, () => keyboard.stop_listening())
        .bind(`blur`, () => keyboard.listen());

    // Escape keybind.
    document.onkeyup = event => {
        event = event || window.event;
        if(event.key == `Escape`) if(myPlayer) myPlayer.target = undefined;
        else if(event.key == `Enter`) {
            let chatInput = $(`.chat-input`);
            if(!chatInput.is(`:focus`)) chatInput.focus();
            else chatInput.blur();
        }
        else if(event.key == `Up` || event.key == `W`) keys.walkFwd = false;
        else if(event.key == `Right` || event.key == `D`) keys.walkRight = false;
        else if(event.key == `Down` || event.key == `S`) keys.walkBwd = false;
        else if(event.key == `Left` || event.key == `A`) keys.walkLeft = false
        else if(event.key == `Shift`) $(`.player-leaderboard`).hide();
    }
}

document.onkeydown = event => {
    event = event || window.event;

    if(event.key == `ArrowUp` || event.key == `W`) keys.walkFwd = true;
    else if(event.key == `ArrowRight` || event.key == `D`) keys.walkRight = true;
    else if(event.key == `ArrowDown` || event.key == `S`) keys.walkBwd = true;
    else if(event.key == `ArrowLeft` || event.key == `A`) keys.walkLeft = true
    else if(event.key == `Shift`) $(`.player-leaderboard`).show();

    else if(event.key == `1`) {
        if(myPlayer && myPlayer.geomery && myPlayer.activeWeapon != 0) {
            socket.emit(`changeWeapon`, 0);
            myPlayer.isFishing = false;
        }
    }
    else if(event.key == `2`) {
        if(myPlayer && myPlayer.geomery && myPlayer.activeWeapon != 1) {
            socket.emit(`changeWeapon`, 1);
            myPlayer.isFishing = false;
        }
    }
    else if(event.key == `3`) {
        if(myPlayer && myPlayer.geomery && myPlayer.activeWeapon != 1) {
            socket.emit(`changeWeapon`, 2);
            myPlayer.isFishing = false;
        }
    }
    else if(event.key == `q`) {
        if(!$(`.quest-modal`).is(`:visible`)) document.querySelector(`.toggle-quest-btn`).click();
        else $(`.quest-modal`).hide();
    }
    else if(event.key == `m`) {
        let minimap = $(`.minimap-container`);  
        if(minimap.is(`:visible`)) minimap.show();
        else minimap.hide();
    }
    else if(event.key == `,`) {
        let showChatBtn = $(`.show-chat`);
        let chatMenu = $(`.chat-menu`);
        if(showChatBtn.is(`:visible`)) {
            showChatBtn.show();
            chatMenu.hide();
        }
        else {
            showChatBtn.hide();
            chatMenu.show();
        }
    }
    else if(event.key == `4`) {
        if(ui.hideSuggestionBox && myPlayer != undefined && myPlayer.parent != undefined && myPlayer.parent.netType != 1) {
            socket.emit(`purchase`, { type: 0, id: `1` }, err => {
                if(err) console.warn(err);
            });

            if(myPlayer.gold > 500) {
                GameAnalytics(`addDesignEvent`, `Game:Session:PurchasedBoat`);
                $(`.krew-menu`).show();

                let shop = document.querySelector(`.suggestion-ui`).innerHTML;
                let shopPopover = $(`.toggle-shop-modal-btn`).attr(`data-content`, shop).data(`bs-popover`);
                if(shopPopover != undefined) {
                    shopPopover.setContent();
                    $(`.toggle-ship-modal-btn`).popover(`hide`);
                }
            }
        }
    }
    else if(event.key == `5` || event.key == `6` || event.key == `7`) {
        let attribute = EXPERIENCEPOINTSCOMPONENT.keys(event.key);
        EXPERIENCEPOINTSCOMPNENT.clearStore().setStore(Store => {
            Store.allocatedPoints[attribute] = 1;
            EXPERIENCEPOINTSCOMPNENT.allocatePoints(() => ui.updateUiExperience());
        });
    }
}

let setUpIslandUI = () => {
    socket.emit(`anchor`);
    lastScore = 0;

    $(`.docking-modal`).hide();
    $(`.supply`).tooltip(`show`);

    if(entities[myPlayer.parent.anchorIslandId].name == `Labrador`) $(`.toggle-bank-menu-btn`).removeClass(`disabled`).addClass(`enabled`).attr(`data-tooltip`, `Deposit or withdraw gold`);

    $(`.toggle-shop-modal-btn`).removeClass(`disabled`).addClass(`enabled`);
    $(`.toggle-krew-list-modal-btn`).removeClass(`disabled`).addClass(`enabled`);

    if(!$(`.exit-island-btn`).is(`:visible`)) $(`.exit-island-btn`).show();

    $(`.recruiting-wrapper`).fadeIn(`slow`);
    controls.unLockMouseLook();
}

let setUpKeybinds = () => {
    keyboard.reset();

    // Movement.
    keyboard.register_combo({
        keys: `w`,
        on_keydown: () => keys_walkFwd = true,
        on_release: () => keys_walkFwd = false
    });
    keyboard.register_combo({
        keys: `a`,
        on_keydown: () => keys_walkLeft = true,
        on_release: () => keys_walkLeft = false
    });
    keyboard.register_combo({
        keys: `s`,
        on_keydown: () => keys_walkBwd = true,
        on_release: () => keys_walkBwd = false
    });
    keyboard.register_combo({
        keys: `d`,
        on_keydown: () => keys_walkRight = true,
        on_release: () => keys_walkRight = false
    });

    // Kick krew member.
    keyboard.register_combo({
        keys: `k`,
        on_keydown: () => keys_boot = true,
        on_release: () => keys_boot = false
    });

    // Jump.
    keyboard.register_combo({
        keys: `space`,
        on_keydown: () => {
            keys_jump = true;
            myPlayer.jump_count++;

            // For christmas event.
            let playerPosition = myPlayer.geometry.getWorldPosition();
            if(playerPosition.x >= 850 && playerPosition.x <= 870 && playerPosition.z >= 850 && myPlayer.jump_count < 1e3) socket.emit(`christmas`);

            if(myPlayer.jump_count == 50) ui.showCenterMessage(`Jumping Hero! New quest available`, 3);
        },
        on_release: () => keys_jump = false
    });

    // Sail.
    keyboard.register_combo({
        keys: `c`,
        on_release: () => {
            if(myPlayer && myPlayer.parent) {
                if((myPlayer.parent.shipState == 1 || myPlayer.parent.shipState == -1) && cancelExitBtnTxt.text() == `Cancel (c)`) {
                    socket.emit(`exitIsland`);
                    dockingModalBtnTxt.text(`Countdown...`);
                }
                else if(myPlayer.parent.shipState == 3) departure();
           }
        }
    });

    // Dock.
    keyboard.register_combo({
        keys: `z`,
        on_release: () => {
            if(myPlayer && myPlayer.parent && (myPlayer.parent.shipState == 1 || myPlayer.parent.shipState == -1) && $(`.docking-modal-btn`).hasClass(`enabled`)) setUpIslandUI();
        }
    });

    // Chat tabbing.
    keyboard.register_combo({
        keys: `tab`,
        on_release: () => {
            if($(`.li-staff-chat`).is(`:visible`) && $(`.li-clan-chat`).is(`:visible`)) {
                // If the player is both a staff member and in a clan.
                if(staffChatOn) toggleClanChat();
                else if(clanChatOn) toggleLocalChat();
                else if(localChatOn) toggleGlobalChat();
                else if(globalChatOn) toggleStaffChat();
            }
            else if($(`.li-staff-chat`).is(`:visible`)) {
                // If the player is a staff member but not in a clan.
                if(staffChatOn) toggleLocalChat();
                else if(localChatOn) toggleGlobalChat();
                else if(globalChatOn) toggleClanChat();
            }
            else if($(`.li-clan-chat`).is(`:visible`)) {
                // If a player is not a staff member but is in a clan.
                if(clanChatOn) toggleLocalChat();
                else if(localChatOn) toggleGlobalChat();
                else if(globalChatOn) toggleClanChat();
            }
            else {
                // If the player is neither a staff member nor in a clan.
                if(localChatOn) toggleGlobalChat();
                else if(globalChatOn) toggleLocalChat();
            }
        }
    });
}

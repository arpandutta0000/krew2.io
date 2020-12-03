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
        .bind(`focus`, keyboard.stop_listening())
        .bind(`blur`, keyboard.listen());

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
        if(!$(`.quests-modal`).is(`:visible`)) document.querySelector(`.toggle-quest-btn`).click();
        else $(`.quests-modal`).hide();
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
        let attribute = EXPERIENCEPOINTSCOMPONENT.keys(event.keyCode);
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
}

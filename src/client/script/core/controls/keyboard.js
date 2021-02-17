/**
 * Sets up the keyboard
 */
let setUpKeyboard = () => {
    document.onkeyup = function (evt) {
        evt = evt || window.event;

        if (evt.keyCode === 27) { // Escape
            if (myPlayer) {
                myPlayer.target = undefined;
            }

        } else if (evt.keyCode === 13) { // Enter
            if (!$(`#chat-message`).is(`:focus`)) {
                $(`#chat-message`).focus();
            } else {
                $(`#chat-message`).blur();
            }

        } else if (evt.keyCode === 32 && !ui.textFieldFocused()) { // Space
            keys_jump = false;
            myPlayer.jump_count++;
            if (myPlayer.jump_count === 50) notifications.showCenterMessage(`Jumping Hero! New quest available`, 3);

        } else if ((evt.keyCode === 38 || evt.keyCode === 87) && !ui.textFieldFocused()) { // Up arrow or W
            keys_walkFwd = false;
        } else if ((evt.keyCode === 39 || evt.keyCode === 68) && !ui.textFieldFocused()) { // Right arrow or D
            keys_walkRight = false;
        } else if ((evt.keyCode === 40 || evt.keyCode === 83) && !ui.textFieldFocused()) { // Down arrow or S
            keys_walkBwd = false;
        } else if ((evt.keyCode === 37 || evt.keyCode === 65) && !ui.textFieldFocused()) { // Left Arrow or A
            keys_walkLeft = false;

        } else if (evt.keyCode === 16 && !ui.textFieldFocused()) { // Shift
            $(`#player-leaderboard`).hide();

        } else if (evt.keyCode === 9) { // Tab
            evt.preventDefault();
            evt.stopPropagation();
        }
    };

    document.onkeydown = function (evt) {
        evt = evt || window.event;

        if (evt.keyCode === 32 && !ui.textFieldFocused()) { // Space to jump
            keys_jump = true;

        } else if ((evt.keyCode === 38 || evt.keyCode === 87) && !ui.textFieldFocused()) { // Up arrow or W to move forward
            keys_walkFwd = true;
        } else if ((evt.keyCode === 39 || evt.keyCode === 68) && !ui.textFieldFocused()) { // Right arrow or D to move right
            keys_walkRight = true;
        } else if ((evt.keyCode === 40 || evt.keyCode === 83) && !ui.textFieldFocused()) { // Down arrow or A to move backwards
            keys_walkBwd = true;
        } else if ((evt.keyCode === 37 || evt.keyCode === 65) && !ui.textFieldFocused()) { // Left arrow or S to move left
            keys_walkLeft = true;

        } else if ((evt.keyCode === 49 || evt.keyCode === 97) && !ui.textFieldFocused()) { // 1 to select cannon
            if (myPlayer && myPlayer.geometry && myPlayer.activeWeapon !== 0) {
                socket.emit(`changeWeapon`, 0);
                myPlayer.isFishing = false;
            }
        } else if ((evt.keyCode === 50 || evt.keyCode === 98) && !ui.textFieldFocused()) { // 2 to select fishing rod
            if (myPlayer && myPlayer.geometry && myPlayer.activeWeapon !== 1) {
                socket.emit(`changeWeapon`, 1);
                myPlayer.isFishing = false;
            }
        } else if ((evt.keyCode === 51 || evt.keyCode === 99) && !ui.textFieldFocused()) { // 3 to select spyglass
            if (myPlayer && myPlayer.geometry && myPlayer.activeWeapon !== 2) {
                socket.emit(`changeWeapon`, 2);
                myPlayer.isFishing = false;
            }

        } else if (evt.keyCode === 16 && !ui.textFieldFocused()) { // Shift to shop leaderboard
            $(`#player-leaderboard`).show();

        } else if (evt.keyCode === 67 && !ui.textFieldFocused() && myPlayer && myPlayer.parent) { // C to cancel docking
            if ((myPlayer.parent.shipState === 1 || myPlayer.parent.shipState === -1) && $(`#cancel-exit-button`).find(`span`).text() === `Cancel (c)`) {
                socket.emit(`exitIsland`);
                $(`#docking-modal-button`).find(`span`).text(`Countdown...`);
            } else if (myPlayer.parent.shipState === 3) {
                departure();
            }

        } else if (evt.keyCode === 72 && !ui.textFieldFocused()) { // H to open help menu
            if ($(`#help-modal`).is(`:visible`)) $(`#help-modal`).hide();
            else $(`#help-modal`).show();

        } else if (evt.keyCode === 77 && !ui.textFieldFocused()) { // M to toggle map
            if (!$(`#minimap-container`).is(`:visible`)) {
                $(`#minimap-container`).show();
            } else {
                $(`#minimap-container`).hide();
            }

        } else if (evt.keyCode === 81 && !ui.textFieldFocused()) { // Q to open quests menu
            if (!$(`#quests-modal`).is(`:visible`)) {
                document.getElementById(`toggle-quest-button`).click();
            } else {
                $(`#quests-modal`).hide();
            }

        } else if (evt.keyCode === 90 && !ui.textFieldFocused()) { // Z to dock
            if (myPlayer &&
                myPlayer.parent &&
                (myPlayer.parent.shipState === 1 || myPlayer.parent.shipState === -1) &&
                $(`#docking-modal-button`).hasClass(`enabled`)
            ) {
                playAudioFile(false, `dock`);
                setUpIslandUI();
            }

        } else if (evt.keyCode === 9) { // Tab to switch chat menus
            evt.preventDefault();
            evt.stopPropagation();

            if ($(`#li-staff-chat`).is(`:visible`) && $(`#li-clan-chat`).is(`:visible`)) {
                if (staffChatOn) toggleClanChat();
                else if (clanChatOn) toggleLocalChat();
                else if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleStaffChat();
            } else if ($(`#li-staff-chat`).is(`:visible`)) {
                if (staffChatOn) toggleLocalChat();
                else if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleStaffChat();
            } else if ($(`#li-clan-chat`).is(`:visible`)) {
                if (clanChatOn) toggleLocalChat();
                else if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleClanChat();
            } else {
                if (localChatOn) toggleGlobalChat();
                else if (globalChatOn) toggleLocalChat();
            }

        } else if (evt.keyCode === 188 && !ui.textFieldFocused()) { // Comma to toggle chat
            if (!$(`#show-chat`).is(`:visible`)) {
                $(`#show-chat`).show();
                $(`#chat-div`).hide();
            } else {
                $(`#show-chat`).hide();
                $(`#chat-div`).show();
            }

        } else if (evt.keyCode >= 53 && evt.keyCode <= 55 && myPlayer && myPlayer.geometry && !ui.textFieldFocused()) { // 5-7 for experience point usage
            let attribute = ExperiencePointsComponent.keys[evt.keyCode];
            ExperiencePointsComponent.clearStore().setStore((Store) => {
                Store.allocatedPoints[attribute] = 1;
                ExperiencePointsComponent.allocatePoints(() => {
                    experienceBarUpdate();
                });
            });
        }
    };
};
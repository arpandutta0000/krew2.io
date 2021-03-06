/**
 * Add logout button in upper right corner
 */
let addLogout = () => {
    $(`#logged-in`).html(`You are logged in as <b>${headers.username}</b>`).show();
    $(`#login-link`).attr(`href`, `/logout`).html(`Logout`).show();
};

/**
 * Initiate login and register
 */
let initLoginRegister = () => $.get(`${window.location.href.replace(/\?.*/, ``).replace(/#.*/, ``).replace(/\/$/, ``)}/authenticated`).then((response) => {
    // Set game settings
    getGameSettings();

    // Set headers
    headers.username = !response.isLoggedIn ? undefined : response.username;
    headers.password = !response.isLoggedIn ? undefined : response.password;

    // Show login button and enable it
    $(`#login-button`).attr(`disabled`, false).show();

    /* If the user is not logged in */
    if (headers.username === undefined) {
        // When a user clicks to login button, opens the login menu
        $(`#login-button`).on(`click`, () => {
            $(`#login-box`).modal(`show`);
        });

        // If register menu button is clicked, close login menu and open register menu
        $(`#open-register`).on(`click`, () => {
            $(`#login-box`).modal(`hide`);
            $(`#register-box`).modal(`show`);
            $(`#register-error`).addClass(`hidden`);
        });

        // If login menu button is clicked, close register menu and open logub menu
        $(`#open-login`).on(`click`, () => {
            $(`#register-box`).modal(`hide`);
            $(`#login-box`).modal(`show`);
            $(`#login-error`).addClass(`hidden`);
        });

        // If the user clicks the reset password link in the login modal
        $(`#open-reset-password`).on(`click`, () => {
            $(`#login-box`).modal(`hide`);
            $(`#reset-password-box`).modal(`show`);
            $(`#reset-password-error`).addClass(`hidden`);
        });

        // If a user submits a login
        $(`#submit-login`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-login`).attr(`disabled`, true);

            $(`#login-error`).addClass(`hidden`);
            $.ajax({
                type: `post`,
                url: `/login`,
                data: $(`#login-form`).serialize()
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-login`).attr(`disabled`, false);
                    $(`#login-error`).removeClass(`hidden`);
                    $(`#login-err-msg`).text(res.errors);
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    $(`#submit-login`).attr(`disabled`, false);
                    $(`#login-box`).modal(`hide`);
                    window.location.reload();
                    return true;
                }
            });
        });

        // If a user attempts to register
        $(`#submit-register`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-register`).attr(`disabled`, true);

            $(`#register-error`).addClass(`hidden`);

            $.ajax({
                type: `post`,
                url: `/register`,
                data: $(`#register-form`).serialize()
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-register`).attr(`disabled`, false);
                    $(`#register-error`).removeClass(`hidden`);
                    $(`#register-err-msg`).text(res.errors);
                    grecaptcha.reset();
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    $(`#submit-register`).attr(`disabled`, false);
                    $(`#register-box`).modal(`hide`);
                    if (navigator.credentials) {
                        let credential = new PasswordCredential($(`#register-form`));
                        navigator.credentials.store(credential);
                    }
                    window.location.reload();
                    return true;
                }
            });
        });
    }

    /* If the user is logged in */
    if (headers.username !== undefined) {
        // Set cookies
        headers.setCookie(`username`, response.username, 1);
        headers.setCookie(`password`, response.password, 1);

        // Show personalized login button
        $(`#play-button`).html(`Play as <b>${headers.username}</b>`);

        // Add logout
        addLogout();

        // Set login/register button to be used to open account settings
        $(`#login-button`).html(`Account Settings`);

        // Show player customization button
        $(`#customization-button`).prop(`title`, ``).prop(`disabled`, false).prop(`hidden`, false);

        // If the login button is clicked open the manage account modal
        $(`#login-button`).on(`click`, () => {
            $(`#manage-account-box`).modal(`show`);
        });

        // If the username edit button is clicked, show username edit form and hide all other menus in account settings
        $(`#username-edit-button`).on(`click`, () => {
            $(`#change-username`).removeClass(`hidden`);
            $(`#change-username-error`).addClass(`hidden`);
            $(`#change-username-button-container`).addClass(`hidden`);

            $(`#change-email`).addClass(`hidden`);
            $(`#change-email-error`).addClass(`hidden`);
            $(`#change-email-button-container`).removeClass(`hidden`);

            $(`#change-account-game-settings`).addClass(`hidden`);
            $(`#change-account-game-settings-error`).addClass(`hidden`);
            $(`#change-account-game-settings-button-container`).removeClass(`hidden`);

            $(`#change-default-krew-name`).addClass(`hidden`);
            $(`#change-default-krew-name-error`).addClass(`hidden`);
            $(`#change-default-krew-name-button-container`).removeClass(`hidden`);
        });

        // If the email edit button is clicked, show email edit form and hide all other menus in account settings
        $(`#email-edit-button`).on(`click`, () => {
            $(`#change-username`).addClass(`hidden`);
            $(`#change-username-error`).addClass(`hidden`);
            $(`#change-username-button-container`).removeClass(`hidden`);

            $(`#change-email`).removeClass(`hidden`);
            $(`#change-email-error`).addClass(`hidden`);
            $(`#change-email-button-container`).addClass(`hidden`);

            $(`#change-account-game-settings`).addClass(`hidden`);
            $(`#change-account-game-settings-error`).addClass(`hidden`);
            $(`#change-account-game-settings-button-container`).removeClass(`hidden`);

            $(`#change-default-krew-name`).addClass(`hidden`);
            $(`#change-default-krew-name-error`).addClass(`hidden`);
            $(`#change-default-krew-name-button-container`).removeClass(`hidden`);
        });

        // If the account game settings edit button is clicked, show account game settings edit form and hide all other menus in account settings
        $(`#change-account-game-settings-button`).on(`click`, () => {
            $(`#change-username`).addClass(`hidden`);
            $(`#change-username-error`).addClass(`hidden`);
            $(`#change-username-button-container`).removeClass(`hidden`);

            $(`#change-email`).addClass(`hidden`);
            $(`#change-email-error`).addClass(`hidden`);
            $(`#change-email-button-container`).removeClass(`hidden`);

            $(`#change-account-game-settings`).removeClass(`hidden`);
            $(`#change-account-game-settings-error`).addClass(`hidden`);
            $(`#change-account-game-settings-button-container`).addClass(`hidden`);

            $(`#change-default-krew-name`).addClass(`hidden`);
            $(`#change-default-krew-name-error`).addClass(`hidden`);
            $(`#change-default-krew-name-button-container`).removeClass(`hidden`);
        });

        // If the default krew name edit button is clicked, show default krew name edit form and hide all other menus in account settings
        $(`#change-default-krew-name-button`).on(`click`, () => {
            $(`#change-username`).addClass(`hidden`);
            $(`#change-username-error`).addClass(`hidden`);
            $(`#change-username-button-container`).removeClass(`hidden`);

            $(`#change-email`).addClass(`hidden`);
            $(`#change-email-error`).addClass(`hidden`);
            $(`#change-email-button-container`).removeClass(`hidden`);

            $(`#change-account-game-settings`).addClass(`hidden`);
            $(`#change-account-game-settings-error`).addClass(`hidden`);
            $(`#change-account-game-settings-button-container`).removeClass(`hidden`);

            $(`#change-default-krew-name`).removeClass(`hidden`);
            $(`#change-default-krew-name-error`).addClass(`hidden`);
            $(`#change-default-krew-name-button-container`).addClass(`hidden`);
        });

        // If the player customization button on the center modal is clicked
        $(`#customization-button`).on(`click`, () => {
            $(`#customization-box`).modal(`show`);
            $(`#customization-error`).addClass(`hidden`);
        });

        // if the player customization button in account settings is clicked
        $(`#customization-button-2`).on(`click`, () => {
            $(`#manage-account-box`).modal(`hide`);
            $(`#customization-box`).modal(`show`);
            $(`#customization-error`).addClass(`hidden`);
        });

        // If the reset password button is clicked
        $(`#reset-password-button`).on(`click`, () => {
            $(`#manage-account-box`).modal(`hide`);
            $(`#reset-password-box`).modal(`show`);
            $(`#reset-password-error`).addClass(`hidden`);
        });

        // If the delete account button is clicked
        $(`#delete-account-button`).on(`click`, () => {
            $(`#manage-account-box`).modal(`hide`);
            $(`#delete-account-box`).modal(`show`);
            $(`#delete-account-error`).addClass(`hidden`);
        });

        // If a user submits changing their username
        $(`#submit-change-username`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-change-username`).attr(`disabled`, true);

            $(`#change-username-error`).addClass(`hidden`);
            $.ajax({
                type: `post`,
                url: `/change_username`,
                data: $(`#change-username-form`).serialize()
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-change-username`).attr(`disabled`, false);
                    $(`#change-username-error`).removeClass(`hidden`);
                    $(`#change-username-err-msg`).text(res.errors);
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    window.location.reload();
                    return true;
                }
            });
        });

        // If a user submits changing their email
        $(`#submit-change-email`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-change-email`).attr(`disabled`, true);

            $(`#change-email-error`).addClass(`hidden`);
            $.ajax({
                type: `post`,
                url: `/change_email`,
                data: $(`#change-email-form`).serialize()
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-change-email`).attr(`disabled`, false);
                    $(`#change-email-error`).removeClass(`hidden`);
                    $(`#change-email-err-msg`).text(res.errors);
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    window.location.reload();
                    return true;
                }
            });
        });

        // If a user submits changing their account game settings
        $(`#submit-change-account-game-settings`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-change-account-game-settings`).attr(`disabled`, true);

            $(`#change-account-game-settings-error`).addClass(`hidden`);
            $.ajax({
                type: `post`,
                url: `/change_account_game_settings`,
                data: $(`#change-account-game-settings-form`).serialize()
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-change-account-game-settings`).attr(`disabled`, false);
                    $(`#change-account-game-settings-error`).removeClass(`hidden`);
                    $(`#change-account-game-settings-err-msg`).text(res.errors);
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    window.location.reload();
                    return true;
                }
            });
        });

        // If a user submits changing their default krew name
        $(`#submit-change-default-krew-name`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-change-default-krew-name`).attr(`disabled`, true);

            $(`#change-default-krew-name-error`).addClass(`hidden`);
            $.ajax({
                type: `post`,
                url: `/change_default_krew_name`,
                data: $(`#change-default-krew-name-form`).serialize()
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-change-default-krew-name`).attr(`disabled`, false);
                    $(`#change-default-krew-name-error`).removeClass(`hidden`);
                    $(`#change-default-krew-name-err-msg`).text(res.errors);
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    window.location.reload();
                    return true;
                }
            });
        });

        // Change model previews in player customization menu
        let currentHatModel = 0;
        $(`#hat-model-left`).on(`click`, () => {
            currentHatModel--;
            if (currentHatModel < 0) currentHatModel = 2;
            $(`#hat-model-image`).attr(`src`, `/assets/img/hats/hat${currentHatModel}.png`);
        });
        $(`#hat-model-right`).on(`click`, () => {
            currentHatModel++;
            if (currentHatModel > 2) currentHatModel = 0;
            $(`#hat-model-image`).attr(`src`, `/assets/img/hats/hat${currentHatModel}.png`);
        });

        let currentPlayerModel = 0;
        $(`#player-model-left`).on(`click`, () => {
            currentPlayerModel--;
            if (currentPlayerModel < 0) currentPlayerModel = 6;
            $(`#player-model-image`).attr(`src`, `/assets/img/dogs/player${currentPlayerModel}.png`);
        });
        $(`#player-model-right`).on(`click`, () => {
            currentPlayerModel++;
            if (currentPlayerModel > 6) currentPlayerModel = 0;
            $(`#player-model-image`).attr(`src`, `/assets/img/dogs/player${currentPlayerModel}.png`);
        });

        // If a user submits the player customization form
        $(`#submit-customization`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-customization`).attr(`disabled`, true);

            $(`#customization-error`).addClass(`hidden`);

            $.ajax({
                type: `post`,
                url: `/customization`,
                data: {
                    playerModel: currentPlayerModel.toString(),
                    hatModel: currentHatModel.toString()
                }
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-customization`).attr(`disabled`, false);
                    $(`#customization-error`).removeClass(`hidden`);
                    $(`#customization-err-msg`).text(res.errors);
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    window.location.reload();
                    return true;
                }
            });
        });

        // If a user submits the delete account form
        $(`#submit-delete-account`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-delete-account`).attr(`disabled`, true);

            $(`#delete-account-error`).addClass(`hidden`);
            $.ajax({
                type: `post`,
                url: `/delete_account`,
                data: $(`#delete-account-form`).serialize()
            }).then((res) => {
                // If there is an error, return an error
                if (res.errors) {
                    $(`#submit-delete-account`).attr(`disabled`, false);
                    $(`#delete-account-error`).removeClass(`hidden`);
                    $(`#delete-account-err-msg`).text(res.errors);
                    return false;
                }
                // If the request is successful, close the menu
                if (res.success) {
                    window.location.reload();
                }
            });
        });
    }

    // If a user submits the reset password form
    $(`#submit-reset-password`).on(`click`, (e) => {
        e.preventDefault();

        $(`#submit-reset-password`).attr(`disabled`, true);

        $(`#reset-password-error`).addClass(`hidden`);
        $.ajax({
            type: `post`,
            url: `/reset_password`,
            data: $(`#reset-password-form`).serialize()
        }).then((res) => {
            // If there is an error, return an error
            if (res.errors) {
                $(`#submit-reset-password`).attr(`disabled`, false);
                $(`#reset-password-error`).removeClass(`hidden`);
                $(`#reset-password-err-msg`).text(res.errors);
                return false;
            }
            // If the request is successful, close the menu
            if (res.success) {
                window.location.reload();
                return true;
            }
        });
    });
});

/**
 * Function set game settings based off of account game settings
 * If the user is not logged in, it sets the game settings to default values
 */
let getGameSettings = () => {
    $.ajax({
        url: `/account_game_settings`,
        type: `GET`,
        success: (res) => {
            if (res.fpMode) {
                $(`#account-fp-mode-button`).prop(`checked`, true);
                $(`#fp-mode-button`).prop(`checked`, true);
            } else {
                $(`#account-fp-mode-button`).prop(`checked`, false);
                $(`#fp-mode-button`).prop(`checked`, false);
            }

            $(`#account-fov-control`).val(res.fov != undefined ? res.fov : 10);
            $(`#fov-control`).val(res.fov != undefined ? res.fov : 10);

            $(`#account-music-control`).val(res.musicVolume != undefined ? res.musicVolume : 50);
            $(`#music-control`).val(res.musicVolume != undefined ? res.musicVolume : 50);
            $(`#account-sfx-control`).val(res.sfxVolume != undefined ? res.sfxVolume : 50);
            $(`#sfx-control`).val(res.sfxVolume != undefined ? res.sfxVolume : 50);

            if (res.viewSails) {
                $(`#account-view-sails-button`).prop(`checked`, true);
                $(`#view-sails-button`).prop(`checked`, true);
                viewSails = true;
            } else {
                $(`#account-view-sails-button`).prop(`checked`, false);
                $(`#view-sails-button`).prop(`checked`, false);
                viewSails = false;
            }

            $(`#account-quality-list`).val(res.qualityMode != undefined ? res.qualityMode : 2);
            $(`#quality-list`).val(res.qualityMode != undefined ? res.qualityMode : 2);

            if (!res.errors) $(`#account-game-settings-save-notice`).removeClass(`hidden`);

            if ($(`#fp-mode-button`).is(`:checked`)) $(`#fp-mode-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`FP Camera (Enabled)`);
            else $(`#fp-mode-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`FP Camera (Disabled)`);

            if ($(`#view-sails-button`).is(`:checked`)) $(`#view-sails-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`View Sails (Enabled)`);
            else $(`#view-sails-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`View Sails (Disabled)`);

            fov = document.getElementById(`fov-control`).value >= 10 && document.getElementById(`fov-control`).value <= 100 ? document.getElementById(`fov-control`).value / 10 : 1;
            audio.updateMusicVolume();
            updateQuality();
        },
        error: (res) => {
            $(`#account-fp-mode-button`).prop(`checked`, false);
            $(`#fp-mode-button`).prop(`checked`, false);

            $(`#account-fov-control`).val(10);
            $(`#fov-control`).val(10);

            $(`#account-music-control`).val(50);
            $(`#music-control`).val(50);
            $(`#account-sfx-control`).val(50);
            $(`#sfx-control`).val(50);

            $(`#account-quality-list`).val(2);
            $(`#quality-list`).val(2);

            $(`#account-view-sails-button`).prop(`checked`, false);
            $(`#view-sails-button`).prop(`checked`, false);
            viewSails = false;

            if ($(`#fp-mode-button`).is(`:checked`)) $(`#fp-mode-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`FP Camera (Enabled)`);
            else $(`#fp-mode-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`FP Camera (Disabled)`);

            if ($(`#view-sails-button`).is(`:checked`)) $(`#view-sails-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`View Sails (Enabled)`);
            else $(`#view-sails-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`View Sails (Disabled)`);

            fov = document.getElementById(`fov-control`).value >= 10 && document.getElementById(`fov-control`).value <= 100 ? document.getElementById(`fov-control`).value / 10 : 1;
            audio.updateMusicVolume();
            updateQuality();
        }
    });
};

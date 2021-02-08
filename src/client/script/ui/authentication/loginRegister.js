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
    headers.username = !response.isLoggedIn ? undefined : response.username;
    headers.password = !response.isLoggedIn ? undefined : response.password;
    $(`#login-button`).attr(`disabled`, false).show();

    if (headers.username === undefined) {
        // When a user opens the login menu
        $(`#login-button`).on(`click`, () => {
            // Show login box
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
    } else {
        headers.setCookie(`username`, response.username, 1);
        headers.setCookie(`password`, response.password, 1);

        // Show personalized login button
        playButton.html(`Play as <b>${headers.username}</b>`);
        $(`#login-button`).html(`Account Settings`);
        addLogout();
        let currentModel = 0;

        $(`#login-button`).on(`click`, () => {
            $(`#manage-account-box`).modal(`show`);

            $.ajax({
                url: `/account_game_settings`,
                type: `GET`,
                success: function (res) {
                    if (!res.errors) {
                        if (res.fpMode) {
                            $(`#account-fp-mode-button`).prop(`checked`, true);
                        } else {
                            $(`#account-fp-mode-button`).prop(`checked`, false);
                        }
                        $(`#account-music-control`).val(res.musicVolume);
                        $(`#account-sfx-control`).val(res.sfxVolume);
                        $(`#account-quality-list`).val(res.qualityMode);
                    } else {
                        $(`#account-fp-mode-button`).prop(`checked`, false);
                        $(`#account-music-control`).val(50);
                        $(`#account-sfx-control`).val(50);
                        $(`#account-quality-list`).val(2);
                    }
                },
                error: function (res) {
                    $(`#account-fp-mode-button`).prop(`checked`, false);
                    $(`#account-music-control`).val(50);
                    $(`#account-sfx-control`).val(50);
                    $(`#account-quality-list`).val(2);
                }
            });
        });

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

        $(`#customization-button`).on(`click`, () => {
            $(`#manage-account-box`).modal(`hide`);
            $(`#customization-box`).modal(`show`);
            $(`#customization-error`).addClass(`hidden`);
        });

        $(`#model-left`).on(`click`, () => {
            currentModel--;
            if (currentModel < 0) currentModel = 4;
            $(`#model-image`).attr(`src`, `/assets/img/dogs/model${currentModel}.png`);
        });

        $(`#model-right`).on(`click`, () => {
            currentModel++;
            if (currentModel > 4) currentModel = 0;
            $(`#model-image`).attr(`src`, `/assets/img/dogs/model${currentModel}.png`);
        });

        $(`#submit-customization`).on(`click`, (e) => {
            e.preventDefault();

            $(`#submit-customization`).attr(`disabled`, true);

            $(`#customization-error`).addClass(`hidden`);

            $.ajax({
                type: `post`,
                url: `/customization`,
                data: {
                    model: currentModel.toString()
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

        $(`#reset-password-button`).on(`click`, () => {
            $(`#manage-account-box`).modal(`hide`);
            $(`#reset-password-box`).modal(`show`);
            $(`#reset-password-error`).addClass(`hidden`);
        });

        $(`#delete-account-button`).on(`click`, () => {
            $(`#manage-account-box`).modal(`hide`);
            $(`#delete-account-box`).modal(`show`);
            $(`#delete-account-error`).addClass(`hidden`);
        });

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
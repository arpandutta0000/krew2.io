let notifications = {
    /**
     * Shows a center message
     *
     * @param {string} text The text to be shown
     * @param {number} typeId The type of notification (1 = Danger, 3 = Success, 4 = Info, undefined = Info)
     * @param {number} time The time for the message to stay on screen in milliseconds. Defaults to 4 seconds if undefined
     */
    showCenterMessage: function (text, typeId, time) {
        let type = ``;
        switch (typeId) {
            case undefined: {
                type = `info`;
                break;
            }
            case 1: {
                type = `danger`;
                break;
            }
            case 3: {
                type = `success`;
                break;
            }
            case 4: {
                type = `info`;
                break;
            }
        }

        GrowlNotification.notify({
            description: text,
            closeTimeout: time === undefined ? 4000 : time,
            position: `top-center`,
            animationOpen: `slide-in`,
            animationClose: `fade-out`,
            type: type,
            imageVisible: true,
            imageCustom: `../assets/img/notifications/${type}-new.png`
        });
    },

    /**
     * Shows an admin message (center message)
     *
     * @param {string} text The text to be shown
     */
    showAdminMessage: function (text) {
        GrowlNotification.notify({
            title: `Message from admin:`,
            description: text,
            closeTimeout: 8000,
            position: `top-center`,
            animationOpen: `slide-in`,
            animationClose: `fade-out`,
            type: `info`,
            imageVisible: true,
            imageCustom: `../assets/img/notifications/info-new.png`
        });
    },

    /**
     * Shows a kill message
     *
     * @param {string} text The text to be shown
     */
    showKillMessage: function (text) {
        GrowlNotification.notify({
            description: text,
            closeTimeout: 5000,
            position: `top-right`,
            animationOpen: `slide-in`,
            animationClose: `fade-out`,
            type: `danger`,
            imageVisible: true,
            imageCustom: `../assets/img/tools/cannon32x32.png`
        });
    },

    /**
     * Shows a damage message
     *
     * @param {string} text The text to be shown
     * @param {number} typeId The type of damage to be shown (1 = Ship damage, 2 = Shooter damage, undefined = Ship damage)
     */
    showDamageMessage: function (text, typeId) {
        let color;
        switch (typeId) {
            case undefined:
            case 1: {
                color = `#a94442`;
                break;
            } // Ship damage
            case 2: {
                color = `#3c763d`;
                break;
            } // Shooter damage
        }
        let msgInterval = 3000;
        let textDiv = $(`<div/>`, {
            class: `text-xs-center`,
            text: text,
            style: `color: ${color}`
        }).delay(msgInterval).fadeOut(`slow`);

        if ($(`#center-div div`).length > 3) $(`#center-div div:last-child`).remove();

        $(`#center-div`).prepend(textDiv);
    }
};

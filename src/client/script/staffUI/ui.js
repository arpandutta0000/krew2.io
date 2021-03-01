/**
 * UI Object
 */
let ui = {
    /**
     * Initiate listeners for staff UI
     */
    initListeners: () => {
        $(`#splash-modal`).modal({
            backdrop: `static`,
            keyboard: false
        });

        /* Show splash modal */
        $(`#splash-modal`).modal(`show`);

        $(`#connect-button`).on(`click`, () => {
            /* Connect to a server */
            initConnection($(`#server-list`).val());
        });

        $(`#submit-warn`).on(`click`, () => {
            socket.emit(`warn`, {
                user: entities[$(`#submit-warn`).data().playerId].name,
                reason: $(`#warn-reason`).val() !== undefined ? $(`#warn-reason`).val() : ``
            });
            $(`#warn-modal`).modal(`hide`);
        });

        $(`#submit-unmute`).on(`click`, () => {
            socket.emit(`unmute`, {
                user: entities[$(`#submit-unmute`).data().playerId].name
            });
            $(`#unmute-modal`).modal(`hide`);
        });

        $(`#submit-mute`).on(`click`, () => {
            socket.emit(`mute`, {
                user: entities[$(`#submit-mute`).data().playerId].name,
                reason: $(`#mute-reason`).val() !== undefined ? $(`#mute-reason`).val() : ``
            });
            $(`#mute-modal`).modal(`hide`);
        });

        $(`#submit-kick`).on(`click`, () => {
            socket.emit(`kick`, {
                user: entities[$(`#submit-kick`).data().playerId].name,
                reason: $(`#kick-reason`).val() !== undefined ? $(`#kick-reason`).val() : ``
            });
            $(`#kick-modal`).modal(`hide`);
        });

        $(`#submit-ban`).on(`click`, () => {
            socket.emit(`ban`, {
                user: entities[$(`#submit-ban`).data().playerId].name,
                reason: $(`#ban-reason`).val() !== undefined ? $(`#ban-reason`).val() : ``
            });
            $(`#ban-modal`).modal(`hide`);
        });
    },

    /**
     * Method to update player data table
     */
    updatePlayerData: () => {
        $(`#data-table`).find(`tr:gt(0)`).remove();

        let players = [];
        for (let e in entities) {
            if (entities[e].netType === 0) players.push(entities[e]);
        }

        players.sort((a, b) => a.name.localeCompare(b.name))

        for (let player of players) ui.addPlayerEntry(player);

        $(`.action-warn`).each(function () {
            let playerId = $(this).attr(`id`).replace(`warn-`, ``);
            if (entities[playerId] === undefined) return;
            $(this).on(`click`, () => {
                $(`#warn-player-heading`).text(`Warn ${entities[playerId].name}`);
                $(`#warn-reason`).val(``);
                $(`#submit-warn`).data(`playerId`, playerId);
                $(`#warn-modal`).modal(`show`);
            })
        });

        $(`.action-unmute`).each(function () {
            let playerId = $(this).attr(`id`).replace(`unmute-`, ``);
            if (entities[playerId] === undefined) return;
            $(this).on(`click`, () => {
                $(`#unmute-player-heading`).text(`Unmute ${entities[playerId].name}`);
                $(`#submit-unmute`).data(`playerId`, playerId);
                $(`#unmute-modal`).modal(`show`);
            })
        });

        $(`.action-mute`).each(function () {
            let playerId = $(this).attr(`id`).replace(`mute-`, ``);
            if (entities[playerId] === undefined) return;
            $(this).on(`click`, () => {
                $(`#mute-player-heading`).text(`Mute ${entities[playerId].name}`);
                $(`#mute-reason`).val(``);
                $(`#submit-mute`).data(`playerId`, playerId);
                $(`#mute-modal`).modal(`show`);
            })
        });

        $(`.action-kick`).each(function () {
            let playerId = $(this).attr(`id`).replace(`kick-`, ``);
            if (entities[playerId] === undefined) return;
            $(this).on(`click`, () => {
                $(`#kick-player-heading`).text(`Kick ${entities[playerId].name}`);
                $(`#kick-reason`).val(``);
                $(`#submit-kick`).data(`playerId`, playerId);
                $(`#kick-modal`).modal(`show`);
            })
        });

        $(`.action-ban`).each(function () {
            let playerId = $(this).attr(`id`).replace(`ban-`, ``);
            if (entities[playerId] === undefined) return;
            $(this).on(`click`, () => {
                $(`#ban-player-heading`).text(`Ban ${entities[playerId].name}`);
                $(`#ban-reason`).val(``);
                $(`#submit-ban`).data(`playerId`, playerId);
                $(`#ban-modal`).modal(`show`);
            })
        });
    },

    /**
     * Create buttons for staff actions
     * 
     * @param {string} id ID of the player
     */
    playerDataStaffActions: (id) => {
        return `
        <div id="warn-${id}" class="btn btn-secondary btn-sm action-warn">
            <i class="icofont icofont-warning"></i>
        </div>
        <div id="unmute-${id}" class="btn btn-secondary btn-sm action-unmute">
            <i class="icofont icofont-mic"></i>
        </div>
        <div id="mute-${id}" class="btn btn-secondary btn-sm action-mute">
            <i class="icofont icofont-mic-mute"></i>
        </div>
        <div id="kick-${id}" class="btn btn-secondary btn-sm action-kick">
            <i class="icofont icofont-boot"></i>
        </div>
        <div id="ban-${id}" class="btn btn-secondary btn-sm action-ban">
            <i class="icofont icofont-hammer-alt"></i>
        </div>
        `
    },

    /**
     * Add a player entry to the table
     * 
     * @param {object} player Player object
     */
    addPlayerEntry: (player) => {
        if (player === undefined || player.parent === undefined || entities[player.parent.captainId] === undefined) return;

        let shipState = player.parent.shipState === -1 ? `Spawning` : player.parent.shipState === 0 ? `Sailing` : player.parent.shipState === 1 ? `Docking` : player.parent.shipState === 2 ? `Finished Docking` : player.parent.shipState === 3 ? `Anchored` : `Departing`;

        let tableContent = `
        <tr>
        <td>${player.name}</td>
        <td>${player.clan !== undefined ? `[${player.clan}]` : `No Clan`}</td>
        <td>${player.gold}</td>
        <td><img style="max-width: 32px;" src="${player.activeWeapon === 0 ? `/assets/img/tools/cannon.png` : player.activeWeapon === 1 ? `/assets/img/tools/fishingrod.png` : `/assets/img/tools/spyglass.png`}"></td>
        <td>${player.level}</td>
        <td>${player.parent.krewName}</td>
        <td>${player.parent.captainId === player.id ? `Yes` : `No (${entities[player.parent.captainId].name})`}</td>
        <td>${player.parent.gold}</td>
        <td>${player.parent.boatName} ${player.parent.image !== undefined ? player.parent.image : ``}</td>
        <td>${player.parent.hp} / ${player.parent.maxHp}</td>
        <td>${player.parent.krewCount} / ${player.parent.maxKrewCapacity}</td>
        <td>${shipState}</td>
        <td>${player.parent.position.x} / ${player.parent.position.y} / ${player.parent.position.z}</td>
        <td>${ui.playerDataStaffActions(player.id)}</td>
        </tr>`;

        $(`#data-table`).append(tableContent);
    },

    /**
     * Method to update the server list
     */
    updateServerList: () => {
        $.ajax({
            url: `${window.location.href.replace(/\?.*/, ``).replace(/#.*/, ``).replace(/\/$/, ``).replace(`/staff`, ``)}/get_servers`,
            data: {
                gameId: `59a714c837cc44805415df18`
            },
            dataType: `jsonp`,
            type: `GET`,
            success: function (servers) {
                ui.servers = servers;

                let serverSelected = false;
                $(`#server-list`).html(``);

                let i = 0;
                let pid;
                for (pid in servers) {
                    let server = servers[pid];

                    i++;
                    let $option = $(`<option/>`, {
                        html: `Server ${i} (${server.playerCount}/${server.maxPlayerCount})`,
                        value: pid
                    });

                    $(`#server-list`).append($option);
                    if (!serverSelected && server.playerCount < server.maxPlayerCount) {
                        $(`#server-list`).val(pid);
                        serverSelected = true;
                    }
                }
            }
        });
    }
};

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
    }
};
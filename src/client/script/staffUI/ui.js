/**
 * UI Object
 */
let ui = {
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
    },

    updateTables: () => {
        $(`#player-table`).find(`tr:gt(0)`).remove();
        $(`#boat-table`).find(`tr:gt(0)`).remove();

        for (let e in entities) {
            if (entities[e].netType === 0) ui.addPlayerEntry(entities[e]);
            else if (entities[e].netType === 1) ui.addBoatEntry(entities[e]);
        }
    },

    addPlayerEntry: (player) => {
        if (player === undefined || player.parent === undefined) return;
        let activeWeapon = `<img style="max-width: 32px;" src="${player.activeWeapon === 0 ? `/assets/img/tools/cannon.png` : player.activeWeapon === 1 ? `/assets/img/tools/fishingrod.png` : `/assets/img/tools/spyglass.png`}">`
        let tableContent = `<tr><td class="player-entry">${player.name}</td><td>${player.clan !== undefined ? `[${player.clan}]` : `No Clan`}</td><td>${player.gold}</td><td>${player.level}</td><td>${activeWeapon}</td><td>${player.parent.krewName}</td><td>${player.parent.captainId === player.id ? `Yes` : `No`}</td><td>Temp</td></tr>`;
        $(`#player-table`).append(tableContent);
    },

    addBoatEntry: (boat) => {
        if (boat === undefined || entities[boat.captainId] == undefined) return;
        let tableContent = `<tr><td class="boat-entry">${boat.krewName}</td><td>${boat.clan !== undefined ? `[${boat.clan}]` : `No Clan`}</td><td>${entities[boat.captainId].name}</td><td>${boat.gold}</td>><td>Temp</td></tr>`;
        $(`#boat-table`).append(tableContent);
    },

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
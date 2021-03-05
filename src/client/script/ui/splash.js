let splash = {
    /**
     * Shows or hides the loading wheel
     *
     * @param {string} event Hide or show
     */
    loadingWheel: (event) => {
        if (event === `show`) {
            $(`#loading-wheel`).show();
        } else {
            $(`#loading-wheel`).hide();
        }
    },

    /**
     * Sets player spawn based off of selection
     */
    setSpawnPlace: () => {
        let spawn = $(`#spawn-selection`).val();
        if (spawn === `sea` || spawn === `krew`) {
            audio.musicPlaying = `ocean-music`;
            audio.playAudioFile(true, false, 1, `ocean-music`);
        } else {
            audio.musicPlaying = `island-music`;
            audio.playAudioFile(true, false, 1, `island-music`);
        }
        return spawn;
    },

    /**
     * Update server list
     */
    updateServerList: () => {
        $.ajax({
            url: `${window.location.href.replace(/\?.*/, ``).replace(/#.*/, ``).replace(/\/$/, ``)}/get_servers`,
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

                // if client is using invite link, automatically assign server
                let params = getUrlVars();
                if (params.sid) {
                    $(`#server-list`).val(params.sid);
                }
            }
        });
    },

    /**
     * Create wall of fame
     */
    createWallOfFame: () => {
        $.get(`api/wall_of_fame`, (data, status) => {
            if (status === `success`) {
                let tableContent = ``;
                for (let p in data) {
                    let highscore = data[p].highscore;
                    let clan = data[p].clan !== `` ? `[${data[p].clan}]` : ``;
                    if (highscore >= 1000 && highscore.toString().length <= 6) {
                        highscore = `${highscore / 1000} K`;
                    } else if (highscore.toString().length >= 7) {
                        highscore = `${Math.floor(highscore / 1000) / 1000} M`;
                    }
                    if (p === 0) {
                        tableContent = `<tr><td class="rank">${parseInt(p) + 1}</td><td class="top-1">${data[p].playerName}</td><td class="top-1">${clan}</td><td class="top-1">${highscore}</td></tr>`;
                    } else if (p <= 2) {
                        tableContent = `<tr><td class="rank">${parseInt(p) + 1}</td><td class="top-2-3">${data[p].playerName}</td><td class="top-2-3">${clan}</td><td class="top-2-3">${highscore}</td></tr>`;
                    } else if (p <= 24) {
                        tableContent = `<tr><td class="rank">${parseInt(p) + 1}</td><td>${data[p].playerName}</td><td>${clan}</td><td>${highscore}</td></tr>`;
                    } else {
                        tableContent = `<tr class="top50" style="display:none"><td class="rank">${parseInt(p) + 1}</td><td>${data[p].playerName}</td><td>${clan}</td><td>${highscore}</td></tr>`;
                    }
                    $(`#wall-of-fame-table`).append(tableContent);
                }
            }
        });
    }
};

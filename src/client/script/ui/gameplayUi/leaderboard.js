/**
 * Updates the leaderboard
 *
 * @param {object} scores Player scores
 */
let updateLeaderboard = (scores) => {
    let players = scores.players;
    let boats = scores.boats;

    if (!myPlayer || !myPlayer.parent || !entities) {
        return;
    }

    if (entities) {
        myPlayer = entities[myPlayerId];
    }

    // set correct overall_kills / overall_cargo number
    if (scores.boats.length > 0) {
        for (let p in scores.boats) {
            if (!myPlayer.parent) return;
            if (scores.boats[p] && scores.boats[p].id === myPlayer.parent.id) {
                myPlayer.parent.overall_kills = scores.boats[p].ok;
                myPlayer.parent.overall_cargo = scores.boats[p].oc;
            }
        }
    }

    // Update the crew names
    boats.forEach((boat) => {
        if (entities[boat.id] !== undefined) {
            entities[boat.id].setName(boat.cN);
        }
    });

    // Get the remote boat properties
    let remoteBoat = boats.filter((boat) => {
        if (myPlayer.parent) {
            return boat.id === myPlayer.parent.id;
        }
    }).pop();

    if (myPlayer.parent && remoteBoat) {
        // Set if i am the leader of the boat and update the leaders ui
        ui.captainUiConfiguration.active = remoteBoat.cI === myPlayer.id;
        ui.updateCaptainUi();
        let cargoUsed = 0;
        for (let p in remoteBoat.players) {
            cargoUsed += remoteBoat.players[p].cargoUsed;
        }

        $(`.ship-cargo`).html(`${cargoUsed}/${boatTypes[myPlayer.parent.shipclassId].cargoSize}`);
        $(`.my-krew-name`).text(myPlayer.parent.crewName);
    } else {
        $(`.ship-cargo`).html(`/`);
        $(`.my-krew-name`).html(`Join a krew or buy a ship`).css(`fontSize`, 17);
    }

    /** ****************** Player score list start ********************/
    players.sort((a, b) => b.g - a.g);
    let playersListSortedByGold = players.slice(0, 15);
    let playerScoreIndex = 0;
    let playerScoreLength = playersListSortedByGold.length;
    let playercount = `${players.length} players`;
    let $playerScoreData = $(`<div id="player-leaderbord-data"/>`);
    let clan;

    if (myPlayer) {
        for (; playerScoreIndex < 15 && playerScoreIndex < playerScoreLength; playerScoreIndex++) {
            let killScore = playersListSortedByGold[playerScoreIndex].sS;
            let deathScore = playersListSortedByGold[playerScoreIndex].d;
            let playerLevel = playersListSortedByGold[playerScoreIndex].l;
            clan = (playersListSortedByGold[playerScoreIndex].c !== undefined && playersListSortedByGold[playerScoreIndex].c !== ``) ? `[${playersListSortedByGold[playerScoreIndex].c}]` : ``;
            let damageScore;
            if (playersListSortedByGold[playerScoreIndex].s >= 1050 && playersListSortedByGold[playerScoreIndex].s.length <= 6) {
                damageScore = `${Math.floor((playersListSortedByGold[playerScoreIndex].s - 50) / 1000)} K`;
            } else {
                damageScore = playersListSortedByGold[playerScoreIndex].s - 50;
            }
            let goldScore;
            if (playersListSortedByGold[playerScoreIndex].g >= 1000 && playersListSortedByGold[playerScoreIndex].g.toString().length <= 6) {
                goldScore = `${Math.floor(playersListSortedByGold[playerScoreIndex].g / 1000)} K`;
            } else if (playersListSortedByGold[playerScoreIndex].g.toString().length >= 7) {
                goldScore = `${Math.floor(playersListSortedByGold[playerScoreIndex].g / 1000) / 1000} M`;
            } else {
                goldScore = playersListSortedByGold[playerScoreIndex].g;
            }
            let playerEntry = $(
                `<div style="max-width: 100%; grid-column: 1;"${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` class="text-success"` : ``}>${playerScoreIndex + 1}.` + `</div>` +
                `<div style="grid-column: 2">` +
                `<span class="playerName${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` text-success"` : `"`}" style="margin-left:2px;font-size: 13px"></span>` +
                `</div>` +
                `<div style="grid-column: 3">` +
                `<span${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` class="text-success"` : ``}>${clan}</span>` +
                `</div>` +
                `<div style="grid-column: 4">` +
                `<span${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` class="text-success"` : ``}>${playerLevel}</span>` +
                `</div>` +
                `<div style="grid-column: 5">` +
                `<span${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` class="text-success"` : ``}>${killScore}</span>` +
                `</div>` +
                `<div style="grid-column: 6">` +
                `<span${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` class="text-success"` : ``}>${deathScore}</span>` +
                `</div>` +
                `<div style="grid-column: 7">` +
                `<span${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` class="text-success"` : ``}>${damageScore}</span>` +
                `</div>` +
                `<div style="grid-column: 8; text-align: right">` +
                `<span${playersListSortedByGold[playerScoreIndex].id === myPlayer.id ? ` class="text-success"` : ``}>${goldScore}</span>` +
                `</div>`
            );
            playerEntry.find(`.playerName`).text(playersListSortedByGold[playerScoreIndex].n);
            $playerScoreData.append(playerEntry);
        }
    }
    $(`#playerScoreData`).html($playerScoreData);
    $(`#player-count`).html(playercount);

    /** ****************** Player score list end ********************/

    /** ****************** Boats score list start ********************/
    scores.boats.sort((a, b) => b.g - a.g);

    let boatsListSortedByGold = scores.boats.slice(0, 10);
    let $leaderboard_data = $(`<div id="leaderboard-data-div"/>`);
    let scoreIndex = 0;
    let scoreLength = boatsListSortedByGold.length;
    let boatcount;

    if (myPlayer.parent) {
        for (; scoreIndex < 10 && scoreIndex < scoreLength; scoreIndex++) {
            boatcount = `${scores.boats.length} boats`;
            let killcount = boatsListSortedByGold[scoreIndex].ok;
            let tradecount = boatsListSortedByGold[scoreIndex].oc;
            clan = (boatsListSortedByGold[scoreIndex].c !== undefined && boatsListSortedByGold[scoreIndex].c !== ``) ? `[${boatsListSortedByGold[scoreIndex].c}]` : ``;
            let other_lvl = boatsListSortedByGold[scoreIndex].oql;
            let display_gold;
            if (boatsListSortedByGold[scoreIndex].g >= 1000 && boatsListSortedByGold[scoreIndex].g.toString().length <= 6) {
                display_gold = `${Math.floor(boatsListSortedByGold[scoreIndex].g / 1000)} K`;
            } else if (boatsListSortedByGold[scoreIndex].g.toString().length >= 7) {
                display_gold = `${Math.floor(boatsListSortedByGold[scoreIndex].g / 1000) / 1000} M`;
            } else {
                display_gold = boatsListSortedByGold[scoreIndex].g;
            }
            let entry = $(`<div${boatsListSortedByGold[scoreIndex].id === myPlayer.parent.id ? ` class="text-myself-color grid-left"` : ` class="grid-left"`}>${clan}</div>` +
                `<div style="max-width: 100%;"${
                    boatsListSortedByGold[scoreIndex].id === myPlayer.parent.id ? ` class="text-myself-color grid-middle"` : ` class="grid-middle"`}>` +
                `<span class='krewName' style='margin-left:2px;font-size: 13px'></span>` +
                `</div>` +
                `<div class="grid-middle">` +
                `<img src="/assets/img/medals/medal_${tradecount >= 150000 ? `gold` : tradecount >= 50000 ? `silver` : `bronze`}.png"${tradecount >= 12000 ? ` style="height: 17px"` : `style="height: 17px; display:none"`}>` +
                `<img src="/assets/img/medals/medal_${killcount >= 50 ? `gold` : killcount >= 20 ? `silver` : `bronze`}.png"${killcount >= 10 ? ` style="height: 17px"` : `style="height: 17px; display:none"`}>` +
                `<img src="/assets/img/medals/medal_${other_lvl === 3 ? `gold` : other_lvl === 2 ? `silver` : `bronze`}.png"${other_lvl > 0 ? ` style="height: 17px"` : `style="height: 17px; display:none"`}>` +
                `</div>` +
                `<div${boatsListSortedByGold[scoreIndex].id === myPlayer.parent.id ? ` class="text-myself-color grid-right"` : ` class="grid-right"`}>${display_gold}</div>`);
            entry.find(`.krewName`).text(boatsListSortedByGold[scoreIndex].cN);
            $leaderboard_data.append(entry);
        }
    }
    $(`#leaderboard-data`).html($leaderboard_data);
    $(`#boat-count`).html(boatcount);

    /** ****************** Boats score list end ********************/

    // sort the salary in descending order
    let playerListSortedByScore = [];
    let krewCount = 0;

    let $krewListDiv = $(`<div/>`);
    for (let p in players) {
        // Update the playee names (and clan tags)
        if (entities[players[p].id] !== undefined) {
            entities[players[p].id].setName(players[p].n);
        }

        if (myPlayer.parent) {
            // current player is a krew member! (or myPlayer)
            if (players[p].pI === myPlayer.parent.id) {
                playerListSortedByScore.push({
                    key: p,
                    value: players[p]
                });
            }
        }
    }

    playerListSortedByScore.sort((a, b) => a.value.s - b.value.s);

    for (let p in playerListSortedByScore) {
        let player = playerListSortedByScore[p].value;
        let playerName = player.n;

        let playerListItem = `<div class="player-list-item">`;
        // if the currently iterating player is myPlayer and I am captain, give me the power to kick and promote krew members
        playerListItem += `${playerName}${(player.id === myPlayerId) ? ` (ME)` : ``}`;
        if (player.id !== myPlayerId && myPlayer.isCaptain === true) {
            playerListItem += `<span class="btn btn-danger btn-kick-player float-sm-right" data-event="kick" data-id="${
                player.id}"><i data-event="kick" data-id="${player.id}" class="icofont icofont-delete"></i></span><span class="btn btn-warning btn-transfer-ship float-sm-right" data-event="transfer" data-id="${
                player.id}"><i data-event="transfer" data-id="${player.id}" class="icofont icofont-ship-wheel"></i></span>`;
        }

        playerListItem += `<span class="float-sm-right">`;
        if (player.id === myPlayerId && myPlayer.goods !== undefined) {
            for (let g in myPlayer.goods) {
                if (myPlayer.goods[g] > 0) {
                    playerListItem += ` ${myPlayer.goods[g]} ${g}`;
                }
            }
            playerListItem += `${` ` + `<i class="text-warning icofont icofont-cube"></i>` + ` `}${player.cU}`;
        } else {
            playerListItem += `${` ` + `<i class="text-warning icofont icofont-cube"></i>` + ` `}${player.cU}`;
        }
        playerListItem += `</span>`;
        playerListItem += `</div>`;

        let $playerDiv = $(playerListItem);

        // indicate captain
        if (myPlayer.parent.captainId === player.id) {
            $playerDiv.prepend($(`<span/>`, {
                class: `icofont icofont-ship-wheel text-warning`,
                text: ` `
            }));
        }

        // if it's me
        if (player.id === myPlayerId) {
            $playerDiv.addClass(`text-success`);
            ui.checkGoldDelta(player.g);
            myPlayer.clan = player.c;
            myPlayer.clanLeader = player.cL;
            myPlayer.clanOwner = player.cO;
            if (myPlayer.clanRequest !== player.cR) {
                myPlayer.clanRequest = player.cR;
                clanUi.setClanData(`force`);
            } else
                myPlayer.clanRequest = player.cR;

            myPlayer.gold = parseInt(player.g);
            if (myPlayer.gold >= goldMultiplier) {
                goldMultiplier *= 2;
            }

            myPlayer.score = parseInt(player.s);
            myPlayer.shipsSank = parseInt(player.sS);
            myPlayer.overall_cargo = parseInt(player.oc);
        }

        $krewListDiv.append($playerDiv);

        krewCount++;
    }

    if (myPlayer.parent) {
        updateShipStats({
            krewCount: krewCount
        });
    }

    $(`#krew-list`).html($krewListDiv);
};

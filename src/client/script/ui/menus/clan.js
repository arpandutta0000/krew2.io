let clanUi = {
    /**
     * Sets clan data
     *
     * @param {string} option Force an update
     */
    setClanData: function (option) {
        // if player has no clan and did not send join request yet
        if ((myPlayer.clan === undefined || myPlayer.clan === ``) && (!myPlayer.clanRequest || myPlayer.clanRequest === ``)) {
            $(`#clan-name`).text(`You don't have any clan yet`);
            $(`#yes-clan`).hide();
            $(`#request-clan`).hide();
            $(`#no-clan`).show();
            clanUi.hideAllClanErrors();
        }
        // if player has no clan but already sent a clan request
        else if (myPlayer.clanRequest && myPlayer.clanRequest !== ``) {
            $(`#clan-name`).text(`You already requested to join a clan`);
            $(`#yes-clan`).hide();
            $(`#no-clan`).hide();
            $(`#request-clan`).show();

            let requestTable = $(`#player-request-table`);
            let requestTableHeader = `<tr><th>Request</th><th>Action</th></tr>`;
            requestTable.html(requestTableHeader);
            let requestTableContent = `<tr><td>${myPlayer.clanRequest}</td><td><div data-tooltip="Cancel request" data-tooltip-location="bottom" style="display: inline-block"><i data-event="cancel-request" class="icofont icofont-close btn btn-danger clan-button"></i></div></td></tr>`;
            requestTable.append(requestTableContent);
        }
        // player already has a clan
        else {
            $(`#clan-name`).text(`Your clan: [${myPlayer.clan}]`);
            $(`#yes-clan`).show();
            $(`#request-clan`).hide();
            $(`#no-clan`).hide();
            $(`#request-clan-button`).hide();

            if (!$(`#yes-clan`).is(`:visible`) || option === `force`) {
                // get the clan data from the server
                socket.emit(`clan`, `get-data`, (callback) => {
                    // generate the list of all clan leaders and members
                    let clanTable = $(`#clan-table`);
                    let tableHeader = `<tr><th>Player name</th><th>Clan Role</th>${(myPlayer.clanLeader === true || myPlayer.clanOwner === true) ? `<th>Action</th>` : ``}</tr>`;
                    clanTable.html(tableHeader);
                    for (let cl in callback.clanLeader) {
                        let clanLeaderContent;
                        if (callback.clanLeader[cl] === callback.clanOwner) {
                            clanLeaderContent = `<tr><td>${callback.clanLeader[cl]}</td><td>Owner</td></tr>`;
                        } else {
                            clanLeaderContent = `<tr><td>${callback.clanLeader[cl]}</td><td>Leader</td>${myPlayer.clanOwner === true ? `<td><div data-tooltip="Kick from clan" data-tooltip-location="top" style="display: inline-block"><i data-event="kick-clan" data-id="${callback.clanLeader[cl]}" class="icofont icofont-delete btn btn-danger clan-button"></i></div></td>` : ``}</tr>`;
                        }
                        clanTable.append(clanLeaderContent);
                    }
                    for (let p in callback.clanMembers) {
                        if (!callback.clanLeader.includes(callback.clanMembers[p])) {
                            let clanMemberContent = `<tr><td>${callback.clanMembers[p]}</td><td>Member</td>${myPlayer.clanOwner === true ? `<td><div data-tooltip="Promote to clan leader" data-tooltip-location="top" style="display: inline-block"><i data-event="promote-clan" data-id="${callback.clanMembers[p]}" class="icofont icofont-arrow-up btn btn-success clan-button"></i></div><div data-tooltip="Kick from clan" data-tooltip-location="top" style="display: inline-block"><i data-event="kick-clan" data-id="${callback.clanMembers[p]}" class="icofont icofont-delete btn btn-danger clan-button"></i></div></td>` : myPlayer.clanLeader === true ? `<td><div data-tooltip="Kick from clan" data-tooltip-location="top" style="display: inline-block"><i data-event="kick-clan" data-id="${callback.clanMembers[p]}" class="icofont icofont-delete btn btn-danger clan-button"></i></div></td>` : ``}</tr>`;
                            clanTable.append(clanMemberContent);
                        }
                    }
                    // generate a list of clan requests, only if player is clan leader
                    let requestClanButton = $(`#request-clan-button`);
                    if (myPlayer.clanLeader === true || myPlayer.clanOwner === true) {
                        $(`#request-clan-button`).show();
                        requestClanButton.show();
                        if (callback.clanRequests) {
                            if (callback.clanRequests.length > 0) {
                                requestClanButton.removeClass(`btn-warning disabled`).addClass(`btn-success`).text(`View requests (${callback.clanRequests.length})`).attr(`disabled`, false);
                            } else if (callback.clanRequests.length === 0) {
                                requestClanButton.removeClass(`btn-success`).addClass(`btn-warning disabled`).text(`View requests (${callback.clanRequests.length})`).prop(`disabled`, true);
                            }
                            let clanRequestTable = $(`#clan-request-table`);
                            let requestTableHeader = `<tr><th>Player name</th><th>Action</th></tr>`;
                            clanRequestTable.html(requestTableHeader);

                            for (let r in callback.clanRequests) {
                                let clanRequestContent = `<tr><td>${callback.clanRequests[r]}<td><div data-tooltip="Accept request" data-tooltip-location="bottom" style="display: inline-block"><i data-event="accept-request" data-id="${callback.clanRequests[r]}" class="icofont icofont-check btn btn-success clan-button"></i></div><div data-tooltip="Reject request" data-tooltip-location="bottom" style="display: inline-block"><i data-event="decline-request" data-id="${callback.clanRequests[r]}" class="icofont icofont-close btn btn-danger clan-button"></i></div></td></tr>`;
                                clanRequestTable.append(clanRequestContent);
                            }
                        }
                    }
                });
            }
        }
    },

    /**
     * Hides all clan errors
     */
    hideAllClanErrors: function () {
        $(`#errorInput`).hide();
        $(`#errorLength`).hide();
        $(`#error404`).hide();
        $(`#errorExists`).hide();
        $(`#errorUndefined`).hide();
        $(`#errorUnauthorized`).hide();
    }
};

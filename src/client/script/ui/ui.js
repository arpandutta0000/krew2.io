let lastScore = 0;
let lastGold = 0;
let div = document.createElement(`div`);
let krewListUpdateManually = false;
let glowGoldTimeout = 0;
let markerMapCount = performance.now();
let goldMultiplier = 2000;
let loginButton = $(`#login-button`);
let playButton = $(`#play-button`);
let baseUrl = window.location.href.replace(/\?.*/, ``).replace(/#.*/, ``).replace(/\/$/, ``);

let uiSuggest = {
    setItems: () => {
        if (myPlayer && myPlayer.gold > 500 && (!myPlayer.ownsCannon || myPlayer.ownsFishingRod || (myPlayer.parent && myPlayer.parent.netType !== 1))) {}
    }
};

var ui = {
    isLoggedIn: false,
    hideSuggestionBox: false,
    clientAccessToken: undefined,
    username: undefined,

    serverList: {},

    /**
     * This method will set the initial listeners
     * @return {Void}
     */
    setListeners: () => {
        let $crewName = $(`#crew-name`);
        let $crewNameEditButton = $(`#crew-name-edit-button`);
        let $crewNameAndEditButton = $crewName.add($crewNameEditButton);
        let $crewNameEditInput = $(`#crew-name-edit-input`);
        let $krewNameForm = $(`#krew-name-form`);
        let _this = this;

        $crewNameEditButton.on(`click`, () => {
            $crewNameEditButton.addClass(`hidden`);

            // if i am the captain show the input to change the name of my crew
            if (_this.leadersUiConfiguration.active) {
                $crewName.addClass(`hidden`);
                _this.leadersUiConfiguration.editingName = true;
                $crewNameEditInput.val($crewName.html()).removeClass(`hidden`);
            }
        });

        $krewNameForm.on(`submit`, (e) => {
            _this.leadersUiConfiguration.editingName = false;
            $crewName.removeClass(`hidden`);
            $crewNameEditInput.addClass(`hidden`);

            // if i am the captain send the changed name to the backend
            if (_this.leadersUiConfiguration.active) {
                $crewNameEditButton.removeClass(`hidden`);
                let val = $crewNameEditInput.val().trim().slice(0, 20);
                if (val.length > 0 && !val.includes(`⚔`)) {
                    myBoat.setName(val);
                    $crewName.text(myBoat.crewName);
                    socket.emit(`updateKrewName`, myBoat.crewName);
                }
            }
            // clean the input
            $crewNameEditInput.val(``);
            e.preventDefault();
        });

        $crewNameEditInput.on(`keyup`, function (e) {
            let $this = $(this);
            let val = $this.val();

            if (val.trim().length > 20) {
                $this.val(val.slice(0, 20));
            }
        });

        $(`.toggle-shop-modal-button`).on(`click`, () => {
            if ($(`#toggle-shop-modal-button`).hasClass(`enabled`)) {
                if ($(`#shopping-modal`).is(`:visible`)) {
                    $(`#shopping-modal`).hide();
                } else {
                    // TODO: delete next 3 lines?
                    ui.closeAllPagesExcept(`#shopping-modal`);
                    ui.hideSuggestionBox = true;
                    ui.updateStore($(`.btn-shopping-modal.active`));
                    $(`#toggle-shop-modal-button`).popover(`hide`);
                    $(`#shopping-modal`).show();
                }
            }
        });

        $(`.toggle-krew-list-modal-button`).on(`click`, () => {
            if ($(`#toggle-krew-list-modal-button`).hasClass(`enabled`)) {
                if ($(`#krew-list-modal`).is(`:visible`)) {
                    $(`#krew-list-modal`).hide();
                } else {
                    // TODO: delete next 3 lines?
                    ui.closeAllPagesExcept(`#krew-list-modal`);
                    ui.hideSuggestionBox = true;
                    ui.updateStore($(`.btn-shopping-modal.active`));
                    $(`#toggle-shop-modal-button`).popover(`hide`);
                    $(`#krew-list-modal`).show();
                }
            }
        });

        $(`.toggle-bank-modal-button`).on(`click`, () => {
            if ($(`#toggle-bank-modal-button`).hasClass(`enabled`)) {
                if ($(`#bank-modal`).is(`:visible`)) {
                    $(`#bank-modal`).hide();
                } else {
                    ui.closeAllPagesExcept(`#bank-modal`);
                    $(`#bank-modal`).show();
                    $(`#successTakeDepoMess`).hide();
                    $(`#successMakeDepoMess`).hide();
                    $(`#errorMakeDepoMess`).hide();
                    $(`#errorTakeDepoMess`).hide();
                    getBankData();
                }
            }
        });

        $(`#toggle-map-button`).on(`click`, () => {
            if ($(`#minimap-container`).is(`:visible`)) {
                $(`#minimap-container`).hide();
            } else {
                $(`#minimap-container`).show();
            }
        });

        $(`.toggle-ship-status-button`).on(`click`, () => {
            if ($(`#ship-status-modal`).is(`:visible`)) {
                $(`#ship-status-modal`).hide();
            } else {
                ui.closeAllPagesExcept(`#ship-status-button`);
                ui.showShipStatus();
                $(`#ship-status-modal`).show();
                if (myPlayer.isCaptain !== true) {
                    $(`#lock-krew-label`).hide();
                } else {
                    $(`#lock-krew-label`).show();
                    if (myBoat && myBoat.isLocked !== true) {
                        $(`#lock-krew-button`).prop(`checked`, false);
                        $(`#lock-krew-text`).removeClass(`lock-text-error`).addClass(`lock-text-info`).text(`Lock krew...`);
                    } else {
                        $(`#lock-krew-button`).prop(`checked`, true);
                        $(`#lock-krew-text`).removeClass(`lock-text-info`).addClass(`lock-text-error`).text(`Unlock krew...`);
                    }
                }
            }
        });

        $(`#ship-status`).on(`click`, () => {
            ui.showShipStatus();
        });

        $(`#clan-management`).on(`click`, () => {
            $(`#clan-management`).addClass(`active`);
            $(`#ship-status`).removeClass(`active`);
            if (myPlayer.isLoggedIn === true) {
                ui.setClanData();
                if (!$(`#clan-management-container`).is(`:visible`)) {
                    $(`#clan-management-container`).show();
                    $(`#ship-status-container`).hide();
                    ui.setClanData(`force`);
                }
            } else {
                $(`#ship-status-container`).hide();
                $(`#notLoggedIn-container`).show();
            }
        });

        $(`#leave-clan-button`).on(`click`, () => {
            socket.emit(`clan`, `leave`, (callback) => {
                if (callback === true) {
                    ui.setClanData(`force`);
                }
            });
            myPlayer.clan = ``;
            ui.setClanData();
        });

        $(`#request-clan-button`).on(`click`, () => {
            $(`#clan-table`).hide();
            $(`#clan-request-table`).show();
            $(`#view-clan-button`).show();
        });

        $(`#view-clan-button`).on(`click`, () => {
            $(`#clan-table`).show();
            $(`#clan-request-table`).hide();
            $(`#view-clan-button`).hide();
        });

        // hide all errors when clicking on the text input field
        $(`#clan-request`).on(`click`, () => {
            ui.hideAllClanErrors();
        });

        $(`#join-clan-button`).on(`click`, () => {
            ui.hideAllClanErrors();
            let clanRequest = $(`#clan-request`).val();
            if (isAlphaNumeric(clanRequest) !== true) {
                $(`#errorInput`).show();
            } else if (clanRequest.length < 1 || clanRequest.length > 4) {
                $(`#errorLength`).show();
            } else if (!myPlayer.clanRequest || myPlayer.clanRequest === ``) {
                socket.emit(`clan`, {
                    action: `join`,
                    id: clanRequest
                }, (callback) => {
                    if (callback === true) {
                        myPlayer.clanRequest = clanRequest;
                        ui.setClanData(`force`);
                    } else if (callback === 404) {
                        $(`#error404`).show();
                    } else {
                        $(`#errorUndefined`).show();
                    }
                });
            }
        });

        $(`#create-clan-button`).on(`click`, () => {
            ui.hideAllClanErrors();
            let clanRequest = $(`#clan-request`).val();
            if (isAlphaNumeric(clanRequest) !== true) {
                $(`#errorInput`).show();
            } else if (clanRequest.length < 1 || clanRequest.length > 4) {
                $(`#errorLength`).show();
            } else {
                socket.emit(`clan`, {
                    action: `create`,
                    id: clanRequest
                }, (callback) => {
                    if (callback === true) {
                        myPlayer.clan = clanRequest;
                        myPlayer.clanLeader = true;
                        ui.setClanData(`force`);
                    } else if (callback === 409) {
                        $(`#errorExists`).show();
                    } else if (callback === 403) {
                        $(`#errorUnauthorized`).show();
                    } else {
                        $(`#errorUndefined`).show();
                    }
                });
            }
        });

        $(`#clan-table`).on(`click`, (e) => {
            let clanEvent = e.target.getAttribute(`data-event`);
            let clanId = e.target.getAttribute(`data-id`);

            if (clanEvent === `promote-clan`) {
                socket.emit(`clan`, {
                    action: `promote`,
                    id: clanId
                }, (callback) => {
                    if (callback === true) {
                        ui.setClanData(`force`);
                    }
                });
                ui.setClanData();
            } else if (clanEvent === `kick-clan`) {
                socket.emit(`clan`, {
                    action: `kick`,
                    id: clanId
                }, (callback) => {
                    if (callback === true) {
                        ui.setClanData(`force`);
                    }
                });
            }
        });

        $(`#clan-request-table`).on(`click`, (e) => {
            let requestEvent = e.target.getAttribute(`data-event`);
            let requestPlayer = e.target.getAttribute(`data-id`);

            if (requestEvent === `accept-request`) {
                socket.emit(`clan`, {
                    action: `accept`,
                    id: requestPlayer
                }, (callback) => {
                    if (callback === true) {
                        ui.setClanData(`force`);
                    }
                });
            } else if (requestEvent === `decline-request`) {
                socket.emit(`clan`, {
                    action: `decline`,
                    id: requestPlayer
                }, (callback) => {
                    if (callback === true) {
                        ui.setClanData(`force`);
                    }
                });
            }
        });

        $(`#player-request-table`).on(`click`, (e) => {
            let cancelRequestEvent = e.target.getAttribute(`data-event`);
            if (cancelRequestEvent === `cancel-request`) {
                if (myPlayer.clanRequest && myPlayer.clanRequest !== ``) {
                    socket.emit(`clan`, {
                        action: `cancel-request`,
                        id: myPlayer.clanRequest
                    }, (callback) => {
                        if (callback === true) {
                            myPlayer.clanRequest = ``;
                            ui.setClanData(`force`);
                        }
                    });
                }
            }
        });

        $(`#minimap`).on(`click`, (e) => {
            if (markerMapCount < performance.now() - 5000) {
                markerMapCount = performance.now();
                let x = (((e.offsetX === undefined ? e.layerX : e.offsetX) - 10) / 180) * worldsize;
                let y = (((e.offsetY === undefined ? e.layerY : e.offsetY) - 10) / 180) * worldsize;
                socket.emit(`addMarker`, {
                    x: x,
                    y: y
                });
            }
        });

        /**
         * This listener adds the functionality to the captains to kick a crew member
         * from the members list
         *
         * Since the list its been updated every 1000 milliseconds and to not add more listeners,
         * we only attach the listener to the krew list and search if the target has an id
         * If this is the case, send the event to the socket with the id to kick him
         *
         * @param  {Object} e   Browser event ('click')
         * @return {Void}
         */
        $(`#krew-list`).on(`click`, (e) => {
            let dataEvent = e.target.getAttribute(`data-event`);
            if (dataEvent === `kick`) {
                var dataId = e.target.getAttribute(`data-id`);
                if (typeof dataId === `string` && dataId.length > 0) {
                    socket.emit(`bootMember`, dataId);
                    $(e.target).closest(`.player-list-item`).remove();
                    if ($(`#buy-goods`).hasClass(`active`)) {
                        GOODSCOMPONENT.getList();
                    }
                }
            } else if (dataEvent === `transfer`) {
                var dataId = e.target.getAttribute(`data-id`);
                if (typeof dataId === `string` && dataId.length > 0) {
                    socket.emit(`transferShip`, dataId);
                    if ($(`#buy-goods`).hasClass(`active`)) {
                        GOODSCOMPONENT.getList();
                    }
                }
            }
        });

        $(`#music-control`).on(`change`, () => updateMusic());
    },

    playAudioFile: function (loop, fileId) {
        const musicValue = document.getElementById(`music-control`);
        const sfxValue = document.getElementById(`sfx-control`);

        document.getElementById(fileId).loop = loop;
        if (fileId === `cannon`)
            document.getElementById(fileId).currentTime = 0;

        document.getElementById(fileId).play();
        document.getElementById(fileId).volume = loop
            ? 0.1 * musicValue.value / musicValue.max
            : 0.45 * sfxValue.value / sfxValue.max;
    },
    stopAudioFile: function (fileId) {
        document.getElementById(fileId).pause();
    },
    updateUiExperience: () => {
        let $levelUpButton = $(`.level-up-button`);
        $levelUpButton.off();

        EXPERIENCEPOINTSCOMPONENT.clearStore().setStore((Store) => {
            if (Store.originalPoints > 0) {
                $levelUpButton.show(0);
                $levelUpButton.one(`click`, () => {
                    let $this = $(this);
                    let attribute = $this.attr(`data-attribute`);

                    Store.allocatedPoints[attribute] = 1;
                    EXPERIENCEPOINTSCOMPONENT.allocatePoints(() => {
                        ui.updateUiExperience();
                    });
                });
            }

            if (Store.originalPoints <= 0) {
                $levelUpButton.hide(0);
            }

            let $experiencebar = $(`#experience-bar`);
            let $progressbar = $experiencebar.find(`div`);
            let $fireRate = $(`.experience-attribute-fireRate`);
            let $damage = $(`.experience-attribute-damage`);
            let $distance = $(`.experience-attribute-distance`);
            let exp = myPlayer.experience;
            let level = parseInt(myPlayer.level);
            let nextLevel;
            let prevExp;
            let nextExp;
            let percent;

            nextLevel = level + 1;
            prevExp = myPlayer.experienceNeededForLevels[level].total;
            nextExp = myPlayer.experienceNeededForLevels[nextLevel].total;
            percent = parseInt(((exp - prevExp) / (nextExp - prevExp)) * 100);

            $experiencebar.attr(`data-info`, `Level ${level}`);

            $fireRate.find(`span`).html(myPlayer.points.fireRate);
            $damage.find(`span`).html(myPlayer.points.damage);
            $distance.find(`span`).html(myPlayer.points.distance);

            if (level === myPlayer.experienceMaxLevel) {
                $progressbar.attr(`style`, `width: 100%`);
            } else {
                $progressbar.attr(`style`, `width: ${percent}%`);
            }
        });
    },

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
            // title: 'Message from admin:',
            description: text,
            closeTimeout: time === undefined ? 4000 : time,
            position: `top-center`,
            animationOpen: `slide-in`,
            animationClose: `fade-out`,
            type: type,
            // type: 'danger',
            imageVisible: true,
            imageCustom: `../assets/img/${type}-new.png`
        });
    },

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
            imageCustom: `../assets/img/info-new.png`
        });
    },

    showKillMessage: function (text) {
        GrowlNotification.notify({
            description: text,
            closeTimeout: 5000,
            position: `top-right`,
            animationOpen: `slide-in`,
            animationClose: `fade-out`,
            type: `danger`,
            imageVisible: true,
            imageCustom: `../assets/img/cannon32x32.png`
        });
    },

    showDamageMessage: function (text, typeId) {
        switch (typeId) {
            case undefined:
            case 1: {
                color = `#a94442`;
                break;
            } // ship damage
            case 2: {
                color = `#3c763d`;
                break;
            } // shooter damage
        }
        let msgInterval = 3000;
        let textDiv = $(`<div/>`, {
            class: `text-xs-center`,
            text: text,
            style: `color: ${color}`
        }).delay(msgInterval).fadeOut(`slow`);

        let $messageCount = $(`#center-div div`).length;

        if ($messageCount > 3) {
            $(`#center-div div:last-child`).remove();
        }

        $(`#center-div`).prepend(textDiv);
    },

    showAdinplay: () => {
        let timeNow = Date.now();
        let timeLastAd = localStorage.getItem(`lastAdTime`);
        let timeSinceLastAd = timeNow - timeLastAd;
        console.log(`Time since last ad: ${timeSinceLastAd / 1000}s`);
        if (timeLastAd !== 0 && timeLastAd !== undefined && timeSinceLastAd > (5 * 60 * 1000)) {
            console.log(`Showing ad`);
            localStorage.setItem(`lastAdTime`, timeNow);
            if (adplayer) {
                adplayer.startPreRoll();
            }
        } else {
            if (timeLastAd === null || timeLastAd === undefined) {
                localStorage.setItem(`lastAdTime`, 1);
            }

            console.log(`Last ad recent. Not showing ad`);
        }
    },

    showAdinplayCentered: () => {
        if (typeof (adplayer) !== `undefined` && adEnabled) {
            adplayerCentered.startPreRoll();
        } else {
            console.log(`adplayer is not defined`);
        }
    },

    getShips: function (callback) {
        if (myPlayer && myPlayer.parent.shipState !== 1 && myPlayer.parent.shipState !== 0) {
            socket.emit(`getShips`, (err, ships) => {
                if (err) {
                    console.log(err);
                }

                let $div = $(`<div/>`, {
                    style: `font-size: 15px;text-align: center;`
                });

                let shopContainer = `<table class="table ship-table">`;
                shopContainer += `<thead class="thead-inverse">`;
                shopContainer += `<tr>`;
                shopContainer += `<th> Ship Image </th>`;
                shopContainer += `<th> Ship Type </th>`;
                shopContainer += `<th> HP</th>`;
                shopContainer += `<th> Max Capacity </th>`;
                shopContainer += `<th> Max Cargo </th>`;
                shopContainer += `<th> Speed </th>`;
                shopContainer += `<th> Price </th>`;
                shopContainer += `<th> Buy </th>`;
                shopContainer += `</tr>`;
                shopContainer += `</thead>`;
                shopContainer += `<tbody></tbody>`;
                shopContainer += `</table>`;

                $shopContainer = $(shopContainer);
                $tbody = $shopContainer.find(`tbody`);

                // construct shopping list
                for (let i in ships) {
                    let ship = ships[i];

                    if (ship.id === 0) {
                        continue;
                    }

                    let tr = `<tr>`;
                    tr += `<td>${ship.image}</td>`;
                    tr += `<td>${ship.name}</td>`;
                    tr += `<td>${ship.hp}</td>`;
                    tr += `<td>${ship.maxKrewCapacity}</td>`;
                    tr += `<td>${ship.cargoSize}</td>`;
                    tr += `<td>${ship.speed}</td>`;
                    tr += `<td>${ship.price}</td>`;
                    tr += `<td></td>`;
                    tr += `</tr>`;

                    let $tr = $(tr);
                    $tbody.append($tr);
                    let ButtonDiv = $(`<button/>`, {
                        id: ship.id,
                        class: `btn btn-primary btn-sm`,
                        role: `button`,
                        disabled: !!((myBoat !== undefined && ship.id === myBoat.shipclassId && myBoat.captainId === myPlayerId) || ship.purchasable !== true),
                        html: (myBoat !== undefined && ship.id === myBoat.shipclassId && myBoat.captainId === myPlayerId)
                            ? `Purchased`
                            : `Buy`
                    }).on(`click`, () => {
                        if ($(`#abandon-existing-krew`).is(`:visible`)) {
                            $(`#abandon-existing-krew`).hide();
                        }

                        let id = $(this).attr(`id`);

                        // type: 0 === ship
                        if (myPlayer !== undefined) {
                            myPlayer.position.x = 0;
                            myPlayer.position.z = 0;
                        }

                        socket.emit(`purchase`, {
                            type: 0,
                            id: id
                        }, (callback) => {
                            let quest_2_list = [`04`, `05`, `06`, `07`, `015`, `016`];
                            let quest_3_list = [`08`, `09`, `010`, `012`, `013`, `018`, `019`];
                            let quest_4_list = [`014`, `020`];
                            // other-quest-2
                            if (quest_2_list.includes(callback)) {
                                $(`#shopping-modal`).hide();
                                $(`#completed-quest-table`).append($(`#other-quest-2`).last());
                                $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                                $(`#other-quest-3`).show();
                            }
                            // other-quest-3
                            if (quest_3_list.includes(callback)) {
                                $(`#shopping-modal`).hide();
                                $(`#completed-quest-table`).append($(`#other-quest-3`).last());
                                $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                                $(`#other-quest-4`).show();
                            }
                            // other-quest-4
                            if (quest_4_list.includes(callback)) {
                                $(`#shopping-modal`).hide();
                                $(`#completed-quest-table`).append($(`#other-quest-4`).last());
                                $(`#completed-quest-table .quest-progress`).html(`<i class="icofont icofont-check-circled"></i>`);
                            }
                        });

                        $(`#krew-div`).show();

                        if (myPlayer !== undefined && myPlayer.parent !== undefined && myPlayer.parent.netType !== 1) {
                            GameAnalytics(`addDesignEvent`, `Game:Session:PurchasedBoat`);
                            $(`#raft-shop-div`).hide();
                            if (krewListUpdateManually)
                                $(`#toggle-krew-list-modal-button`).popover(`show`);
                            if (!ui.hideSuggestionBox)
                                $(`#toggle-shop-modal-button`).popover(`show`);
                        }
                    });

                    $tr.find(`td`).eq(7).append(ButtonDiv);
                }

                $div.append($shopContainer);
                if (typeof callback === `function`) {
                    callback($div);
                }
            });
        }
    },

    getItems: function (callback) {
        if (myPlayer.parent.shipState !== 1 && myPlayer.parent.shipState !== 0) {
            socket.emit(`getItems`, (err, items) => {
                if (err) {
                    console.log(err);
                }

                let $div = $(`<div/>`);

                let shopContainer = `<table class="table">`;
                shopContainer += `<thead class="thead-inverse">`;
                shopContainer += `<tr>`;
                shopContainer += `<th> Item Name </th>`;
                shopContainer += `<th> Description </th>`;
                shopContainer += `<th> Price </th>`;
                shopContainer += `<th> Buy Item </th>`;
                shopContainer += `</tr>`;
                shopContainer += `</thead>`;
                shopContainer += `<tbody></tbody>`;
                shopContainer += `</table>`;

                $shopContainer = $(shopContainer);
                $tbody = $shopContainer.find(`tbody`);

                // construct shopping list
                for (i in items) {
                    let item = items[i];
                    if (item.id === 11 && (myPlayer.overall_kills < 10 || myPlayer.overall_cargo < 100000 || !myPlayer.shipsSank || !myPlayer.overall_cargo)) {
                        item.purchasable = false;
                    } else if (item.id === 14 && myPlayer.statsReset === true) {
                        item.purchasable = false;
                    }

                    let tr = `<tr>`;
                    tr += `<td>${item.name}</td>`;
                    tr += `<td>${item.Description}</td>`;
                    tr += `<td>${item.price}</td>`;
                    tr += `<td></td>`;
                    tr += `</tr>`;
                    let $tr = $(tr);
                    $tbody.append($tr);

                    let $itemDiv = $(`<button/>`, {
                        id: item.id,
                        class: `btn btn-primary btn-sm`,
                        role: `button`,
                        disabled: !!((myPlayer && myPlayer.itemId === item.id || item.purchasable !== true)),
                        html: (myPlayer && myPlayer.itemId === item.id) ? `Equipped` : `Buy`
                    }).on(`click`, () => {
                        let id = $(this).attr(`id`);
                        socket.emit(`purchase`, {
                            type: 1,
                            id: id
                        }, (callback) => {
                            // update experience if player buys "Fountain of youth"
                            if (callback === `14`) {
                                ui.updateUiExperience();
                                // close shopping window
                                $(`#shopping-modal`).hide();
                                // player can buy this only once
                                myPlayer.statsReset = true;
                            }
                        });
                    });
                    $tr.find(`td`).eq(3).append($itemDiv);
                }

                $div.append($shopContainer);
                if (typeof callback === `function`) {
                    callback($div);
                }
            });
        }
    },

    updateKrewList: getFixedFrameRateMethod(2, () => {
        KREWLISTCOMPONENT.boats();
        DEPARTINGKREWLISTCOMPONENT.boats();
    }),

    updateStore: function ($btn) {
        let _this = this;
        let list = ``;
        let $shoppingItemList = $(`#shopping-item-list`);
        let id = $btn.attr(`id`);

        $shoppingItemList.html(``);

        EXPERIENCEPOINTSCOMPONENT.checkButtonTab();

        if (id === `buy-ships`) {
            if (myPlayer !== undefined && myPlayer.parent !== undefined &&
                myPlayer.parent.captainId !== myPlayer.id && myPlayer.parent.netType === 1) {
                $(`#abandon-existing-krew`).show();
            }

            _this.getShips((div) => {
                $shoppingItemList.html(div);
            });

            return;
        }

        if (id === `buy-items`) {
            if ($(`#abandon-existing-krew`).is(`:visible`)) {
                $(`#abandon-existing-krew`).hide();
            }

            _this.getItems((div) => {
                $shoppingItemList.html(div);
            });
            // $shoppingItemList.html(_this.getItems());
            return;
        }

        if (id === `buy-goods`) {
            if ($(`#abandon-existing-krew`).is(`:visible`)) {
                $(`#abandon-existing-krew`).hide();
            }

            GOODSCOMPONENT.getList();
            return;
        }

        if (id === `experience-points`) {
            if ($(`#abandon-existing-krew`).is(`:visible`)) {
                $(`#abandon-existing-krew`).hide();
            }

            EXPERIENCEPOINTSCOMPONENT.getList();
        }
    },

    getInviteLink: () => `${window.location.protocol}//${window.location.hostname}${window.location.hostname === `localhost` ? `:8080/?sid=` : `/?sid=`}${$(`#server-list`).val()}&bid=${myBoat.id}`,

    updateShipStats: function (data) {
        if (myPlayer && myPlayer.parent && myPlayer.parent.netType === 1) {
            $(`.ship-hp`).html(myPlayer.parent.hp);
            $(`.ship-max-hp`).html(myPlayer.parent.maxHp);

            $(`#ship-name`).html(boatTypes[myBoat.shipclassId].name);
            $(`.ship-speed`).html(myPlayer.parent.speed.toFixed(1));

            let cargoSize = boatTypes[myBoat.shipclassId].cargoSize;

            $(`#supply`).html(myBoat.supply);
            $(`#cargo-size`).html(cargoSize);

            $(`.ship-krew-count`).html(data.krewCount);
            $(`.ship-max-capacity`).html(boatTypes[myBoat.shipclassId].maxKrewCapacity);
        } else {
            $(`.ship-hp`).html(``);
            $(`.ship-max-hp`).html(``);
            $(`#ship-name`).html(``);
            $(`#supply`).html(``);
            $(`#cargo-size`).html(``);
            $(`.ship-krew-count`).html(``);
            $(`.ship-max-capacity`).html(``);
            $(`.ship-speed`).html(`/`);
        }
    },

    checkGoldDelta: function (gold) {
        // update player gold in shopping window
        deltaGold = gold - lastGold;
        lastGold = gold;
        if (deltaGold > 0) {
            myPlayer.notifiscationHeap[Math.random().toString(36).substring(6, 10)] = {
                text: `+ ${deltaGold} Gold!`,
                type: 1,
                isNew: true
            };
            if (!$(`#gold`).hasClass(`glow-gold-plus`) && glowGoldTimeout === 0) {
                $(`#gold`).addClass(`glow-gold-plus`);
                glowGoldTimeout = 1;
                setTimeout(() => {
                    $(`#gold`).removeClass(`glow-gold-plus`);
                    glowGoldTimeout = 0;
                }, 3500);
            }
            // shorten gold number by using K for thousand and M for million
            if (gold > 99999 && gold < 999999) {
                var gold_short = `${Math.floor(gold / 1000)} K`;
            } else if (gold > 999999) {
                gold_short = `${Math.floor(gold / 1000) / 1000} M`;
            } else {
                gold_short = gold;
            }
            // update gold value
            $(`.my-gold`).text(gold_short);
        } else if (deltaGold < 0) {
            if (!$(`#gold`).hasClass(`glow-gold-minus`) && glowGoldTimeout === 0) {
                $(`#gold`).addClass(`glow-gold-minus`);
                glowGoldTimeout = 1;
                setTimeout(() => {
                    $(`#gold`).removeClass(`glow-gold-minus`);
                    glowGoldTimeout = 0;
                }, 3500);
            }
            // shorten gold number by using K for thousand and M for million
            if (gold > 99999 && gold < 999999) {
                var gold_short = `${Math.floor(gold / 1000)} K`;
            } else if (gold > 999999) {
                gold_short = `${Math.floor(gold / 1000) / 1000} M`;
            } else {
                gold_short = gold;
            }
            // update gold value
            $(`.my-gold`).text(gold_short);
        }
    },

    checkScoreDelta: function (score) {
        deltaScore = score - lastScore;

        if (deltaScore > 0) {
            this.showDamageMessage(`+ ${parseFloat(deltaScore).toFixed(1)} hit`, 2);
            lastScore = score;
        }
    },

    setActiveBtn: function (id) {
        if (myPlayer.clan !== `` && myPlayer.clan !== undefined) {
            $(`#li-clan-chat`).show();
        }
        if (Admins.includes(myPlayer.name) || Mods.includes(myPlayer.name) || Devs.includes(myPlayer.name)) $(`#li-staff-chat`).show();
        if (entities[id].netType === 5) {
            $(`#toggle-krew-list-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
            $(`#toggle-shop-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`);

            if (entities[id].name === `Labrador`) {
                $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
            } else {
                $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md disabled toggle-bank-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
            }
        } else if (entities[id].netType === 1) {
            if (entities[id].shipState === 3) {
                $(`#toggle-krew-list-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-krew-list-modal-button`);
                $(`#toggle-shop-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`);

                if (entities[entities[id].anchorIslandId].name === `Labrador`) {
                    $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md enabled toggle-shop-modal-button`).attr(`data-tooltip`, `Deposit or withdraw gold`);
                } else {
                    $(`#toggle-bank-modal-button`).removeClass().addClass(`btn btn-md disabled toggle-bank-modal-button`).attr(`data-tooltip`, `Bank is available at Labrador`);
                }
            }
        }
    },

    closeAllPagesExcept: function (pageId) {
        allPagesId = [`#help-modal`, `#bank-modal`, `#krew-list-modal`, `#shopping-modal`, `#quests-modal`, `#ship-status-modal`];
        for (let i = 0; i < allPagesId.length; i++) {
            if (pageId !== allPagesId[i]) {
                $(allPagesId[i]).hide();
            }
        }
    },
    setBankData: function (data) {
        if (data.warn) {
            $(`#bankContainer`).hide();
            $(`#nabankContainer`).show();
        } else {
            $(`#bankContainer`).show();
            $(`#nabankContainer`).hide();
            $(`#my-deposits`).text(data.my);
            if (data.total >= 1000 && data.total.toString().length <= 6) {
                var goldTotalScore = `${Math.floor(data.total / 1000)} K`;
                $(`#total-deposits`).text(goldTotalScore);
            } else if (data.total.toString().length >= 7) {
                goldTotalScore = `${Math.floor(data.total / 1000) / 1000} M`;
                $(`#total-deposits`).text(goldTotalScore);
            } else {
                goldTotalScore = data.total;
                $(`#total-deposits`).text(goldTotalScore);
            }
            $(`#make-deposit`).attr({
                max: myPlayer.gold
            });
            $(`#take-deposit`).attr({
                max: data.my
            });
        }
    },

    setClanData: function (option) {
        // if player has no clan and did not send join request yet
        if ((myPlayer.clan === undefined || myPlayer.clan === ``) && (!myPlayer.clanRequest || myPlayer.clanRequest === ``)) {
            $(`#clan-name`).text(`You don't have any clan yet`);
            $(`#yes-clan`).hide();
            $(`#request-clan`).hide();
            $(`#no-clan`).show();
            ui.hideAllClanErrors();
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
                        if (callback.clanLeader[cl] === callback.clanOwner) {
                            var clanLeaderContent = `<tr><td>${callback.clanLeader[cl]}</td><td>Owner</td></tr>`;
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

    hideAllClanErrors: () => {
        $(`#errorInput`).hide();
        $(`#errorLength`).hide();
        $(`#error404`).hide();
        $(`#errorExists`).hide();
        $(`#errorUndefined`).hide();
        $(`#errorUnauthorized`).hide();
    },

    showShipStatus: () => {
        $(`#clan-management`).removeClass(`active`);
        $(`#ship-status`).addClass(`active`);
        $(`#notLoggedIn-container`).hide();
        if (!$(`#ship-status-container`).is(`:visible`)) {
            $(`#ship-status-container`).show();
            $(`#clan-management-container`).hide();
        }
    },

    updateLeaderboard: function (scores) {
        let players = scores.players;
        let boats = scores.boats;

        if (!myPlayer || !myPlayer.parent || !entities) {
            return;
        }

        if (entities) {
            myPlayer = entities[myPlayerId];
            myBoat = entities[myPlayer.parent.id];
        }

        // set correct overall_kills / overall_cargo number
        if (scores.boats.length > 0) {
            for (p in scores.boats) {
                if (!myBoat) return;
                if (scores.boats[p] && scores.boats[p].id === myBoat.id) {
                    myBoat.overall_kills = scores.boats[p].ok;
                    myBoat.overall_cargo = scores.boats[p].oc;
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
            if (myBoat) {
                return boat.id === myBoat.id;
            }
        }).pop();

        if (myBoat && remoteBoat) {
            // Set if i am the leader of the boat and update the leaders ui
            this.leadersUiConfiguration.active = remoteBoat.cI === myPlayer.id;
            this.updateLeadersUi();
            let cargoUsed = 0;
            for (var p in remoteBoat.players) {
                cargoUsed += remoteBoat.players[p].cargoUsed;
            }

            $(`.ship-cargo`).html(`${cargoUsed}/${boatTypes[myBoat.shipclassId].cargoSize}`);
            $(`.my-krew-name`).text(myBoat.crewName);
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

        if (myPlayer) {
            for (; playerScoreIndex < 15 && playerScoreIndex < playerScoreLength; playerScoreIndex++) {
                let killScore = playersListSortedByGold[playerScoreIndex].sS;
                let deathScore = playersListSortedByGold[playerScoreIndex].d;
                let playerLevel = playersListSortedByGold[playerScoreIndex].l;
                var clan = (playersListSortedByGold[playerScoreIndex].c !== undefined && playersListSortedByGold[playerScoreIndex].c !== ``) ? `[${playersListSortedByGold[playerScoreIndex].c}]` : ``;
                if (playersListSortedByGold[playerScoreIndex].s >= 1050 && playersListSortedByGold[playerScoreIndex].s.length <= 6) {
                    var damageScore = `${Math.floor((playersListSortedByGold[playerScoreIndex].s - 50) / 1000)} K`;
                } else {
                    damageScore = playersListSortedByGold[playerScoreIndex].s - 50;
                }
                if (playersListSortedByGold[playerScoreIndex].g >= 1000 && playersListSortedByGold[playerScoreIndex].g.toString().length <= 6) {
                    var goldScore = `${Math.floor(playersListSortedByGold[playerScoreIndex].g / 1000)} K`;
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

        if (myBoat) {
            for (; scoreIndex < 10 && scoreIndex < scoreLength; scoreIndex++) {
                var boatcount = `${scores.boats.length} boats`;
                let killcount = boatsListSortedByGold[scoreIndex].ok;
                let tradecount = boatsListSortedByGold[scoreIndex].oc;
                var clan = (boatsListSortedByGold[scoreIndex].c !== undefined && boatsListSortedByGold[scoreIndex].c !== ``) ? `[${boatsListSortedByGold[scoreIndex].c}]` : ``;
                let other_lvl = boatsListSortedByGold[scoreIndex].oql;
                if (boatsListSortedByGold[scoreIndex].g >= 1000 && boatsListSortedByGold[scoreIndex].g.toString().length <= 6) {
                    var display_gold = `${Math.floor(boatsListSortedByGold[scoreIndex].g / 1000)} K`;
                } else if (boatsListSortedByGold[scoreIndex].g.toString().length >= 7) {
                    display_gold = `${Math.floor(boatsListSortedByGold[scoreIndex].g / 1000) / 1000} M`;
                } else {
                    display_gold = boatsListSortedByGold[scoreIndex].g;
                }
                let entry = $(`<div${boatsListSortedByGold[scoreIndex].id === myBoat.id ? ` class="text-success grid-left"` : ` class="grid-left"`}>${clan}</div>` +
                    `<div style="max-width: 100%;"${
                        boatsListSortedByGold[scoreIndex].id === myBoat.id ? ` class="text-success grid-middle"` : ` class="grid-middle"`}>` +
                    `<span class='krewName' style='margin-left:2px;font-size: 13px'></span>` +
                    `</div>` +
                    `<div class="grid-middle">` +
                    `<img src="/assets/img/medal_${tradecount >= 150000 ? `gold` : tradecount >= 50000 ? `silver` : `bronze`}.png"${tradecount >= 12000 ? ` style="height: 17px"` : `style="height: 17px; display:none"`}>` +
                    `<img src="/assets/img/medal_${killcount >= 50 ? `gold` : killcount >= 20 ? `silver` : `bronze`}.png"${killcount >= 10 ? ` style="height: 17px"` : `style="height: 17px; display:none"`}>` +
                    `<img src="/assets/img/medal_${other_lvl === 3 ? `gold` : other_lvl === 2 ? `silver` : `bronze`}.png"${other_lvl > 0 ? ` style="height: 17px"` : `style="height: 17px; display:none"`}>` +
                    `</div>` +
                    `<div${boatsListSortedByGold[scoreIndex].id === myBoat.id ? ` class="text-success grid-right"` : ` class="grid-right"`}>${display_gold}</div>`);
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
        for (p in players) {
            // Update the playee names (and clan tags)
            if (entities[players[p].id] !== undefined) {
                entities[players[p].id].setName(players[p].n);
            }

            if (myBoat) {
                // current player is a krew member! (or myPlayer)
                if (players[p].pI === myBoat.id) {
                    playerListSortedByScore.push({
                        key: p,
                        value: players[p]
                    });
                }
            }
        }

        playerListSortedByScore.sort((a, b) => a.value.s - b.value.s);

        for (p in playerListSortedByScore) {
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

            $playerDiv = $(playerListItem);

            // indicate captain
            if (myBoat.captainId === player.id) {
                $playerDiv.prepend($(`<span/>`, {
                    class: `icofont icofont-ship-wheel text-warning`,
                    text: ` `
                }));
            }

            // if it's me
            if (player.id === myPlayerId) {
                $playerDiv.addClass(`text-success`);
                this.checkGoldDelta(player.g);
                myPlayer.clan = player.c;
                myPlayer.clanLeader = player.cL;
                myPlayer.clanOwner = player.cO;
                if (myPlayer.clanRequest !== player.cR) {
                    myPlayer.clanRequest = player.cR;
                    ui.setClanData(`force`);
                } else
                    myPlayer.clanRequest = player.cR;

                myPlayer.gold = parseInt(player.g);
                if (myPlayer.gold >= goldMultiplier) {
                    // console.log('goldMultiplier is: ',goldMultiplier);
                    miniplaySend2API(`gold`, goldMultiplier);
                    goldMultiplier *= 2;
                }

                myPlayer.score = parseInt(player.s);
                myPlayer.shipsSank = parseInt(player.sS);
                myPlayer.overall_cargo = parseInt(player.oc);
            }

            $krewListDiv.append($playerDiv);

            krewCount++;
        }

        if (myBoat) {
            this.updateShipStats({
                krewCount: krewCount
            });
        }

        $(`#krew-list`).html($krewListDiv);
    },

    // function for creating the login cookie
    setCookie: function (cname, cvalue, exdays) {
        let d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = `expires=${d.toUTCString()}`;
        document.cookie = `${cname}=${cvalue};${expires};path=/`;
    },

    getCookie: function (cname) {
        let cookies = document.cookie.split(`;`);
        for (let i in cookies) {
            let cookie = cookies[i];
            let name = cookie.split(`=`)[0];
            let value = cookie.split(`=`)[1];
            if (name.trim() === cname) {
                return value;
            }
        }
    },

    invalidateCookie: function (cname) {
        let cookies = document.cookie.split(`;`);
        for (let i in cookies) {
            let cookie = cookies[i];
            let name = cookie.split(`=`)[0];
            if (name.trim() === cname) {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
        }
    },

    getKrewioData: () => $.get(`${baseUrl}/authenticated`).then((response) => {
        ui.username = !response.isLoggedIn ? undefined : response.username;
        ui.password = !response.isLoggedIn ? undefined : response.password;
        loginButton.attr(`disabled`, false).show();

        if (ui.username === undefined) {
            // When a user opens the login menu
            loginButton.on(`click`, () => {
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
            ui.setCookie(`username`, response.username, 1);
            ui.setCookie(`password`, response.password, 1);

            // player is authenticated, so show him personalized login button
            playButton.html(`Play as <b>${ui.username}</b>`);
            loginButton.html(`Account Settings`);
            ui.isLoggedIn = true;
            ui.prepareForPlay();
            let currentModel = 0;

            loginButton.on(`click`, () => {
                $(`#manage-account-box`).modal(`show`);

                ui.setQualitySettings();
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
                $(`#model-image`).attr(`src`, `/assets/img/model${currentModel}.png`);
            });

            $(`#model-right`).on(`click`, () => {
                currentModel++;
                if (currentModel > 4) currentModel = 0;
                $(`#model-image`).attr(`src`, `/assets/img/model${currentModel}.png`);
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
    }),

    prepareForPlay: () => {
        // show the player that he is logged in (top right corner) and show logout button
        $(`#logged-in`).html(`You are logged in as <b>${ui.username}</b>`).show();
        $(`#login-link`).attr(`href`, `/logout`).html(`Logout`).show();
    },

    setSpawnPlace: () => {
        spawn = $(`#spawn-selection`).val();
        if (spawn === 0 || spawn === 1)
            ui.playAudioFile(true, `ocean-music`);
        else
            ui.playAudioFile(true, `island-music`);

        return spawn;
    },

    updateServerList: function () {
        let _this = this;

        // construct server-list
        $.ajax({
            url: `${baseUrl}/get_servers`,
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
                let params = _this.getUrlVars();
                if (params.sid) {
                    $(`#server-list`).val(params.sid);
                }
            }
        });
    },

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
    },

    setQualitySettings: () => {
        $(`#quality-list`).html(``);
        var $quality = $(`<option/>`, {
            html: `High Quality (slow)`,
            value: 3
        });
        $(`#quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Medium Quality (fast)`,
            value: 2
        });
        $(`#quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Low Quality (faster)`,
            value: 1
        });
        $(`#quality-list`).append($quality);

        $(`#account-quality-list`).html(``);
        var $quality = $(`<option/>`, {
            html: `High Quality (slow)`,
            value: 3
        });
        $(`#account-quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Medium Quality (fast)`,
            value: 2
        });
        $(`#account-quality-list`).append($quality);

        $quality = $(`<option/>`, {
            html: `Low Quality (faster)`,
            value: 1
        });
        $(`#account-quality-list`).append($quality);
    },

    getUrlVars: () => {
        let vars = {};
        let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
            vars[key] = value;
        });

        return vars;
    },

    /**
     * This will store the captains configuration, it will set the active property if i am the captain
     * @type {Object}
     */
    leadersUiConfiguration: {
        editingName: false,
        active: false
    },

    /**
     * This method wil update the leaders ui
     * @return {Void}
     */
    updateLeadersUi: () => {
        // If i am the captain and i am not editing the name, show the editing button
        let $crewNameEditButton = $(`#crew-name-edit-button`);
        if (this.leadersUiConfiguration.active && !this.leadersUiConfiguration.editingName) {
            $crewNameEditButton.removeClass(`hidden`);
        } else { // If i am not the captain hide the edit button
            $crewNameEditButton.addClass(`hidden`);
        }
    },

    LoadingWheel: function (event) {
        if (event === `show`) {
            $(`#loading-wheel`).show();
        } else {
            $(`#loading-wheel`).hide();
        }
    },

    showHideSpyglassBlackout: function (event) {
        if (event === `show`) {
            $(`#spyglass`).show();
        } else {
            $(`#spyglass`).hide();
        }
    }
};

let stoppedScroll, scrollLoop, chatHistory, prevScroll;

function scrollChat_init () {
    chatHistory = document.querySelector(`#chat-history`);
    stoppedScroll = false;

    chatHistory.scrollTop = 0;
    PreviousScrollTop = 0;

    scrollLoop = setInterval(scrollChat, 1);
}

function scrollChat () {
    chatHistory.scrollTop = PreviousScrollTop;
    PreviousScrollTop += 0.25;

    stoppedScroll = chatHistory.scrollTop >= (chatHistory.scrollHeight - chatHistory.offsetHeight);
}

function pauseChat () {
    clearInterval(scrollLoop);
}

function resumeChat () {
    PreviousScrollTop = chatHistory.scrollTop;
    scrollLoop = setInterval(scrollChat, 1);
}

scrollChat_init();
chatHistory.addEventListener(`mouseover`, pauseChat);
chatHistory.addEventListener(`mouseout`, resumeChat);

let times = [];
const getFPS = () => {
    window.requestAnimationFrame(() => {
        const now = performance.now();

        while (times.length > 0 && times[0] <= now - 1000) times.shift();
        times.push(now);

        document.querySelector(`#fps-wrapper > span`).innerHTML = `${times.length} FPS`;
        getFPS();
    });
};
getFPS();

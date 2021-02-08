/**
 * Creates ships store
 *
 * @callback callback
 */
let getShips = (callback) => {
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
                }).on(`click`, function () {
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
                        if (!ui.hideSuggestionBox) $(`#toggle-shop-modal-button`).popover(`show`);
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
};
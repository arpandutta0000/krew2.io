/**
 * Creates items store
 *
 * @callback callback
 */
let getItems = (callback) => {
    if (myPlayer.parent.shipState !== 1 && myPlayer.parent.shipState !== 0) {
        socket.emit(`getItems`, (err, items) => {
            if (err) return;

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

            let $shopContainer = $(shopContainer);
            let $tbody = $shopContainer.find(`tbody`);

            // construct shopping list
            for (let i in items) {
                let item = items[i];
                if (item.id === 15 && (myPlayer.overall_kills < 10 || myPlayer.overall_cargo < 100000 || !myPlayer.shipsSank || !myPlayer.overall_cargo)) {
                    item.purchasable = false;
                } else if (item.id === 16 && myPlayer.statsReset === true) {
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
                    disabled: ((myPlayer && myPlayer.itemId === item.id) || item.purchasable !== true),
                    html: (myPlayer && myPlayer.itemId === item.id) ? `Equipped` : `Buy`
                }).on(`click`, function () {
                    let id = $(this).attr(`id`);
                    socket.emit(`purchase`, {
                        type: 1,
                        id: id
                    }, (callback) => {
                        // update experience if player buys "Fountain of youth"
                        if (callback === `16`) {
                            experienceBarUpdate();
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
};

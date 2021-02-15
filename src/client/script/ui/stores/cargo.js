let GoodsComponent = {
    getList: () => {
        GoodsComponent
            .removeListeners()
            .clearStore()
            .setStore(() => {
                GoodsComponent
                    .setContent()
                    .setListeners();
            });
    },

    removeListeners: () => {
        if (Store.$html !== undefined) {
            Store.$html.children().off();
            Store.$html.off();
        }

        return GoodsComponent;
    },

    clearStore: () => {
        Object.assign(Store, {
            goodsPrice: {},
            goods: {},
            cargo: 0,
            cargoUsed: 0,
            gold: 0,
            $html: undefined,
            inventory: {},
            stock: {}
        });
        return GoodsComponent;
    },

    setStore: (callback) => {
        if (myPlayer && myPlayer.parent && (myPlayer.parent.netType === 5 || myPlayer.parent.shipState !== 1 && myPlayer.parent.shipState !== 0)) {
            socket.emit(`getGoodsStore`, (err, data) => {
                if (!err) Object.assign(Store, data);

                callback && callback.call && callback();
            });
        }
    },

    setContent: () => {
        let $html = $(`<div class="stock"/>`);

        if (
            Object.keys(Store.goodsPrice).length === 0 &&
            (myPlayer.parent && myPlayer.parent.netType !== 1)
        ) {
            $html.append(
                `<div class="col-xs-12 trading">` +
                `<h5 class="text-warning">You must own a ship, or join a krew before buying supplies</h5>` +
                `</div>`
            );
        }

        if (Object.keys(Store.goodsPrice).length > 0) {
            $html.append(GoodsComponent.getInventory());
            $html.append(GoodsComponent.getGoods());
        }

        Store.$html = $html;
        Store.$shoppingList.html(Store.$html);
        return GoodsComponent;
    },

    setListeners: () => {
        $(`input[type=range]`).each(function () {
            inputRange($(this));
        });

        for (let i in Store.inventory) {
            GoodsComponent.setInputRangeListeners(Store.inventory[i], i, `sell`);
        }

        for (let i in Store.stock) {
            GoodsComponent.setInputRangeListeners(Store.stock[i], i, `buy`);
        }

        return GoodsComponent;
    },

    setInputRangeListeners: ($tr, good, action) => {
        let $btn = $tr.find(`.btn-${action}`);
        let $slider = $tr.find(`.ui-slider`);
        let $handle = $slider.find(`.ui-slider-handle`);
        let options = {
            create: function () {
                $handle.text($slider.slider(`value`));
            },

            slide: function (event, ui) {
                $handle.text(ui.value);
                let val = (+ui.value * Store.goodsPrice[good]);
                let sign = (action === `sell` ? `+` : `-`);

                $btn.html((val > 0 ? sign : ``) + val);
            }
        };

        if (action === `sell`) {
            options.max = Store.goods[good];
        }

        if (action === `buy`) {
            let max = parseInt(Store.gold / Store.goodsPrice[good]);
            let maxCargo = (Store.cargo - Store.cargoUsed) / goodsTypes[good].cargoSpace;
            let tr = ``;

            if (max > maxCargo) {
                max = maxCargo;
            }

            max = Math.floor(max);
            options.max = max;
        }

        $slider.slider(options);

        $btn.one(`click`, (e) => {
            e.preventDefault();
            GameAnalytics(`addDesignEvent`, `Game:Session:Trade`);
            if ($slider.slider(`value`) > 0) {
                socket.emit(`buy-goods`, {
                    quantity: $slider.slider(`value`),
                    action: action,
                    good: good
                }, (err, data) => {
                    if (!err) {
                        myPlayer.gold = data.gold;
                        myPlayer.goods = data.goods;
                    }

                    GoodsComponent.getList();
                });
            }
        });
    },

    getInventory: () => {
        let html = ``;
        let $html;
        let $tbody;

        html += `<div class="col-xs-12 col-sm-6 trading">`,
        html += `    <h6>Your ship's cargo ${Store.cargoUsed}/${Store.cargo}</h6>`,
        html += `    <table class="table table-sm">`,
        html += `        <thead><tr><th>Name</th><th>Quantity</th><th></th><th>Sell</th></tr></thead>`,
        html += `        <tbody></tbody>`,
        html += `    </table>`,
        html += `    <br>`,
        html += `</div>`;

        $html = $(html);
        $tbody = $html.find(`tbody`);

        for (let i in Store.goods) {
            if (Store.goods[i] > 0 && Store.goodsPrice[i] !== undefined) {
                let tr = ``;
                tr += `<tr>`;
                tr += `    <td>`;
                tr += `        ${i}`;
                tr += `        <label>$${Store.goodsPrice[i]} each</label>`;
                tr += `        <label>${goodsTypes[i].cargoSpace} cargo</label>`;
                tr += `    </td>`;
                tr += `    <td>`;
                tr += `        <div class="ui-slider" style="margin-top: 10px">`;
                tr += `            <div class="ui-slider-handle" style="width: 3em;height: 1.6em;top: 50%;margin-top: -.8em;text-align: center;line-height: 1.6em;"></div>`;
                tr += `        </div>`;
                tr += `    </td>`;
                tr += `    <td style="padding-top: 5px">${Store.goods[i]}</td>`;
                tr += `    <td>`;
                tr += `        <button class="btn btn-success btn-sm btn-sell">0</button>`;
                tr += `    </td>`;
                tr += `</tr>`;

                Store.inventory[i] = $(tr);
                $tbody.append(Store.inventory[i]);
            }
        }

        return $html;
    },

    getGoods: () => {
        let html = ``;
        let $html;
        let $tbody;

        html += `<div class="col-xs-12 col-sm-6 trading">`,
        html += `    <h6>Merchant</h6>`,
        html += `    <table class="table table-sm">`,
        html += `        <thead><tr><th>Name</th><th>Quantity</th><th></th><th>Buy</th></tr></thead>`,
        html += `        <tbody></tbody>`,
        html += `    </table>`,
        html += `    <br>`,
        html += `</div>`;

        $html = $(html);
        $tbody = $html.find(`tbody`);

        for (let i in Store.goodsPrice) {
            if (Store.goods[i] !== undefined) {
                let max = parseInt(Store.gold / Store.goodsPrice[i]);
                let maxCargo = (Store.cargo - Store.cargoUsed) / goodsTypes[i].cargoSpace;
                let tr = ``;

                if (max > maxCargo) {
                    max = maxCargo;
                }

                max = Math.floor(max);

                tr += `<tr>`;
                tr += `    <td>`;
                tr += `        ${i}`;
                tr += `        <label>$${Store.goodsPrice[i]} each</label>`;
                tr += `        <label>${goodsTypes[i].cargoSpace} cargo</label>`;
                tr += `    </td>`;
                tr += `    <td>`;
                tr += `        <div class="ui-slider" style="margin-top: 10px">`;
                tr += `            <div class="ui-slider-handle" style="width: 3em;height: 1.6em;top: 50%;margin-top: -.8em;text-align: center;line-height: 1.6em;"></div>`;
                tr += `        </div>`;
                tr += `    </td>`;
                tr += `    <td style="padding-top: 5px">${max}</td>`;
                tr += `    <td>`;
                tr += `        <button class="btn btn-success btn-sm btn-buy">0</button>`;
                tr += `    </td>`;
                tr += `</tr>`;

                Store.stock[i] = $(tr);
                $tbody.append(Store.stock[i]);
            }
        }

        return $html;
    }
};

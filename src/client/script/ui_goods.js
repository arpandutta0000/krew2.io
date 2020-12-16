(function (window) {
    var Store = {
        $shoppingList: $('#shopping-item-list'),
    };

    var GoodsComponent = {
        getList: function () {
            GoodsComponent
                .removeListeners()
                .clearStore()
                .setStore(function () {
                    GoodsComponent
                        .setContent()
                        .setListeners();
                });
        },

        removeListeners: function () {
            if (Store.$html !== undefined) {
                Store.$html.children().off();
                Store.$html.off();
            }

            return GoodsComponent;
        },

        clearStore: function () {
            Object.assign(Store, {
                goodsPrice: {},
                goods: {},
                cargo: 0,
                cargoUsed: 0,
                gold: 0,
                $html: undefined,
                inventory: {},
                stock: {},
            });
            return GoodsComponent;
        },

        setStore: function (callback) {
            if (myPlayer && myPlayer.parent && (myPlayer.parent.netType == 5 || myPlayer.parent.shipState !== 1 && myPlayer.parent.shipState !== 0 )){
                socket.emit('getGoodsStore', function (err, data) {
                    if (err) {
                        console.warn(err);
                    }

                    if (!err) {
                        Object.assign(Store, data);
                    }

                    callback && callback.call && callback();
                });
            }
        },

        setContent: function () {
            var $html = $('<div class="stock"/>');

            if (
              Object.keys(Store.goodsPrice).length === 0  &&
              (myPlayer.parent && myPlayer.parent.netType !== 1)
            ) {
                $html.append(
                  '<div class="col-xs-12 trading">' +
                  '<h5 class="text-warning">You must own a ship, or join a krew before buying supplies</h5>' +
                  '</div>'
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

        setListeners: function () {
            $('input[type=range]').each(function () {
                inputRange($(this));
            });

            for (var i in Store.inventory) {
                GoodsComponent.setInputRangeListeners(Store.inventory[i], i, 'sell');
            }

            for (var i in Store.stock) {
                GoodsComponent.setInputRangeListeners(Store.stock[i], i, 'buy');
            }

            return GoodsComponent;
        },

        setInputRangeListeners: function ($tr, good, action) {
            var $btn = $tr.find('.btn-' + action);
            var $slider = $tr.find('.ui-slider');
            var $handle = $slider.find('.ui-slider-handle');
            var options = {
                    create: function () {
                        $handle.text($slider.slider('value'));
                    },

                    slide: function (event, ui) {
                        $handle.text(ui.value);
                        var val = (+ui.value * Store.goodsPrice[good]);
                        var sign = (action === 'sell' ?  '+' : '-');

                        $btn.html((val > 0 ? sign : '') + val);
                    },
                };

            if (action === 'sell') {
                options.max = Store.goods[good];
            }

            if (action === 'buy') {
                var max = parseInt(Store.gold / Store.goodsPrice[good]);
                var maxCargo = (Store.cargo - Store.cargoUsed) / goodsTypes[good].cargoSpace;
                var tr = '';

                if (max > maxCargo) {
                    max = maxCargo;
                }

                max = Math.floor(max);
                options.max = max;
            }

            $slider.slider(options);

            $btn.one('click', function (e) {
                e.preventDefault();
                GameAnalytics("addDesignEvent", "Game:Session:Trade");
                if ($slider.slider('value') > 0) {
                    socket.emit('buy-goods', {
                        quantity: $slider.slider('value'),
                        action: action,
                        good: good,
                    }, function (err, data) {
                        if (err) {
                            console.log(err);
                        }

                        if (!err) {
                            myPlayer.gold = data.gold;
                            myPlayer.goods = data.goods;
                        }

                        GoodsComponent.getList();
                    });
                }
            });
        },

        getInventory: function () {
            var html = '';
            var $html;
            var $tbody;

            html += '<div class="col-xs-12 col-sm-6 trading">',
            html += '    <h6>Your ship\'s cargo ' + Store.cargoUsed + '/' + Store.cargo + '</h6>',
            html += '    <table class="table table-sm">',
            html += '        <thead><tr><th>Name</th><th>Quantity</th><th></th><th>Sell</th></tr></thead>',
            html += '        <tbody></tbody>',
            html += '    </table>',
            html += '    <br>',
            html += '</div>';

            $html = $(html);
            $tbody = $html.find('tbody');

            for (var i in Store.goods) {
                if (Store.goods[i] > 0 && Store.goodsPrice[i] !== undefined) {
                    var tr = '';
                    tr += '<tr>';
                    tr += '    <td>';
                    tr += '        ' + i;
                    tr += '        <label>$' + Store.goodsPrice[i] + ' each</label>';
                    tr += '        <label>' + goodsTypes[i].cargoSpace + ' cargo</label>';
                    tr += '    </td>';
                    tr += '    <td>';
                    tr += '        <div class="ui-slider" style="margin-top: 10px">';
                    tr += '            <div class="ui-slider-handle" style="width: 3em;height: 1.6em;top: 50%;margin-top: -.8em;text-align: center;line-height: 1.6em;"></div>';
                    tr += '        </div>';
                    tr += '    </td>';
                    tr += '    <td style="padding-top: 5px">' + Store.goods[i] + '</td>';
                    tr += '    <td>';
                    tr += '        <button class="btn btn-success btn-sm btn-sell">0</button>';
                    tr += '    </td>';
                    tr += '</tr>';

                    Store.inventory[i] = $(tr);
                    $tbody.append(Store.inventory[i]);
                }
            }

            return $html;
        },

        getGoods: function () {
            var html = '';
            var $html;
            var $tbody;

            html += '<div class="col-xs-12 col-sm-6 trading">',
            html += '    <h6>Merchant</h6>',
            html += '    <table class="table table-sm">',
            html += '        <thead><tr><th>Name</th><th>Quantity</th><th></th><th>Buy</th></tr></thead>',
            html += '        <tbody></tbody>',
            html += '    </table>',
            html += '    <br>',
            html += '</div>';

            $html = $(html);
            $tbody = $html.find('tbody');

            for (var i in Store.goodsPrice) {
                if (Store.goods[i] !== undefined) {
                    var max = parseInt(Store.gold / Store.goodsPrice[i]);
                    var maxCargo = (Store.cargo - Store.cargoUsed) / goodsTypes[i].cargoSpace;
                    var tr = '';

                    if (max > maxCargo) {
                        max = maxCargo;
                    }

                    max = Math.floor(max);

                    tr += '<tr>';
                    tr += '    <td>';
                    tr += '        ' + i;
                    tr += '        <label>$' + Store.goodsPrice[i] + ' each</label>';
                    tr += '        <label>' + goodsTypes[i].cargoSpace + ' cargo</label>';
                    tr += '    </td>';
                    tr += '    <td>';
                    tr += '        <div class="ui-slider" style="margin-top: 10px">';
                    tr += '            <div class="ui-slider-handle" style="width: 3em;height: 1.6em;top: 50%;margin-top: -.8em;text-align: center;line-height: 1.6em;"></div>';
                    tr += '        </div>';
                    tr += '    </td>';
                    tr += '    <td style="padding-top: 5px">' + max + '</td>';
                    tr += '    <td>';
                    tr += '        <button class="btn btn-success btn-sm btn-buy">0</button>';
                    tr += '    </td>';
                    tr += '</tr>';

                    Store.stock[i] = $(tr);
                    $tbody.append(Store.stock[i]);
                }
            }

            return $html;
        },
    };

    window.GOODSCOMPONENT = GoodsComponent;
})(window);

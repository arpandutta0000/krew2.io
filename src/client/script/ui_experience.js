(function (window) {
    var Store = {
        $shoppingList: $('#shopping-item-list'),
    };

    var ExperiencePointsComponent = {
        keys: {
            53: 'fireRate',
            54: 'distance',
            55: 'damage',
        },
        getList: function () {
            if (myPlayer === undefined || myPlayer.parent === undefined) {
                console.warn('Ooops, it seems you don\'t have a boat.');
                return;
            }

            ExperiencePointsComponent
                .removeListeners()
                .clearStore()
                .setStore(function () {
                    ExperiencePointsComponent
                        .setContent()
                        .setListeners();
                });
        },

        removeListeners: function () {
            if (Store.$html !== undefined) {
                Store.$html.children().off();
                Store.$html.off();
            }

            return ExperiencePointsComponent;
        },

        clearStore: function () {
            Object.assign(Store, {
                $html: undefined,
                points: {},
                originalPoints: 0,
                availablePoints: 0,
                usedPoints: 0,
                allocatedPoints: {},
                pointsTr: {},
                experience: myPlayer ? myPlayer.experience : 0,
            });
            return ExperiencePointsComponent;
        },

        setStore: function (callback) {
            socket.emit('getExperiencePoints', function (err, data) {
                if (err) {
                    console.warn(err);
                    return;
                }

                Object.assign(Store, data);

                if (myPlayer) {
                    myPlayer.experience = data.experience;
                    myPlayer.points = data.points;
                }

                for (var i in Store.points) {
                    Store.allocatedPoints[i] = 0;
                }

                Store.originalPoints = Store.availablePoints;

                callback && callback.call && callback(Store);
            });
        },

        setContent: function () {
            var $html = $('<div/>');
            $html.append(ExperiencePointsComponent.getPointsList());
            if (Store.originalPoints === 0) {
                $html.find('.btn-allocate-points').attr('disabled', true);
            }

            Store.$html = $html;
            Store.$shoppingList.html(Store.$html);
            return ExperiencePointsComponent;
        },

        setListeners: function () {
            var $btn = Store.$html.find('.btn-allocate-points');
            var i;

            $('input[type=range]').each(function () {
                inputRange($(this));
            });

            for (i in Store.pointsTr) {
                ExperiencePointsComponent.setInputRangeListeners(Store.pointsTr[i], i);
            }

            $btn.one('click', function (e) {
                e.preventDefault();
                ExperiencePointsComponent.allocatePoints(function () {
                    ExperiencePointsComponent.getList();
                });
            });

            return ExperiencePointsComponent;
        },

        allocatePoints: function (callback) {
            socket.emit('allocatePoints', Store.allocatedPoints, function (err) {
                if (err) {
                    console.log(err);
                }

                if (typeof callback === 'function') {
                    callback();
                }
            });
        },

        setInputRangeListeners: function ($tr, name) {
            var $input = $tr.find('input');

            $input.on('change input', function () {
                ExperiencePointsComponent.updateAvailablePoints();

                var val = parseInt($input.val()) - Store.points[name];
                if (val <= 0) {
                    val = 0;
                }

                if (val > Store.allocatedPoints[name] + Store.availablePoints) {
                    val = Store.allocatedPoints[name] + Store.availablePoints;
                }

                if (Store.availablePoints <= 0 && val >= Store.allocatedPoints[name]) {
                    val = Store.allocatedPoints[name];
                }

                Store.allocatedPoints[name] = val;
                val += Store.points[name];
                $input.val(val);
                updateInputRange($input);

                ExperiencePointsComponent.updateAvailablePoints();
                Store.$html.find('h6').html('Available points: ' + Store.originalPoints + '<span class="float-right">Points left: ' + Store.availablePoints + '</span>');
                ui.updateUiExperience();

            }).trigger('change');
        },

        updateAvailablePoints: function () {
            Store.usedPoints = 0;
            for (var i in Store.allocatedPoints) {
                Store.usedPoints += Store.allocatedPoints[i];
            }

            Store.availablePoints = Store.originalPoints - Store.usedPoints;
            return ExperiencePointsComponent;
        },

        getPointsList: function () {
            var html = '';
            var $html;
            var $tbody;

            html += '<div>',
            html += '    <h6>Available points: ' + Store.originalPoints + '<span class="float-right">Points left: ' + Store.availablePoints + '</span></h6>',
            html += '    <table class="table table-sm">',
            html += '        <thead><tr><th>Name</th><th>Quantity</th></tr></thead>',
            html += '        <tbody></tbody>',
            html += '    </table>',
            html += '    <button class="btn btn-primary float-right btn-allocate-points">Allocate points</button>',
            html += '</div>';

            $html = $(html);
            $tbody = $html.find('tbody');

            for (var i in Store.points) {

                var tr = '';
                tr += '<tr>';
                tr += '    <td>' + i + '</td>';
                tr += '    <td>';
                tr += '        <div class="range-group">';
                tr += '            <input type="range" min="0" max="50" step="1" value="' + Store.points[i] + '">';
                tr += '            <output></output>';
                tr += '        </div>';
                tr += '    </td>';
                tr += '</tr>';

                Store.pointsTr[i] = $(tr);
                $tbody.append(Store.pointsTr[i]);
            }

            return $html;
        },

        checkButtonTab: function () {
            ExperiencePointsComponent.clearStore().setStore(function (Store) {
                var $btnExperiencePoints = $('#experience-points');
                if (Store.originalPoints > 0) {
                    $btnExperiencePoints.show(0);
                    return;
                }

                $btnExperiencePoints.hide(0);
            });
        },
    };

    window.EXPERIENCEPOINTSCOMPONENT = ExperiencePointsComponent;
})(window);
let ExperiencePointsComponent = {
    keys: {
        53: `fireRate`,
        54: `distance`,
        55: `damage`
    },
    getList: () => {
        ExperiencePointsComponent
            .removeListeners()
            .clearStore()
            .setStore(() => {
                ExperiencePointsComponent
                    .setContent()
                    .setListeners();
            });
    },

    removeListeners: () => {
        if (Store.$html !== undefined) {
            Store.$html.children().off();
            Store.$html.off();
        }

        return ExperiencePointsComponent;
    },

    clearStore: () => {
        Object.assign(Store, {
            $html: undefined,
            points: {},
            originalPoints: 0,
            availablePoints: 0,
            usedPoints: 0,
            allocatedPoints: {},
            pointsTr: {},
            experience: myPlayer ? myPlayer.experience : 0
        });
        return ExperiencePointsComponent;
    },

    setStore: (callback) => {
        socket.emit(`getExperiencePoints`, (err, data) => {
            if (err) return;

            Object.assign(Store, data);

            if (myPlayer) {
                myPlayer.experience = data.experience;
                myPlayer.points = data.points;
            }

            for (let i in Store.points) {
                Store.allocatedPoints[i] = 0;
            }

            Store.originalPoints = Store.availablePoints;

            callback && callback.call && callback(Store);
        });
    },

    setContent: () => {
        $(`<div/>`).append(ExperiencePointsComponent.getPointsList());
        if (Store.originalPoints === 0) {
            $(`<div/>`).find(`.btn-allocate-points`).attr(`disabled`, true);
        }

        Store.$html = $(`<div/>`);
        Store.$shoppingList.html(Store.$html);
        return ExperiencePointsComponent;
    },

    setListeners: () => {
        $(`input[type=range]`).each(function () {
            inputRange($(this));
        });

        for (let i in Store.pointsTr) {
            ExperiencePointsComponent.setInputRangeListeners(Store.pointsTr[i], i);
        }

        Store.$html.find(`.btn-allocate-points`).one(`click`, (e) => {
            e.preventDefault();
            ExperiencePointsComponent.allocatePoints(() => {
                ExperiencePointsComponent.getList();
            });
        });

        return ExperiencePointsComponent;
    },

    allocatePoints: (callback) => {
        socket.emit(`allocatePoints`, Store.allocatedPoints, (err) => {
            if (err) return;

            if (typeof callback === `function`) {
                callback();
            }
        });
    },

    setInputRangeListeners: ($tr, name) => {
        let $input = $tr.find(`input`);

        $input.on(`change input`, () => {
            ExperiencePointsComponent.updateAvailablePoints();

            let val = parseInt($input.val()) - Store.points[name];
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
            Store.$html.find(`h6`).html(`Available points: ${Store.originalPoints}<span class="float-right">Points left: ${Store.availablePoints}</span>`);
            experienceBarUpdate();
        }).trigger(`change`);
    },

    updateAvailablePoints: () => {
        Store.usedPoints = 0;
        for (let i in Store.allocatedPoints) {
            Store.usedPoints += Store.allocatedPoints[i];
        }

        Store.availablePoints = Store.originalPoints - Store.usedPoints;
        return ExperiencePointsComponent;
    },

    getPointsList: () => {
        let html = ``;
        let $html;
        let $tbody;

        html += `<div>`,
        html += `    <h6>Available points: ${Store.originalPoints}<span class="float-right">Points left: ${Store.availablePoints}</span></h6>`,
        html += `    <table class="table table-sm">`,
        html += `        <thead><tr><th>Name</th><th>Quantity</th></tr></thead>`,
        html += `        <tbody></tbody>`,
        html += `    </table>`,
        html += `    <button class="btn btn-primary float-right btn-allocate-points">Allocate points</button>`,
        html += `</div>`;

        $html = $(html);
        $tbody = $html.find(`tbody`);

        for (let i in Store.points) {
            let tr = ``;
            tr += `<tr>`;
            tr += `    <td>${i}</td>`;
            tr += `    <td>`;
            tr += `        <div class="range-group">`;
            tr += `            <input type="range" min="0" max="50" step="1" value="${Store.points[i]}">`;
            tr += `            <output></output>`;
            tr += `        </div>`;
            tr += `    </td>`;
            tr += `</tr>`;

            Store.pointsTr[i] = $(tr);
            $tbody.append(Store.pointsTr[i]);
        }

        return $html;
    },

    checkButtonTab: () => {
        ExperiencePointsComponent.clearStore().setStore((Store) => {
            if (Store.originalPoints > 0) {
                $(`#experience-points`).show(0);
                return;
            }

            $(`#experience-points`).hide(0);
        });
    }
};

/**
 * Update the experience bar
 */
let experienceBarUpdate = () => {
    $(`.level-up-button`).off();

    ExperiencePointsComponent.clearStore().setStore((Store) => {
        if (Store.originalPoints > 0) {
            $(`.level-up-button`).show(0);
            $(`.level-up-button`).one(`click`, function () {
                Store.allocatedPoints[$(this).attr(`data-attribute`)] = 1;
                ExperiencePointsComponent.allocatePoints(() => {
                    experienceBarUpdate();
                });
            });
        }

        if (Store.originalPoints <= 0) $(`.level-up-button`).hide(0);

        let exp = myPlayer.experience;
        let level = parseInt(myPlayer.level);
        let nextLevel = level + 1;
        let prevExp = myPlayer.experienceNeededForLevels[level].total;
        let nextExp = myPlayer.experienceNeededForLevels[nextLevel].total;
        let percent = parseInt(((exp - prevExp) / (nextExp - prevExp)) * 100);

        $(`#experience-bar`).attr(`data-info`, `Level ${level}`);

        $(`.experience-attribute-fireRate`).find(`span`).html(myPlayer.points.fireRate);
        $(`.experience-attribute-damage`).find(`span`).html(myPlayer.points.damage);
        $(`.experience-attribute-distance`).find(`span`).html(myPlayer.points.distance);

        if (level === myPlayer.experienceMaxLevel) $(`#experience-bar`).find(`div`).attr(`style`, `width: 100%`);
        else $(`#experience-bar`).find(`div`).attr(`style`, `width: ${percent}%`);
    });
};

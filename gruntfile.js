const webpackConfig = require(`./webpack.config.js`);
require(`dotenv`).config();

module.exports = grunt => {
    grunt.initConfig({
        pkg: grunt.file.readJSON(`package.json`),
        concat: {
            // Add together server core.
            server: {
                src: [
                    `src/server/core/preConcat.js`,
                    `src/server/core/core.js`,
                    `src/server/core/utils.js`,

                    `src/server/core/goodsTypes.js`,

                    `src/server/core/entity.js`,
                    `src/server/core/player.js`,

                    `src/server/core/itemTypes.js`,
                    `src/server/core/item.js`,

                    `src/server/core/boatTypes.js`,
                    `src/server/core/boat.js`,

                    `src/server/core/impact.js`,
                    `src/server/core/pickup.js`,
                    `src/server/core/landmark.js`,
                    `src/server/core/projectile.js`,

                    `src/server/config/gameConfig.js`,
                    `src/server/core/serverEntity.js`,
                    `src/server/core/postConcat.js`
                ],
                dest: `src/server/core/core_concatenated.js`
            },
            // Add together client core.
            client: {
                src: [
                    `src/client/script/config/clientConfig.js`,
                    `src/client/script/config/boatTypes.js`,
                    `src/client/script/config/goodsTypes.js`,

                    `src/client/script/core/core.js`,
                    `src/client/script/core/geometry/geometry.js`,

                    `src/client/script/core/parseSnap.js`,

                    `src/client/script/core/window.js`,
                    `src/client/script/utils.js`,

                    `src/client/script/ui/authentication/headers.js`,
                    `src/client/script/ui/authentication/loginRegister.js`,
                    `src/client/script/ui/gameplayUi/chat.js`,
                    `src/client/script/ui/gameplayUi/experienceBar.js`,
                    `src/client/script/ui/gameplayUi/gameplayUi.js`,
                    `src/client/script/ui/gameplayUi/krewStatus.js`,
                    `src/client/script/ui/gameplayUi/leaderboard.js`,
                    `src/client/script/ui/gameplayUi/minimap.js`,
                    `src/client/script/ui/gameplayUi/notifications.js`,
                    `src/client/script/ui/menus/bank.js`,
                    `src/client/script/ui/menus/clan.js`,
                    `src/client/script/ui/menus/krewList.js`,
                    `src/client/script/ui/stores/cargo.js`,
                    `src/client/script/ui/stores/items.js`,
                    `src/client/script/ui/stores/ships.js`,
                    `src/client/script/ui/ads.js`,
                    `src/client/script/ui/economy.js`,
                    `src/client/script/ui/fps.js`,
                    `src/client/script/ui/island.js`,
                    `src/client/script/ui/splash.js`,
                    `src/client/script/ui/ui.js`,

                    `src/client/script/core/controls/keyboard.js`,
                    `src/client/script/core/controls/controls.js`,

                    `src/client/script/core/entities/models/EntityModels.js`,
                    `src/client/script/core/entities/models/BoatModels.js`,
                    `src/client/script/core/entities/models/PlayerModels.js`,

                    `src/client/script/core/entities/delta/EntityDelta.js`,
                    `src/client/script/core/entities/delta/BoatDelta.js`,
                    `src/client/script/core/entities/delta/ImpactDelta.js`,
                    `src/client/script/core/entities/delta/PickupDelta.js`,
                    `src/client/script/core/entities/delta/PlayerDelta.js`,
                    `src/client/script/core/entities/delta/ProjectileDelta.js`,

                    `src/client/script/core/entities/logic/EntityLogic.js`,
                    `src/client/script/core/entities/logic/BoatLogic.js`,
                    `src/client/script/core/entities/logic/ImpactLogic.js`,
                    `src/client/script/core/entities/logic/LandmarkLogic.js`,
                    `src/client/script/core/entities/logic/PickupLogic.js`,
                    `src/client/script/core/entities/logic/PlayerLogic.js`,
                    `src/client/script/core/entities/logic/ProjectileLogic.js`,

                    `src/client/script/core/entities/snap/EntitySnap.js`,
                    `src/client/script/core/entities/snap/BoatSnap.js`,
                    `src/client/script/core/entities/snap/ImpactSnap.js`,
                    `src/client/script/core/entities/snap/LandmarkSnap.js`,
                    `src/client/script/core/entities/snap/PickupSnap.js`,
                    `src/client/script/core/entities/snap/PlayerSnap.js`,
                    `src/client/script/core/entities/snap/ProjectileSnap.js`,

                    `src/client/script/core/entities/Entity.js`,
                    `src/client/script/core/entities/Boat.js`,
                    `src/client/script/core/entities/Impact.js`,
                    `src/client/script/core/entities/Landmark.js`,
                    `src/client/script/core/entities/Pickup.js`,
                    `src/client/script/core/entities/Player.js`,
                    `src/client/script/core/entities/Projectile.js`,

                    `src/client/script/core/geometry/geometryModules/loader.js`,
                    `src/client/script/core/geometry/geometryModules/particles.js`,
                    `src/client/script/core/geometry/geometryModules/water.js`,

                    `src/client/script/core/geometry/environment.js`,
                    `src/client/script/core/geometry/loadModels.js`,

                    `src/client/script/core/audio.js`,
                    `src/client/script/core/game.js`,

                    `src/client/script/main.js`,
                    `src/client/script/core/connection.js`
                ],
                dest: `src/client/build/dist.js`
            }
        },

        // Minify the source with webpack.
        webpack: {
            prod: webpackConfig.prod,
            dev: webpackConfig.dev
        },

        // Minify CSS
        cssmin: {
            styles: {
                files: [
                    // Gamestyle
                    {
                        expand: false,
                        src: [`src/client/styles/*.css`],
                        dest: process.env.NODE_ENV === `prod` ? `dist/build/gamestyles.min.css` : `src/client/build/gamestyles.min.css`,
                    },
                    // Libs CSS
                    {
                        expand: false,
                        src: [`src/client/assets/libs/css/*.css`],
                        dest: process.env.NODE_ENV === `prod` ? `dist/build/libs.min.css` : `src/client/build/libs.min.css`,
                    }
                ]
            }
        },

        // Copy files over to the static folder.
        copy: {
            dist: {
                files: [{
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/*`, `!src/client/*.html`],
                        dest: `dist/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: false,
                        cwd: `src/client/assets/`,
                        src: [`**`],
                        dest: `dist/assets/`,
                        filter: `isFile`
                    }
                ]
            }
        },

        // Clean up static folder and unminified client source.
        clean: {
            dist: [`dist/*`],
            preMinified: [`src/client/build/dist.js`]
        }
    });

    // Build production.
    grunt.registerTask(`build-dist`, [
        `clean:dist`,
        `concat:server`,
        `concat:client`,
        `cssmin:styles`,
        `webpack:prod`,
        `clean:preMinified`,
        `copy:dist`
    ]);

    // Build dev.
    grunt.registerTask(`build-dev`, [
        `clean:dist`,
        `concat:server`,
        `concat:client`,
        `cssmin:styles`,
        `webpack:dev`,
        `clean:preMinified`
    ]);

    // Load required npm tasks.
    grunt.loadNpmTasks(`grunt-contrib-concat`);
    grunt.loadNpmTasks(`grunt-contrib-copy`);
    grunt.loadNpmTasks(`grunt-contrib-clean`);
    grunt.loadNpmTasks(`grunt-webpack`);
    grunt.loadNpmTasks(`grunt-contrib-cssmin`);
};
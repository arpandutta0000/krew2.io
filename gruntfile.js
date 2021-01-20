const webpackConfig = require(`./webpack.config.js`);
const dotenv = require(`dotenv`).config();

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
                    `src/client/script/core/parseSnap.js`,

                    `src/client/script/core/controls/keyboard.js`,
                    `src/client/script/core/controls/controls.js`,

                    `src/client/script/core/window.js`,
                    `src/client/script/utils.js`,

                    `src/client/script/core/classes/logic/BoatLogic.js`,
                    `src/client/script/core/classes/logic/ImpactLogic.js`,
                    `src/client/script/core/classes/logic/LandmarkLogic.js`,
                    `src/client/script/core/classes/logic/PickupLogic.js`,

                    `src/client/script/core/classes/snap/EntitySnap.js`,
                    `src/client/script/core/classes/snap/BoatSnap.js`,
                    `src/client/script/core/classes/snap/ImpactSnap.js`,
                    `src/client/script/core/classes/snap/LandmarkSnap.js`,
                    `src/client/script/core/classes/snap/PickupSnap.js`,

                    `src/client/script/core/classes/Entity.js`,
                    `src/client/script/core/classes/Boat.js`,
                    `src/client/script/core/classes/Impact.js`,
                    `src/client/script/core/classes/Landmark.js`,
                    `src/client/script/core/classes/Pickup.js`,
                    `src/client/script/core/classes/Player.js`,
                    `src/client/script/core/classes/Projectile.js`,

                    `src/client/script/core/geometry/geometryModules/loader.js`,
                    `src/client/script/core/geometry/geometryModules/particles.js`,
                    `src/client/script/core/geometry/geometryModules/water.js`,

                    `src/client/script/core/geometry/environment.js`,
                    `src/client/script/core/geometry/geometry.js`,
                    `src/client/script/core/geometry/loadModels.js`,
                    `src/client/script/core/geometry/entity.js`,
                    `src/client/script/core/geometry/boat.js`,
                    `src/client/script/core/geometry/player.js`,

                    `src/client/script/core/audio.js`,
                    `src/client/script/core/economy.js`,
                    `src/client/script/core/game.js`,

                    `src/client/script/ui/ads.js`,
                    `src/client/script/ui/chatUi.js`,
                    `src/client/script/ui/experienceBar.js`,
                    `src/client/script/ui/gameplayUi.js`,
                    `src/client/script/ui/goodsUi.js`,
                    `src/client/script/ui/islandsUi.js`,
                    `src/client/script/ui/krewlistUi.js`,
                    `src/client/script/ui/minimap.js`,
                    `src/client/script/ui/preGameplayUi.js`,
                    `src/client/script/ui/ui.js`,

                    `src/client/script/main.js`,
                    `src/client/script/core/connection.js`
                ],
                dest: `src/client/script/${process.env.NODE_ENV == `prod` ? `dist.js` : `dist.min.js`}`
            }
        },

        // Clean up static folder and unminified client source.
        clean: {
            dist: [`dist/*`],
            preMinified: [`src/client/script/dist.js`]
        },

        // TODO: Minify the source with webpack.
        webpack: {
            prod: webpackConfig
        },

        // Watch for file changes.
        watch: {
            scripts: {
                files: [`**/*.js`, `!**/node_modules/**`, `**/*.css`, `**/*.html`],
                tasks: [`build-dev`],
                options: {
                    spawn: false
                }
            }
        },

        // Concurrently run watch and nodemon.
        concurrent: {
            dev: [
                `nodemon:dev`,
                `watch:scripts`
            ],
            options: {
                logConcurrentOutput: true
            }
        },

        // Use nodemon to restart the app.
        nodemon: {
            dev: {
                script: `src/server/app.js`,
                options: {
                    args: [`dev`],
                    nodeArgs: [`--inspect`]
                }
            }
        },

        // Copy files over to the static folder.
        copy: {
            dist: {
                files: [
                    {
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
                        flatten: true,
                        src: [`src/client/assets/css/*`],
                        dest: `dist/assets/css/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/fonts/*`],
                        dest: `dist/assets/fonts/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/img/*`],
                        dest: `dist/assets/img/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/js/*`],
                        dest: `dist/assets/js/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/libs/*`],
                        dest: `dist/assets/js/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/models/*`],
                        dest: `dist/assets/models/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/models/dogs/*`],
                        dest: `dist/assets/models/dogs/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/models/cannon/*`],
                        dest: `dist/assets/models/cannon/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/audio/*`],
                        dest: `dist/assets/audio/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/models/ships/*`],
                        dest: `dist/assets/models/ships/`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        flatten: true,
                        src: [`src/client/assets/models/sea_animals/*`],
                        dest: `dist/assets/models/sea_animals/`,
                        filter: `isFile`
                    }
                ]
            }
        }
    });

    // Build production.
    grunt.registerTask(`build-dist`, [
        `clean:dist`,
        `concat:server`,
        `concat:client`,
        `webpack:prod`,
        `clean:preMinified`,
        `copy:dist`
    ]);

    // Build dev.
    grunt.registerTask(`build-dev`, [
        `clean:dist`,
        `concat:server`,
        `concat:client`
    ]);

    // Run in dev.
    grunt.registerTask(`dev`, [`concurrent:dev`]);

    // Load required npm tasks.
    grunt.loadNpmTasks(`grunt-contrib-concat`);
    grunt.loadNpmTasks(`grunt-contrib-copy`);
    grunt.loadNpmTasks(`grunt-contrib-clean`);
    grunt.loadNpmTasks(`grunt-contrib-watch`);
    grunt.loadNpmTasks(`grunt-nodemon`);
    grunt.loadNpmTasks(`grunt-concurrent`);
    grunt.loadNpmTasks(`grunt-webpack`);
};
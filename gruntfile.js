// const webpackConfig = require(`./webpack.config.js`);

module.exports = (grunt => {
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
                    `src/client/script/core/core_client/config.js`,
                    `src/client/script/rangeInput.js`,

                    `src/client/assets/js/canvas.map.js`,
                    `src/client/libs/ua.js`,
                    `src/client/libs/keypress.min.js`,
                    `src/client/libs/OBJLoader.js`,
                    `src/client/libs/TGALoader.js`,
                    `src/client/libs/MTLLoader.js`,
                    `src/client/libs/socket.js`,

                    `src/client/script/environment.js`,
                    `src/client/script/window.js`,
                    `src/client/script/geometry.js`,
                    `src/client/script/loader.js`,
                    `src/client/script/keyboard.js`,
                    `src/client/script/controls.js`,

                    `src/client/script/core/core.js`,
                    `src/client/script/core/utils.js`,
                    `src/client/script/core/entity.js`,
                    `src/client/script/core/goodsTypes.js`,
                    `src/client/script/core/core_client/parseSnap.js`,
                    `src/client/script/core/boatTypes.js`,
                    `src/client/script/core/boat.js`,
                    `src/client/script/core/item.js`,
                    `src/client/script/core/player.js`,
                    `src/client/script/core/impact.js`,
                    `src/client/script/core/pickup.js`,
                    `src/client/script/core/landmark.js`,
                    `src/client/script/core/projectile.js`,

                    `src/client/script/core/core_client/entity.js`,
                    `src/client/script/core/core_client/boat.js`,
                    `src/client/script/core/core_client/player.js`,

                    `src/client/script/uiSuggestion.js`,
                    `src/client/script/uiKrewList.js`,
                    `src/client/script/uiGoods.js`,
                    `src/client/script/uiExperience.js`,

                    `src/client/script/ui.js`,
                    `src/client/script/main.js`,
                    `src/client/script/particles.js`,
                    `src/client/script/connection.js`
                ],
                dest: `dist/script/dist.js`
            }
        },

        // Clean up static folder and unminified client source.
        clean: {
            dist: [`dist/*`],
            preMinified: [`dist/script/dist.js`]
        },

        // Minify - ES5.
        uglify: {
            options: {
                mangle: {
                    except: [`jQuery`, `THREE`]
                },
            },
            dist: {
                files: {
                    'dist/script/dist.min.js': [`dist/script/dist.anonym.js`]
                }
            }
        },

        // TODO: Minify the source with webpack.
        // webpack: {
        //     prod: webpackConfig
        // },

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
                        src: [`src/client/assets/error-pages/*`],
                        dest: `dist/assets/error-pages/`,
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

    // Register task chains.
    // Build production.
    grunt.registerTask(`build-dist`, [
        `clean:dist`,
        `concat:server`,
        `concat:client`,
        `anonymous:dist`
        `uglify:dist`,
        `clean:preMinified`,
        `copy:dist`
    ]);

    // Build dev.
    grunt.registerTask(`build-dev`, [
        `clean:dist`,
        `concat:server`,
        `copy:dist`
    ]);

    // Run in dev.
    grunt.registerTask(`dev`, [`concurrent:dev`]);

    // Load required npm tasks.
    grunt.loadNpmTasks(`grunt-contrib-concat`);
    grunt.loadNpmTasks(`grunt-contrib-uglify`);
    grunt.loadNpmTasks(`grunt-contrib-copy`);
    grunt.loadNpmTasks(`grunt-contrib-clean`);
    grunt.loadNpmTasks(`grunt-contrib-watch`);
    grunt.loadNpmTasks(`grunt-nodemon`);
    grunt.loadNpmTasks(`grunt-concurrent`);
});
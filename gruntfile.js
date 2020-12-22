module.exports = grunt => {
    grunt.initConfig({
        pkg: grunt.file.readJSON(`package.json`),

        // add all files, libs etc together
        concat: {
            servercore: {
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
                    `src/server/core/postConcat.js`,
                ],
                dest: `src/server/core/core_concatenated.js`,
            },
            dist_scripts: {
                src: [
                    `src/client/script/core/core_client/core_client_config.js`,
                    `src/client/script/rangeInput.js`,
                    `src/client/assets/js/canvas.map.js`,
                    `src/client/libs/ua.js`,
                    `src/client/libs/firebase.js`,
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
                    `src/client/script/core/core_utils.js`,
                    `src/client/script/core/core_entity.js`,
                    `src/client/script/core/core_goods_types.js`,
                    `src/client/script/core/core_client/core_client_parseSnap.js`,
                    `src/client/script/core/core_boat_types.js`,
                    `src/client/script/core/core_boat.js`,
                    `src/client/script/core/core_item.js`,
                    `src/client/script/core/core_player.js`,
                    `src/client/script/core/core_impact.js`,
                    `src/client/script/core/core_pickup.js`,
                    `src/client/script/core/core_landmark.js`,
                    `src/client/script/core/core_projectile.js`,
                    `src/client/script/core/core_client/core_client_entity.js`,
                    `src/client/script/core/core_client/core_client_boat.js`,
                    `src/client/script/core/core_client/core_client_player.js`,
                    `src/client/script/ui_suggestion.js`,
                    `src/client/script/ui_krewlist.js`,
                    `src/client/script/ui_goods.js`,
                    `src/client/script/ui_experience.js`,
                    `src/client/script/ui.js`,
                    `src/client/script/main.js`,
                    `src/client/script/particles.js`,
                    `src/client/script/connection.js`,
                ],
                dest: `dist/script/dist.js`,
            },
        },

        anonymous: {
            dist: {
                options: {
                    params: [
                        [`window`, `w`],
                        [`document`, `d`],
                    ],
                },
                files: {
                    'dist/script/dist.anonym.js': [`dist/script/dist.js`],
                },
            },
        },

        // uglification
        uglify: {
            options: {
                mangle: {
                    reserved: [`jQuery`, `THREE`],
                },
            },
            dist: {
                files: {
                    'dist/script/dist.min.js': [`dist/script/dist.anonym.js`],
                },
            },
        },

        // watch for file changes
        watch: {
            scripts: {
                files: [`**/*.js`, `!**/node_modules/**`, `**/*.css`, `**/*.html`],
                tasks: [`build-dev`],
                options: {
                    spawn: false,
                },
            },
        },

        // concurrently runs several tasks
        concurrent: {
            dev: [
                `nodemon:dev`,
                `watch:scripts`,
            ],
            options: {
                logConcurrentOutput: true,
            },
        },

        // keeps node task running and restarts on watch
        nodemon: {
            dev: {
                script: `src/server/app.js`,
                options: {
                    args: [`dev`],
                    nodeArgs: [`--inspect`]
                },
            },
        },

        // copy files
        copy: {
            dist: {
                files: [

                    // copy texture / image files etc
                    /*  { expand: true, nonull: true, flatten: true, src: [`src/client/index_dist.html`], dest: `dist/`, rename: function (dest, src) { return `dist/index.html`; } }, */

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
                    },
                ],
            },
        },

        // clean up
        clean: {
            preUglified: [`dist/script/dist.js`, `dist/script/dist.anonym.js`],
            dist: `dist/*`,
        },

    });

    // register our task chains
    grunt.registerTask(`build-dist`, [
        `clean:dist`,
        `concat:servercore`,
        `concat:dist_scripts`,
        `anonymous:dist`,
        `uglify:dist`,
        `clean:preUglified`,
        `copy:dist`,
    ]);

    grunt.registerTask(`build-dev`, [
        `concat:servercore`,
        `concat:dev_index`,
    ]);

    grunt.registerTask(`dev`, [`concurrent:dev`]);

    // load all needed npm tasks
    grunt.loadNpmTasks(`grunt-contrib-concat`);
    grunt.loadNpmTasks(`grunt-contrib-uglify`);
    grunt.loadNpmTasks(`grunt-contrib-copy`);
    grunt.loadNpmTasks(`grunt-contrib-clean`);
    grunt.loadNpmTasks(`grunt-contrib-watch`);
    grunt.loadNpmTasks(`grunt-nodemon`);
    grunt.loadNpmTasks(`grunt-concurrent`);
    grunt.loadNpmTasks(`grunt-anonymous`);
};
const webpackConfig = require(`./webpack.config.js`);

module.exports = (grunt => {
    grunt.initConfig({
        pkg: grunt.file.readJSON(`package.json`),
        concat: {
            server_core: {
                src: [
                    `src/server/core/preConcat.js`,
                    `src/server/utils/mongoConnection.js`,
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
                dest: `_compiled/core.js`
            },
            dist_scripts: {
                src: [
                    `src/client/assets/js/core/client/config.js`,
                    `src/client/assets/js/rangeInput.js`,

                    `src/client/assets/js/canvas.map.js`,

                    `src/client/assets/js/libs/ua.js`,
                    `src/client/assets/js/libs/keypress.min.js`,
                    `src/client/assets/js/libs/OBJLoader.js`,
                    `src/client/assets/js/libs/TGALoader.js`,
                    `src/client/assets/js/libs/MTLLoader.js`,
                    `src/client/assets/js/libs/socket.io.js`,

                    `src/client/assets/js/core/environment.js`,
                    `src/client/assets/js/core/window.js`,
                    `src/client/assets/js/core/geometry.js`,
                    `src/client/assets/js/core/loader.js`,
                    `src/client/assets/js/core/keyboard.js`,
                    `src/client/assets/js/core/controls.js`,

                    `src/client/assets/js/core/_core/core.js`,
                    `src/client/assets/js/core/_core/utils.js`,
                    `src/client/assets/js/core/_core/entity.js`,
                    `src/client/assets/js/core/_core/goodsTypes.js`,
                    `src/client/assets/js/core/_core/client/parseSnap.js`,
                    `src/client/assets/js/core/_core/boatTypes.js`,
                    `src/client/assets/js/core/_core/boat.js`,
                    `src/client/assets/js/core/_core/item.js`,
                    `src/client/assets/js/core/_core/player.js`,
                    `src/client/assets/js/core/_core/impact.js`,
                    `src/client/assets/js/core/_core/pickup.js`,
                    `src/client/assets/js/core/_core/landmark.js`,
                    `src/client/assets/js/core/_core/projectile.js`,

                    `src/client/assets/js/core/_core/client/entity.js`,
                    `src/client/assets/js/core/_core/client/boat.js`,
                    `src/client/assets/js/core/_core/client/player.js`,

                    `src/client/assets/js/core/uiSuggestion.js`,
                    `src/client/assets/js/core/uiKrewList.js`,
                    `src/client/assets/js/core/uiGoods.js`,
                    `src/client/assets/js/core/uiExperience.js`,

                    `src/client/assets/js/ui.js`,
                    `src/client/assets/js/core/main.js`,
                    `src/client/assets/js/core/particles.js`,
                    `src/client/assets/js/core/connection.js`,
                ],
                dest: `_compiled/dist.js`
            }
        },
        clean: {
            dist: [`_compiled/`, `dist/`],
        },
        copy: {
            dist: {
                files: [
                    { expand: true, nonull: true, flatten: true, src: [`src/client/*`, `!src/client/*.html`], dest: `dist/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/css/*`], dest: `dist/assets/css/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/fonts/*`], dest: `dist/assets/fonts/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/img/*`], dest: `dist/assets/img/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/js/libs/*`], dest: `dist/assets/js/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/models/*`], dest: `dist/assets/models/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/models/dogs/*`], dest: `dist/assets/models/dogs/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/models/cannon/*`], dest: `dist/assets/models/cannon/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/audio/*`], dest: `dist/assets/audio/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/models/ships/*`], dest: `dist/assets/models/ships/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/error-pages/*`], dest: `dist/assets/error-pages/`, filter: `isFile` },
                    { expand: true, nonull: true, flatten: true, src: [`src/client/assets/models/sea_animals/*`], dest: `dist/assets/models/sea_animals/`, filter: `isFile` }
                ]
            }
        },
        webpack: {
            options: {
                stats: !process.env.NODE_ENV || process.env.NODE_ENV == `dev`
            },
            prod: webpackConfig
        }
    });

    grunt.registerTask(`build-dist`, [
        `clean:dist`,
        `copy:dist`, 
        `concat:server_core`,
        `concat:dist_scripts`,
        `webpack:prod`
    ]);
    grunt.registerTask(`build-dev`, [
        `clean:dist`,
        `copy:dist`,
        `concat:server_core`,
        `concat:dist_scripts`,
        `webpack:prod`
    ]);

    grunt.loadNpmTasks(`grunt-contrib-concat`);
    grunt.loadNpmTasks(`grunt-contrib-clean`);
    grunt.loadNpmTasks(`grunt-contrib-copy`);
    grunt.loadNpmTasks(`grunt-webpack`);
});
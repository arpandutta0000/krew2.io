const webpackConfig = require(`./webpack.config.js`);

module.exports = (grunt => {
    grunt.initConfig({
        pkg: grunt.file.readJSON(`package.json`),

        webpack: {
            options: {
                stats: !process.env.NODE_ENV || process.env.NODE_ENV == `development`
            },
            prod: webpackConfig,
            dev: Object.assign({ watch: true }, webpackConfig)
        }
    });

    grunt.loadNpmTasks(`grunt-webpack`);
});
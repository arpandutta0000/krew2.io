const Webpack = require(`webpack`);
const ClosurePlugin = require(`closure-webpack-plugin`);
const path = require(`path`);
const dotenv = require(`dotenv`).config();

let appMode = process.env.NODE_ENV;

module.exports = {
    prod: {
        mode: appMode === `prod` ? `production` : `development`,
        entry: [`./src/client/script/dist.js`],
        output: {
            path: path.resolve(__dirname, `dist/script`),
            filename: `dist.min.js`
        },
        plugins: [new Webpack.IgnorePlugin(/node_modules/)],
        optimization: {
            minimizer: [
                new ClosurePlugin({
                    mode: `AGGRESSIVE_BUNDLE`
                }, {
                    renaming: true
                })
            ],
            removeAvailableModules: true
        },
        target: `node`
    },

    dev: {
        mode: appMode === `prod` ? `production` : `development`,
        entry: [`./src/client/script/dist.min.js`],
        output: {
            path: path.resolve(__dirname, `src/client/script`),
            filename: `dist.min.js`
        },
        plugins: [new Webpack.IgnorePlugin(/node_modules/)],
        optimization: {
            minimizer: [
                new ClosurePlugin({
                    mode: `AGGRESSIVE_BUNDLE`
                }, {
                    renaming: true
                })
            ],
            removeAvailableModules: true
        },
        target: `node`
    }

};
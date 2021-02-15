const Webpack = require(`webpack`);
const ClosurePlugin = require(`closure-webpack-plugin`);
const path = require(`path`);
require(`dotenv`).config();

const appMode = process.env.NODE_ENV;

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
                    mode: `STANDARD`
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
        // mode: `production`, // Uncomment to test production build
        entry: [`./src/client/script/dist.js`],
        output: {
            path: path.resolve(__dirname, `src/client/script`),
            filename: `dist.min.js`
        },
        plugins: [new Webpack.IgnorePlugin(/node_modules/)],
        optimization: {
            minimizer: [
                new ClosurePlugin({
                    mode: `STANDARD`
                }, {
                    renaming: true
                })
            ],
            removeAvailableModules: true
        },
        target: `node`
    }

};

const Webpack = require(`webpack`);
const ClosurePlugin = require(`closure-webpack-plugin`);
const path = require(`path`);
require(`dotenv`).config();

const appMode = process.env.NODE_ENV;

module.exports = {
    client: {
        mode: `production`,
        entry: [`./dist/build/dist.js`],
        output: {
            path: path.resolve(__dirname, `dist/build`),
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
            removeAvailableModules: true,
            concatenateModules: false
        },
        target: `node`
    }
};

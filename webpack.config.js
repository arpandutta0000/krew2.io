const Webpack = require(`webpack`);
const path = require(`path`);
const dotenv = require(`dotenv`).config();

let appMode = process.env.NODE_ENV;

module.exports = {
    mode: appMode == `prod` ? `production` : `development`,
    entry: [`./src/client/script/dist.js`],
    output: {
        path: path.resolve(__dirname, `dist/script`),
        filename: `dist.min.js`
    },
    plugins: [new Webpack.IgnorePlugin(/node_modules/)],
    optimization: {
        minimize: true,
        removeAvailableModules: true
    },
    target: `node`
};

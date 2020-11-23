const Webpack = require(`webpack`);
const path = require(`path`);
const dotenv = require(`dotenv`).config();

module.exports = {
    mode: process.env.NODE_ENV == `prod` ? `production`: `development`,
    entry: path.resolve(__dirname, `_compiled/dist.js`),
    output: {
        path: path.resolve(__dirname, `dist/assets/js`),
        filename: `dist.min.js`
    },
    plugins: [new Webpack.IgnorePlugin(/node_modules/)],
    optimization: {
        minimize: true
    }
}
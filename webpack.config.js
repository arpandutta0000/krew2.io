const Webpack = require(`webpack`);
const path = require(`path`);
const dotenv = require(`dotenv`).config();

module.exports = {
    mode: `production`,
    entry: path.resolve(__dirname, `_compiled/dist.js`),
    output: {
        path: path.resolve(__dirname, `dist/assets/js`),
        filename: `dist.min.js`
    },
    plugins: [new Webpack.IgnorePlugin(/node_modules/)],
    optimization: {
        minimize: true,
        removeAvailableModules: true
    },
    target: `node`,
    module: {
        rules: [{
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }]
    }
}

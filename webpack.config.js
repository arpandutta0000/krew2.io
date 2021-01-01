const Webpack = require(`webpack`);
const path = require(`path`);
const dotenv = require(`dotenv`).config();

module.exports = {
    mode: `production`,
    entry: [
        `./src/client/script/core/core_client/config.js`,
        `./src/client/script/rangeInput.js`,

        `./src/client/libs/OBJLoader.js`,
        `./src/client/libs/TGALoader.js`,
        `./src/client/libs/MTLLoader.js`,

        `./src/client/script/environment.js`,
        `./src/client/script/window.js`,
        `./src/client/script/geometry.js`,
        `./src/client/script/loader.js`,
        `./src/client/script/keyboard.js`,
        `./src/client/script/controls.js`,

        `./src/client/script/core/core.js`,
        `./src/client/script/core/utils.js`,
        `./src/client/script/core/entity.js`,
        `./src/client/script/core/goodsTypes.js`,
        `./src/client/script/core/core_client/parseSnap.js`,
        `./src/client/script/core/boatTypes.js`,
        `./src/client/script/core/boat.js`,
        `./src/client/script/core/item.js`,
        `./src/client/script/core/player.js`,
        `./src/client/script/core/impact.js`,
        `./src/client/script/core/pickup.js`,
        `./src/client/script/core/landmark.js`,
        `./src/client/script/core/projectile.js`,

        `./src/client/script/core/core_client/entity.js`,
        `./src/client/script/core/core_client/boat.js`,
        `./src/client/script/core/core_client/player.js`,

        `./src/client/script/uiSuggestion.js`,
        `./src/client/script/uiKrewList.js`,
        `./src/client/script/uiGoods.js`,
        `./src/client/script/uiExperience.js`,

        `./src/client/script/ui.js`,
        `./src/client/script/main.js`,
        `./src/client/script/particles.js`,
        `./src/client/script/connection.js`
    ],
    output: {
        path: path.resolve(__dirname, `dist/script`),
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
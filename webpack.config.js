const path = require(`path`);

module.exports = {
    mode: `production`,
    entry: `dist/assets/js/dist.js`,
    output: {
        path: path.resolve(__dirname, `dist`),
        filename: `src.js`
    }
}
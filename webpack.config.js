const path = require(`path`);

module.exports = {
    mode: `production`,
    entry: path.resolve(__dirname, `_compiled/dist.js`),
    output: {
        path: path.resolve(__dirname, `dist/assets/js`),
        filename: `dist.min.js`
    }
}
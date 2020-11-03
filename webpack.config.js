const path = require(`path`);

module.exports = {
    mode: `production`,
    entry: path.resolve(__dirname, `dist/client/dist.js`),
    output: {
        path: path.resolve(__dirname, `dist/client`),
        filename: `dist.min.js`
    }
}
const log = require(`./log.js`);

let discordFilter = message => message
    .replace(`\``, `\\\``)
    .replace(`||`, `\\\|\\\|`)
    .replace(`_`, `\\_`)
    .replace(`*`, `\\*`);

module.exports = {
    discordFilter
};

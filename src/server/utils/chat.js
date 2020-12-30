const log = require(`./log.js`);

let discordFilter = message => {
    return message
        .replace(`\``, `\\\``)
        .replace(`||`, `\\\|\\\|`)
        .replace(`_`, `\\_`)
        .replace(`*`, `\\*`);
}

module.exports = {
    discordFilter
}
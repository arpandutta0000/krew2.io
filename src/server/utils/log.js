const fs = require(`fs`);
const dotenv = require(`dotenv`).config();
const config = require(`../config/config.js`);
const path = require(`path`);

module.exports = (color, content) => {
    // Create file.
    let logPath = path.resolve(__dirname, `../../../logs/game`);
    let logPathTree = path.resolve(__dirname, `../../../logs`);

    if(!fs.existsSync(logPathTree)) fs.mkdirSync(logPathTree);
    if(!fs.existsSync(logPath)) fs.mkdirSync(logPath);

    // Set timing variables.
    let time = new Date();
    let second = time.getSeconds().toString();
    let minute = time.getMinutes().toString();
    let hour = time.getHours().toString();
    let day = time.getDate().toString().padStart(2, `0`);
    let month = (time.getMonth() + 1).toString().padStart(2, `0`);
    let year = time.getFullYear().toString();
    let formattedTime = `${month}-${day}-${year} ${hour}:${minute}:${second}`;

    let logFile = fs.createWriteStream(`${logPath}/game.log`);

    // Get specified color.
    let logColor;
    switch(color) {
        case `black`: logColor = `\x1b[30m`; break;
        case `red`: logColor = `\x1b[31m`; break;
        case `green`: logColor = `\x1b[32m`; break;
        case `yellow`: logColor = `\x1b[33m`; break;
        case `blue`: logColor = `\x1b[34m`; break;
        case `magenta`: logColor = `\x1b[35m`; break;
        case `cyan`: logColor = `\x1b[36m`; break;
        case `white`: logColor = `\x1b[37m`; break;
    }

    // If no color specified, throw an error.
    if(!logColor) throw `Did not specify a valid color`;

    logFile.write(`[${formattedTime}] >> ${content}`.replace(/\r?\n|\r/g, ``) + `\n`);
    return console.log(logColor, content);
}
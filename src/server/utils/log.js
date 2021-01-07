const fs = require(`fs`);
const dotenv = require(`dotenv`).config();

module.exports = (color, ...content) => {
    // Set timing variables.
    let time = new Date();
    let second = time.getSeconds().toString().padStart(2, `0`);;
    let minute = time.getMinutes().toString().padStart(2, `0`);;
    let hour = time.getHours().toString().padStart(2, `0`);;
    let day = time.getDate().toString().padStart(2, `0`);
    let month = (time.getMonth() + 1).toString().padStart(2, `0`);
    let year = time.getFullYear().toString();
    let formattedTime = `[${month}-${day}-${year} ${hour}:${minute}:${second}]`;

    // Get specified color.
    let logColor;
    switch (color) {
        case `black`:
            logColor = `\x1b[30m`;
            break;
        case `red`:
            logColor = `\x1b[31m`;
            break;
        case `green`:
            logColor = `\x1b[32m`;
            break;
        case `yellow`:
            logColor = `\x1b[33m`;
            break;
        case `blue`:
            logColor = `\x1b[34m`;
            break;
        case `magenta`:
            logColor = `\x1b[35m`;
            break;
        case `cyan`:
            logColor = `\x1b[36m`;
            break;
        case `white`:
            logColor = `\x1b[37m`;
            break;
    }

    let logContent = ``;
    for (const arg of content) {
        if (typeof arg == `object`) {
            logContent += JSON.stringify(arg);
        } else {
            logContent += arg.toString();
        }
    }

    // If no color specified, throw an error.
    if (!logColor) return;
    return console.log(logColor, formattedTime, logContent);
}
const getTimestamp = () => {
    return `${new Date().toUTCString} |`;
}

module.exports = getTimestamp;
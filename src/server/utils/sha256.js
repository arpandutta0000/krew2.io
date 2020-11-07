const bcrypt = require(`bcrypt`);
const salt = 12;

module.exports.hash = async pwd => {
    return await bcrypt.hash(pwd, salt);
}
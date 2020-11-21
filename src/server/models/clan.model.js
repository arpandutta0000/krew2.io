const Mongoose = require(`mongoose`);

let clanSchema = Mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    tag: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        required: true
    },
    leaders: {
        type: Array,
        required: true
    },
    assistants: {
        type: Array,
        required: true
    }
});

module.exports = Mongoose.model(`Clan`, clanSchema);
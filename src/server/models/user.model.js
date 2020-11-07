const Mongoose = require(`mongoose`);

let clanSchema = Mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    creationIP: {
        type: String,
        required: true
    },
    lastIP: {
        type: String,
        required: true
    },
    creationDate: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    clan: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model(clanSchema);
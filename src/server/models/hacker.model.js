const Mongoose = require(`mongoose`);

let hackerSchema = Mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    IP: {
        type: String,
        required: true
    }
});

module.exports = Mongoose.model(`HackerSchema`, hackerSchema);

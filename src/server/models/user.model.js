const Mongoose = require(`mongoose`);

let userSchema = Mongoose.Schema({
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
    highscore: {
        type: Number,
        required: true
    },
    clan: {
        type: String,
        required: true
    },
    clanRequest: {
        type: String,
        required: true
    }
});

module.exports = Mongoose.model(`User`, userSchema);

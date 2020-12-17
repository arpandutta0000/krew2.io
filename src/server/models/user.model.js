const Mongoose = require(`mongoose`);

const plMongoose = require(`passport-local-mongoose`);
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
userSchema.plugin(plMongoose);

module.exports = Mongoose.model(`User`, userSchema);

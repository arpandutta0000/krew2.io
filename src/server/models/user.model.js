const Mongoose = require(`mongoose`);

let userSchema = Mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: false
    },
    verified: {
        type: Boolean,
        required: false
    },
    verifyToken: {
        type: String,
        required: false
    },
    creationIP: {
        type: String,
        required: false
    },
    lastIP: {
        type: String,
        required: false
    },
    creationDate: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    newPassword: {
        type: String,
        required: false
    },
    newPasswordToken: {
        type: String,
        required: false
    },
    highscore: {
        type: Number,
        required: true
    },
    clan: {
        type: String,
        required: false
    },
    clanRequest: {
        type: String,
        required: false
    }
});

module.exports = Mongoose.model(`User`, userSchema);
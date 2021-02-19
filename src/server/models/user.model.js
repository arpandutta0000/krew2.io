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
    lastModified: {
        type: Date,
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
    },
    bankDeposit: {
        type: Number,
        required: false
    },
    fpMode: {
        type: Boolean,
        required: false
    },
    fov: {
        type: Number,
        required: false
    },
    musicVolume: {
        type: Number,
        required: false
    },
    sfxVolume: {
        type: Number,
        required: false
    },
    viewSails: {
        type: Boolean,
        required: false
    },
    qualityMode: {
        type: Number,
        required: false
    },
    defaultKrewName: {
        type: String,
        required: false
    },
    playerModel: {
        type: Number,
        required: false
    },
    hatModel: {
        type: Number,
        required: false
    }
});

module.exports = Mongoose.model(`User`, userSchema);

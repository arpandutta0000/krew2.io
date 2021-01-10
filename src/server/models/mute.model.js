const Mongoose = require(`mongoose`);

let muteSchema = Mongoose.Schema({ // TODO: Use for IP muting instead of session muting.
    timestamp: {
        type: Date,
        required: false
    },
    username: {
        type: String,
        required: true
    },
    IP: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: false
    }
});

module.exports = Mongoose.model(`Mute`, muteSchema);

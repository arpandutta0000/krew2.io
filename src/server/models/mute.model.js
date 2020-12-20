const Mongoose = require(`mongoose`);

let muteSchema = Mongoose.Schema({ // To be used when muting is moved to IP muting.
    timestamp: {
        type: Date,
        required: false
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
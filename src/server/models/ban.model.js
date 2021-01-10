const Mongoose = require(`mongoose`);

let banSchema = Mongoose.Schema({
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

module.exports = Mongoose.model(`Ban`, banSchema);

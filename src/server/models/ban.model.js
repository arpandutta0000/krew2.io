const Mongoose = require(`mongoose`);

let banSchema = Mongoose.Schema({
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

module.exports = Mongoose.model(`Ban`, banSchema);
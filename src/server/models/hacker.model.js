const Mongoose = require(`mongoose`);

let banSchema = Mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    IP: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model(banSchema);
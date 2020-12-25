const Mongoose = require(`mongoose`);

let playerRestoreSchema = Mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    IP: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    gold: {
        type: Number,
        required: true
    },
    experience: {
        type: Number,
        required: false
    },
    points: {
        type: Object,
        required: false
    },
    score: {
        type: Number,
        required: false
    },
    shipsSank: {
        type: Number,
        required: false
    },
    deaths: {
        type: Number,
        required: false
    },
    totalDamage: {
        type: Number,
        required: false
    },
    overall_kills: {
        type: Number,
        required: false
    },
    isCaptain: {
        type: Boolean,
        required: false
    },
    itemId: {
        type: Number,
        required: false
    },
    bonus: {
        fireRate: {
            type: Number,
            required: false
        },
        distance: {
            type: Number,
            required: false
        },
        damage: {
            type: Number,
            required: false
        },
        speed: {
            type: Number,
            required: false
        }
    }
});

module.exports = Mongoose.model(`PlayerRestore`, playerRestoreSchema);
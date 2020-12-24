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
        required: true
    },
    points: {
        type: Object,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    shipsSank: {
        type: Number,
        required: true
    },
    deaths: {
        type: Number,
        required: true
    },
    totalDamage: {
        type: Number,
        required: true
    },
    overallKills: {
        type: Number,
        required: true
    },
    isCaptain: {
        type: Boolean,
        required: true
    },
    itemId: {
        type: Number,
        required: true
    },
    bonus: {
        fireRate: {
            type: Number,
            required: true
        },
        distance: {
            type: Number,
            required: true
        },
        damage: {
            type: Number,
            required: true
        },
        speed: {
            type: Number,
            required: true
        }
    }
});

module.exports = Mongoose.model(`PlayerRestore`, playerRestoreSchema);
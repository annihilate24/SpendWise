const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    fromMember: {
        type: String,
        required: true,
        trim: true
    },
    toMember: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settlement', settlementSchema);
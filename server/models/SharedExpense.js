const mongoose = require('mongoose');

const sharedExpenseSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    paidBy: {
        type: String,
        required: true,
        trim: true
    },
    participants: [{
        type: String,
        required: true,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SharedExpense', sharedExpenseSchema);

const mongoose = require('mongoose');

const sharedRoomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true,
        trim: true
    },

    roomCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    createdBy: {
        type: String,
        required: true,
        trim: true
    },

    members: [
        {
            name: {
                type: String,
                required: true,
                trim: true
            },
            joinedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SharedRoom', sharedRoomSchema);

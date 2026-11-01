
const express = require('express');
const crypto = require('crypto');
const SharedRoom = require('../models/SharedRoom');

const router = express.Router();

// Generate a unique room code
const generateRoomCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// 1. Create a new shared room
router.post('/', async (req, res) => {
    try {
        const { roomName, createdBy } = req.body;

        if (!roomName || !createdBy) {
            return res.status(400).json({
                message: 'Room name and creator name are required.'
            });
        }

        let roomCode;
        let existingRoom;

        do {
            roomCode = generateRoomCode();
            existingRoom = await SharedRoom.findOne({ roomCode });
        } while (existingRoom);

        const newRoom = new SharedRoom({
            roomName: roomName.trim(),
            roomCode,
            createdBy: createdBy.trim(),
            members: [{ name: createdBy.trim() }]
        });

        await newRoom.save();

        res.status(201).json({
            message: 'Shared room created successfully!',
            room: newRoom
        });

    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({
            message: 'Unable to create shared room.'
        });
    }
});

// 2. Join an existing shared room
router.post('/join', async (req, res) => {
    try {
        const { roomCode, memberName } = req.body;

        if (!roomCode || !memberName) {
            return res.status(400).json({
                message: 'Room code and member name are required.'
            });
        }

        const room = await SharedRoom.findOne({
            roomCode: roomCode.trim().toUpperCase()
        });

        if (!room) {
            return res.status(404).json({
                message: 'Shared room not found.'
            });
        }

        const alreadyMember = room.members.some(
            (member) =>
                member.name.toLowerCase() === memberName.trim().toLowerCase()
        );

        if (alreadyMember) {
            return res.status(400).json({
                message: 'This member has already joined the room.'
            });
        }

        room.members.push({
            name: memberName.trim()
        });

        await room.save();

        res.status(200).json({
            message: 'Joined shared room successfully!',
            room
        });

    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({
            message: 'Unable to join shared room.'
        });
    }
});

// 3. Get all shared rooms for a member
router.get('/member', (req, res) => {
    return res.status(400).json({
        message: 'Member name parameter is required.',
        rooms: []
    });
});

router.get('/member/:memberName', async (req, res) => {
    try {
        const { memberName } = req.params;

        if (!memberName || !memberName.trim()) {
            return res.status(400).json({
                message: 'Member name is required.',
                rooms: []
            });
        }

        const trimmedName = memberName.trim();
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const memberRegex = new RegExp(`^${escapedName}$`, 'i');

        // Search for rooms where the member is the creator OR in the members array.
        // MongoDB's $or guarantees no duplicate rooms in the result.
        const rooms = await SharedRoom.find({
            $or: [
                { createdBy: { $regex: memberRegex } },
                { 'members.name': { $regex: memberRegex } }
            ]
        }).sort({ createdAt: -1 });

        if (!rooms || rooms.length === 0) {
            return res.status(200).json({
                message: `No shared rooms found for "${trimmedName}".`,
                rooms: []
            });
        }

        res.status(200).json({
            message: 'Shared rooms retrieved successfully.',
            rooms
        });

    } catch (error) {
        console.error('Get rooms by member error:', error);
        res.status(500).json({
            message: 'Unable to retrieve shared rooms.',
            error: error.message
        });
    }
});

// 4. Get room details and members
router.get('/:roomCode', async (req, res) => {
    try {
        const room = await SharedRoom.findOne({
            roomCode: req.params.roomCode.toUpperCase()
        });

        if (!room) {
            return res.status(404).json({
                message: 'Shared room not found.'
            });
        }

        res.status(200).json({
            message: 'Room details retrieved successfully.',
            room
        });

    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({
            message: 'Unable to retrieve room details.'
        });
    }
});

module.exports = router;

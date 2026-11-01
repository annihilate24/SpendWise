const express = require('express');
const router = express.Router();

const Settlement = require('../models/Settlement');
const SharedRoom = require('../models/SharedRoom');

// Add a settlement payment
router.post('/:roomCode', async (req, res) => {
    try {
        const { fromMember, toMember, amount } = req.body;
        const roomCode = req.params.roomCode.toUpperCase();

        const room = await SharedRoom.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!fromMember || !toMember || !amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Please provide valid settlement details' });
        }

        const fromExists = room.members.some(
            member => member.name.toLowerCase() === fromMember.trim().toLowerCase()
        );

        const toExists = room.members.some(
            member => member.name.toLowerCase() === toMember.trim().toLowerCase()
        );

        if (!fromExists || !toExists) {
            return res.status(400).json({ message: 'Both members must belong to this room' });
        }

        if (fromMember.trim().toLowerCase() === toMember.trim().toLowerCase()) {
            return res.status(400).json({ message: 'A member cannot pay themselves' });
        }

        const settlement = new Settlement({
            roomCode,
            fromMember: fromMember.trim(),
            toMember: toMember.trim(),
            amount: Number(amount)
        });

        await settlement.save();

        res.status(201).json({
            message: 'Settlement recorded successfully',
            settlement
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error recording settlement',
            error: error.message
        });
    }
});

// Get all settlements in a room
router.get('/:roomCode', async (req, res) => {
    try {
        const roomCode = req.params.roomCode.toUpperCase();

        const room = await SharedRoom.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const settlements = await Settlement.find({ roomCode }).sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Settlements fetched successfully',
            settlements
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching settlements',
            error: error.message
        });
    }
});

// Delete a settlement
router.delete('/:roomCode/:settlementId', async (req, res) => {
    try {
        const roomCode = req.params.roomCode.toUpperCase();
        const { settlementId } = req.params;

        const room = await SharedRoom.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const settlement = await Settlement.findOneAndDelete({
            _id: settlementId,
            roomCode
        });

        if (!settlement) {
            return res.status(404).json({ message: 'Settlement not found' });
        }

        res.status(200).json({
            message: 'Settlement deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting settlement',
            error: error.message
        });
    }
});

module.exports = router;
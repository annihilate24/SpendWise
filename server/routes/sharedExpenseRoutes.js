
const express = require('express');
const router = express.Router();

const SharedExpense = require('../models/SharedExpense');
const SharedRoom = require('../models/SharedRoom');

// Validate members and return their official room names
const validateMembers = (room, participants) => {
    if (!Array.isArray(participants) || participants.length === 0) {
        return {
            valid: false,
            message: 'Please select at least one participant'
        };
    }

    const selectedMembers = [];

    for (const participant of participants) {
        if (typeof participant !== 'string' || !participant.trim()) {
            return {
                valid: false,
                message: 'Invalid participant name'
            };
        }

        const member = room.members.find(
            item =>
                item.name.toLowerCase() === participant.trim().toLowerCase()
        );

        if (!member) {
            return {
                valid: false,
                message: `${participant} is not a member of this room`
            };
        }

        // Prevent duplicate participants
        if (!selectedMembers.includes(member.name)) {
            selectedMembers.push(member.name);
        }
    }

    return {
        valid: true,
        participants: selectedMembers
    };
};

// Add a shared expense
router.post('/:roomCode', async (req, res) => {
    try {
        const roomCode = req.params.roomCode.toUpperCase();

        const { title, amount, category, paidBy, participants } = req.body;

        const room = await SharedRoom.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({
                message: 'Room not found'
            });
        }

        if (
            !title?.trim() ||
            !category?.trim() ||
            !paidBy?.trim() ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                message: 'Please provide valid expense details'
            });
        }

        const payer = room.members.find(
            member =>
                member.name.toLowerCase() === paidBy.trim().toLowerCase()
        );

        if (!payer) {
            return res.status(400).json({
                message: 'The person who paid must belong to this room'
            });
        }

        const validation = validateMembers(room, participants);

        if (!validation.valid) {
            return res.status(400).json({
                message: validation.message
            });
        }

        const expense = new SharedExpense({
            roomCode,
            title: title.trim(),
            amount: Number(amount),
            category: category.trim(),
            paidBy: payer.name,
            participants: validation.participants
        });

        await expense.save();

        res.status(201).json({
            message: 'Shared expense added successfully',
            expense
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error adding shared expense',
            error: error.message
        });
    }
});

// Get all shared expenses in a room
router.get('/:roomCode', async (req, res) => {
    try {
        const roomCode = req.params.roomCode.toUpperCase();

        const room = await SharedRoom.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({
                message: 'Room not found'
            });
        }

        const expenses = await SharedExpense.find({ roomCode })
            .sort({ createdAt: -1 })
            .lean();

        // Older expenses without participants are treated as
        // expenses shared by all current room members.
        const updatedExpenses = expenses.map(expense => ({
            ...expense,
            participants:
                expense.participants?.length > 0
                    ? expense.participants
                    : room.members.map(member => member.name)
        }));

        res.status(200).json({
            message: 'Shared expenses fetched successfully',
            expenses: updatedExpenses
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error fetching shared expenses',
            error: error.message
        });
    }
});

// Update a shared expense
router.put('/:roomCode/:expenseId', async (req, res) => {
    try {
        const roomCode = req.params.roomCode.toUpperCase();
        const { expenseId } = req.params;

        const { title, amount, category, paidBy, participants } = req.body;

        const room = await SharedRoom.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({
                message: 'Room not found'
            });
        }

        if (
            !title?.trim() ||
            !category?.trim() ||
            !paidBy?.trim() ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                message: 'Please provide valid expense details'
            });
        }

        const payer = room.members.find(
            member =>
                member.name.toLowerCase() === paidBy.trim().toLowerCase()
        );

        if (!payer) {
            return res.status(400).json({
                message: 'The person who paid must belong to this room'
            });
        }

        const validation = validateMembers(room, participants);

        if (!validation.valid) {
            return res.status(400).json({
                message: validation.message
            });
        }

        const updatedExpense = await SharedExpense.findOneAndUpdate(
            {
                _id: expenseId,
                roomCode
            },
            {
                title: title.trim(),
                amount: Number(amount),
                category: category.trim(),
                paidBy: payer.name,
                participants: validation.participants
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                message: 'Shared expense not found'
            });
        }

        res.status(200).json({
            message: 'Shared expense updated successfully',
            expense: updatedExpense
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error updating shared expense',
            error: error.message
        });
    }
});

// Delete a shared expense
router.delete('/:roomCode/:expenseId', async (req, res) => {
    try {
        const roomCode = req.params.roomCode.toUpperCase();
        const { expenseId } = req.params;

        const room = await SharedRoom.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({
                message: 'Room not found'
            });
        }

        const deletedExpense = await SharedExpense.findOneAndDelete({
            _id: expenseId,
            roomCode
        });

        if (!deletedExpense) {
            return res.status(404).json({
                message: 'Shared expense not found'
            });
        }

        res.status(200).json({
            message: 'Shared expense deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error deleting shared expense',
            error: error.message
        });
    }
});

module.exports = router;

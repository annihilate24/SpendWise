const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Models
const Expense = require('./models/Expense');

// Routes
const sharedRoomRoutes = require('./routes/sharedRoomRoutes');
const sharedExpenseRoutes = require('./routes/sharedExpenseRoutes');
const settlementRoutes = require('./routes/settlementRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((error) => {
        console.log('MongoDB connection error:', error.message);
    });

// Personal Expense APIs

// GET all expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Expenses fetched successfully',
            expenses
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching expenses',
            error: error.message
        });
    }
});

// POST a new expense
app.post('/api/expenses', async (req, res) => {
    try {
        const { title, amount, category } = req.body;

        const expense = new Expense({
            title,
            amount,
            category
        });

        await expense.save();

        res.status(201).json({
            message: 'Expense added successfully',
            expense
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error adding expense',
            error: error.message
        });
    }
});

// PUT - Update an expense
app.put('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const updatedExpense = await Expense.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            message: 'Expense updated successfully',
            expense: updatedExpense
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating expense',
            error: error.message
        });
    }
});

// DELETE an expense
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedExpense = await Expense.findByIdAndDelete(id);

        if (!deletedExpense) {
            return res.status(404).json({
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting expense',
            error: error.message
        });
    }
});

// Shared Room APIs
app.use('/api/rooms', sharedRoomRoutes);

// Shared Expense APIs
app.use('/api/shared-expenses', sharedExpenseRoutes);

// Settlement APIs
app.use('/api/settlements', settlementRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('SpendWise API is running!');
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
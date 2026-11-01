
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/shared-expenses';

// Add a shared expense
export const addSharedExpense = async (roomCode, expense) => {
    const response = await axios.post(
        `${API_URL}/${roomCode}`,
        expense
    );

    return response.data;
};

// Get all shared expenses
export const getSharedExpenses = async (roomCode) => {
    const response = await axios.get(
        `${API_URL}/${roomCode}`
    );

    return response.data;
};

// Update a shared expense
export const updateSharedExpense = async (roomCode, expenseId, expense) => {
    const response = await axios.put(
        `${API_URL}/${roomCode}/${expenseId}`,
        expense
    );

    return response.data;
};

// Delete a shared expense
export const deleteSharedExpense = async (roomCode, expenseId) => {
    const response = await axios.delete(
        `${API_URL}/${roomCode}/${expenseId}`
    );

    return response.data;
};

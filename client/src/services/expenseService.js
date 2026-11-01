
import axios from 'axios';

// Backend API URL
const API_URL = 'http://localhost:5000/api/expenses';

// GET: Fetch all expenses
export const getExpenses = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// POST: Add a new expense
export const addExpense = async (expense) => {
    const response = await axios.post(API_URL, expense);
    return response.data;
};

// PUT: Update an existing expense
export const updateExpense = async (id, expense) => {
    const response = await axios.put(`${API_URL}/${id}`, expense);
    return response.data;
};

// DELETE: Remove an expense
export const deleteExpense = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

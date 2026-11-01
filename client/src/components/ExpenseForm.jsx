
import { useState } from 'react';
import { addExpense } from '../services/expenseService';

function ExpenseForm({ onExpenseAdded }) {

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');

        try {
            const expense = {
                title,
                amount: Number(amount),
                category
            };

            await addExpense(expense);

            // Clear the form
            setTitle('');
            setAmount('');
            setCategory('');

            // Refresh the expense list
            onExpenseAdded();

        } catch (error) {
            console.error('Error adding expense:', error);
            setError('Unable to add expense. Please try again.');
        }
    };

    return (
        <div className="expense-form-component">
            <h2>Add New Expense</h2>

            <form className="expense-form" onSubmit={handleSubmit}>

                <div className="form-field">
                    <label>Expense Title</label>
                    <input
                        aria-label="Expense title"
                        type="text"
                        placeholder="Enter expense name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="form-field">
                    <label>Amount (₹)</label>
                    <input
                        aria-label="Expense amount in rupees"
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <div className="form-field">
                    <label>Category</label>
                    <select
                        aria-label="Expense category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Education">Education</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <button type="submit">Add Expense</button>

                {error && <p className="error-message" role="alert">{error}</p>}

            </form>
        </div>
    );
}

export default ExpenseForm;

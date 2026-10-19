import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const fetchExpenses = () => {
    axios
      .get('http://localhost:5000/api/expenses')
      .then((response) => {
        setExpenses(response.data);
      })
      .catch((error) => {
        console.error('Error fetching expenses:', error);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    const newExpense = {
      title: title,
      amount: amount,
      category: category
    };

    axios
      .post('http://localhost:5000/api/expenses', newExpense)
      .then(() => {
        setTitle('');
        setAmount('');
        setCategory('Food');
        fetchExpenses();
      })
      .catch((error) => {
        console.error('Error adding expense:', error);
      });
  };

  return (
    <div>
      <h1>SpendWise</h1>
      <p>Track your expenses. Manage your money.</p>

      <h2>Add New Expense</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title: </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div>
          <label>Amount: </label>
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div>
          <label>Category: </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Education">Education</option>
            <option value="Shopping">Shopping</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button type="submit">Add Expense</button>
      </form>

      <h2>Your Expenses</h2>

      {expenses.map((expense) => (
        <div key={expense.id}>
          <h3>{expense.title}</h3>
          <p>Amount: ₹{expense.amount}</p>
          <p>Category: {expense.category}</p>
        </div>
      ))}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';

import ExpenseForm from './components/ExpenseForm';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseChart from './components/ExpenseChart';
import SharedRooms from './components/SharedRooms';
import { getLastOpenedRoomCode, getSavedRooms, getSavedMemberName } from './services/sharedRoomService';

import {
    getExpenses,
    updateExpense,
    deleteExpense
} from './services/expenseService';

import './App.css';

function App() {
    const [expenses, setExpenses] = useState([]);
    const [activePage, setActivePage] = useState(() =>
        getLastOpenedRoomCode() || getSavedRooms().length > 0 || getSavedMemberName()
            ? 'Shared Rooms'
            : 'Dashboard'
    );
    const [dateFilter, setDateFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch personal expenses
    const fetchExpenses = async () => {
        try {
            setError('');

            const data = await getExpenses();

            // Handle both array responses and object responses
            const expenseList = Array.isArray(data)
                ? data
                : Array.isArray(data?.expenses)
                    ? data.expenses
                    : [];

            setExpenses(expenseList);
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setError(
                err.response?.data?.message ||
                'Unable to load expenses. Please try again.'
            );
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    // Load expenses when the application starts
    useEffect(() => {
        fetchExpenses();
    }, []);

    // Delete personal expense
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this expense?'
        );

        if (!confirmDelete) return;

        try {
            await deleteExpense(id);
            await fetchExpenses();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to delete expense.'
            );
        }
    };

    // Edit personal expense
    const handleEdit = async (expense) => {
        const newTitle = window.prompt(
            'Enter expense title:',
            expense.title
        );

        if (newTitle === null) return;

        const newAmount = window.prompt(
            'Enter amount:',
            expense.amount
        );

        if (newAmount === null) return;

        const newCategory = window.prompt(
            'Enter category:',
            expense.category
        );

        if (newCategory === null) return;

        if (
            !newTitle.trim() ||
            !newCategory.trim() ||
            !Number.isFinite(Number(newAmount)) ||
            Number(newAmount) <= 0
        ) {
            setError('Please enter valid expense details.');
            return;
        }

        try {
            setError('');

            await updateExpense(expense._id, {
                title: newTitle.trim(),
                amount: Number(newAmount),
                category: newCategory.trim()
            });

            await fetchExpenses();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update expense.'
            );
        }
    };

    // Filter expenses based on selected date
    const getFilteredExpenses = () => {
        if (!Array.isArray(expenses)) return [];

        const today = new Date();
        const startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        return expenses.filter((expense) => {
            const expenseDate = new Date(expense.createdAt);

            if (Number.isNaN(expenseDate.getTime())) {
                return false;
            }

            // Date filtering
            let matchesDate = true;

            if (dateFilter === 'Today') {
                matchesDate = expenseDate >= startOfToday;
            } else if (dateFilter === 'This Week') {
                const startOfWeek = new Date(startOfToday);
                const day = startOfWeek.getDay();

                startOfWeek.setDate(
                    startOfWeek.getDate() - day
                );

                matchesDate = expenseDate >= startOfWeek;
            } else if (dateFilter === 'This Month') {
                matchesDate =
                    expenseDate.getMonth() === today.getMonth() &&
                    expenseDate.getFullYear() === today.getFullYear();
            }

            // Search filtering
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                expense.title?.toLowerCase().includes(search) ||
                expense.category?.toLowerCase().includes(search) ||
                String(expense.amount).includes(search);

            return matchesDate && matchesSearch;
        });
    };

    const filteredExpenses = getFilteredExpenses();

    // Sidebar navigation
    const menuItems = [
        'Dashboard',
        'Add Expense',
        'Expense Summary',
        'Transactions',
        'Shared Rooms'
    ];

    return (
        <div className="app-container">

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand-lockup">
                    <span className="brand-mark" aria-hidden="true">SW</span>
                    <h2 className="logo">SpendWise</h2>
                </div>

                <nav aria-label="Main navigation">
                    {menuItems.map((item) => (
                        <button
                            key={item}
                            type="button"
                            aria-current={activePage === item ? 'page' : undefined}
                            className={
                                activePage === item
                                    ? 'nav-item active'
                                    : 'nav-item'
                            }
                            onClick={() => {
                                setActivePage(item);
                                setError('');
                            }}
                        >
                            {item}
                        </button>
                    ))}
                </nav>
                <p className="sidebar-footer">Your spending, thoughtfully organised.</p>
            </aside>

            {/* Main Content */}
            <main className="main-content">

                <header className="dashboard-header">
                    <div className="header-copy">
                        <span className="eyebrow">Personal finance</span>
                        <h1>{activePage}</h1>
                        <p>Manage your expenses smartly with SpendWise.</p>
                    </div>
                </header>

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="loading-state" role="status">
                        <span className="loading-spinner" aria-hidden="true" />
                        <span>Loading your expenses...</span>
                    </div>
                ) : (
                    <>
                        {/* Dashboard */}
                        {activePage === 'Dashboard' && (
                            <div className="dashboard-page">

                                <ExpenseSummary
                                    expenses={expenses}
                                />

                                <div className="dashboard-overview-grid">
                                    <section className="dashboard-panel">
                                        <ExpenseChart
                                            expenses={expenses}
                                        />
                                    </section>

                                    <section className="recent-transactions">
                                    <h2>Recent Transactions</h2>

                                    {expenses.length === 0 ? (
                                        <p>No expenses added yet.</p>
                                    ) : (
                                        [...expenses]
                                            .sort(
                                                (a, b) =>
                                                    new Date(b.createdAt) -
                                                    new Date(a.createdAt)
                                            )
                                            .slice(0, 5)
                                            .map((expense) => (
                                                <div
                                                    className="transaction-item"
                                                    key={expense._id}
                                                >
                                                    <div className="transaction-copy">
                                                        <h4>
                                                            {expense.title}
                                                        </h4>
                                                        <p>
                                                            {expense.category}
                                                        </p>
                                                    </div>

                                                    <strong>
                                                        ₹{Number(
                                                            expense.amount
                                                        ).toFixed(2)}
                                                    </strong>
                                                </div>
                                            ))
                                    )}
                                    </section>
                                </div>

                            </div>
                        )}

                        {/* Add Expense */}
                        {activePage === 'Add Expense' && (
                            <div className="add-expense-page">
                                <section className="expense-form-card">
                                    <p>Record a purchase and keep your spending organised.</p>
                                <ExpenseForm
                                    onExpenseAdded={fetchExpenses}
                                />
                                </section>
                            </div>
                        )}

                        {/* Expense Summary */}
                        {activePage === 'Expense Summary' && (
                            <div className="expense-summary-page">
                                <ExpenseSummary
                                    expenses={expenses}
                                />

                                <section className="dashboard-panel summary-chart-panel">
                                    <ExpenseChart expenses={expenses} />
                                </section>
                            </div>
                        )}

                        {/* Transactions */}
                        {activePage === 'Transactions' && (
                            <div className="transactions-page">

                                <h2>All Transactions</h2>

                                {/* Search */}
                                <div className="transaction-toolbar">
                                    <input
                                        type="search"
                                        aria-label="Search transactions"
                                        placeholder="Search title, category or amount..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="search-input"
                                    />

                                    <select
                                        aria-label="Filter transactions by date"
                                        value={dateFilter}
                                        onChange={(e) =>
                                            setDateFilter(e.target.value)
                                        }
                                        className="date-filter"
                                    >
                                        <option value="All">All Expenses</option>
                                        <option value="Today">Today</option>
                                        <option value="This Week">This Week</option>
                                        <option value="This Month">This Month</option>
                                    </select>
                                </div>

                                {/* Transaction List */}
                                <div className="transaction-list">

                                    {filteredExpenses.length === 0 ? (
                                        <p>No matching transactions found.</p>
                                    ) : (
                                        filteredExpenses.map((expense) => (
                                            <div
                                                className="transaction-item"
                                                key={expense._id}
                                            >
                                                <div>
                                                    <h4>
                                                        {expense.title}
                                                    </h4>

                                                    <p>
                                                        <span className="category-pill">{expense.category}</span>
                                                    </p>

                                                    <p>
                                                        {new Date(
                                                            expense.createdAt
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="transaction-actions">
                                                    <strong>
                                                        ₹{Number(
                                                            expense.amount
                                                        ).toFixed(2)}
                                                    </strong>

                                                    <button
                                                        type="button"
                                                        className="edit-button"
                                                        aria-label={`Edit ${expense.title}`}
                                                        onClick={() =>
                                                            handleEdit(expense)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="delete-button"
                                                        aria-label={`Delete ${expense.title}`}
                                                        onClick={() =>
                                                            handleDelete(expense._id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                </div>

                            </div>
                        )}

                        {/* Shared Rooms */}
                        {activePage === 'Shared Rooms' && (
                            <div className="shared-rooms-page">
                                <SharedRooms />
                            </div>
                        )}
                    </>
                )}

            </main>

        </div>
    );
}

export default App;


function ExpenseSummary({ expenses }) {
    // Calculate total expenses
    const totalExpenses = expenses.reduce(
        (total, expense) => total + Number(expense.amount),
        0
    );

    // Calculate current month's expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyExpenses = expenses
        .filter((expense) => {
            const expenseDate = new Date(expense.createdAt);

            return (
                expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear
            );
        })
        .reduce(
            (total, expense) => total + Number(expense.amount),
            0
        );

    // Calculate number of transactions
    const totalTransactions = expenses.length;

    // Calculate category-wise expenses
    const categoryExpenses = expenses.reduce((result, expense) => {
        const category = expense.category;
        const amount = Number(expense.amount);

        result[category] = (result[category] || 0) + amount;

        return result;
    }, {});

    return (
        <section className="summary-container">

            <h2>Financial Overview</h2>

            {/* Summary Cards */}
            <div className="summary-cards">

                <div className="summary-card">
                    <p className="summary-label">Total Expenses</p>
                    <h3>₹{totalExpenses.toFixed(2)}</h3>
                    <span>All recorded expenses</span>
                </div>

                <div className="summary-card">
                    <p className="summary-label">This Month</p>
                    <h3>₹{monthlyExpenses.toFixed(2)}</h3>
                    <span>Expenses this month</span>
                </div>

                <div className="summary-card">
                    <p className="summary-label">Transactions</p>
                    <h3>{totalTransactions}</h3>
                    <span>Total transactions recorded</span>
                </div>

            </div>

            {/* Category Breakdown */}
            <div className="category-section">
                <h3>Spending by Category</h3>

                {Object.keys(categoryExpenses).length === 0 ? (
                    <p className="empty-category">
                        No expenses recorded yet.
                    </p>
                ) : (
                    <div className="category-list">
                        {Object.entries(categoryExpenses).map(
                            ([category, amount]) => (
                                <div className="category-item" key={category}>
                                    <span>{category}</span>
                                    <strong>₹{amount.toFixed(2)}</strong>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

        </section>
    );
}

export default ExpenseSummary;

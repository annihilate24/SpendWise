import { useEffect, useState } from 'react';

import {
    addSharedExpense,
    getSharedExpenses,
    updateSharedExpense,
    deleteSharedExpense
} from '../services/sharedExpenseService';

import {
    addSettlement,
    getSettlements,
    deleteSettlement
} from '../services/settlementService';

function SharedExpense({ room }) {
    const roomCode = room?.roomCode;
    const members = room?.members || [];

    const [expenses, setExpenses] = useState([]);
    const [settlements, setSettlements] = useState([]);

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [participants, setParticipants] = useState([]);

    const [fromMember, setFromMember] = useState('');
    const [toMember, setToMember] = useState('');
    const [settlementAmount, setSettlementAmount] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get member names from the room
    const memberNames = members.map((member) =>
        typeof member === 'string' ? member : member.name
    ).filter(Boolean);

    // Fetch expenses and settlements
    const fetchExpenses = async () => {
        try {
            const data = await getSharedExpenses(roomCode);
            setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to fetch expenses.');
        }
    };

    const fetchSettlements = async () => {
        try {
            const data = await getSettlements(roomCode);
            setSettlements(
                Array.isArray(data.settlements) ? data.settlements : []
            );
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to fetch settlements.');
        }
    };

    useEffect(() => {
        if (roomCode) {
            fetchExpenses();
            fetchSettlements();
        }
    }, [roomCode]);

    // Select or deselect participants
    const handleParticipantChange = (memberName) => {
        setParticipants((previous) => {
            if (previous.includes(memberName)) {
                return previous.filter((name) => name !== memberName);
            }

            return [...previous, memberName];
        });
    };

    // Add a shared expense
    const handleAddExpense = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

        if (!title.trim() || !amount || !category.trim() || !paidBy) {
            setError('Please fill in all expense details.');
            return;
        }

        if (Number(amount) <= 0 || !Number.isFinite(Number(amount))) {
            setError('Please enter a valid amount.');
            return;
        }

        if (participants.length === 0) {
            setError('Please select at least one participant.');
            return;
        }

        try {
            setLoading(true);

            await addSharedExpense(roomCode, {
                title: title.trim(),
                amount: Number(amount),
                category: category.trim(),
                paidBy,
                participants
            });

            setTitle('');
            setAmount('');
            setCategory('');
            setPaidBy('');
            setParticipants([]);

            setMessage('Shared expense added successfully!');
            await fetchExpenses();
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to add shared expense.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Edit an expense
    const handleEditExpense = async (expense) => {
        const newTitle = prompt('Enter expense title:', expense.title);
        if (newTitle === null) return;

        const newAmount = prompt('Enter amount:', expense.amount);
        if (newAmount === null) return;

        const newCategory = prompt('Enter category:', expense.category);
        if (newCategory === null) return;

        const newPaidBy = prompt(
            `Who paid? (${memberNames.join(', ')})`,
            expense.paidBy
        );
        if (newPaidBy === null) return;

        const currentParticipants = Array.isArray(expense.participants)
            ? expense.participants
            : memberNames;

        const newParticipantsText = prompt(
            `Enter participant names separated by commas.\nAvailable members: ${memberNames.join(', ')}`,
            currentParticipants.join(', ')
        );

        if (newParticipantsText === null) return;

        const newParticipants = newParticipantsText
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean);

        if (
            !newTitle.trim() ||
            !newCategory.trim() ||
            !newPaidBy.trim() ||
            !Number.isFinite(Number(newAmount)) ||
            Number(newAmount) <= 0 ||
            newParticipants.length === 0
        ) {
            setError('Please enter valid expense details and participants.');
            return;
        }

        try {
            setError('');
            setMessage('');

            await updateSharedExpense(roomCode, expense._id, {
                title: newTitle.trim(),
                amount: Number(newAmount),
                category: newCategory.trim(),
                paidBy: newPaidBy.trim(),
                participants: newParticipants
            });

            setMessage('Expense updated successfully!');
            await fetchExpenses();
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to update expense.'
            );
        }
    };

    // Delete an expense
    const handleDeleteExpense = async (expenseId) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this expense?'
        );

        if (!confirmed) return;

        try {
            setError('');
            setMessage('');

            await deleteSharedExpense(roomCode, expenseId);

            setMessage('Expense deleted successfully!');
            await fetchExpenses();
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to delete expense.'
            );
        }
    };

    // Add a settlement
    const handleAddSettlement = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');

        if (!fromMember || !toMember || !settlementAmount) {
            setError('Please fill in all payment details.');
            return;
        }

        if (fromMember === toMember) {
            setError('A member cannot pay themselves.');
            return;
        }

        if (
            !Number.isFinite(Number(settlementAmount)) ||
            Number(settlementAmount) <= 0
        ) {
            setError('Please enter a valid payment amount.');
            return;
        }

        try {
            setLoading(true);

            await addSettlement(roomCode, {
                fromMember,
                toMember,
                amount: Number(settlementAmount)
            });

            setFromMember('');
            setToMember('');
            setSettlementAmount('');

            setMessage('Payment recorded successfully!');
            await fetchSettlements();
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to record payment.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Delete a settlement
    const handleDeleteSettlement = async (settlementId) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this payment record?'
        );

        if (!confirmed) return;

        try {
            setError('');
            setMessage('');

            await deleteSettlement(roomCode, settlementId);

            setMessage('Payment record deleted successfully!');
            await fetchSettlements();
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to delete payment.'
            );
        }
    };

    // Calculate total room expenses
    const totalExpenses = expenses.reduce(
        (total, expense) => total + Number(expense.amount || 0),
        0
    );

    // Calculate each member's balance
    // Positive balance = member should receive money
    // Negative balance = member needs to pay money
    const memberSummary = memberNames.map((name) => {
        let paid = 0;
        let share = 0;
        let paidOut = 0;
        let received = 0;

        expenses.forEach((expense) => {
            const expenseParticipants = Array.isArray(expense.participants)
                ? expense.participants
                : memberNames;

            if (expense.paidBy === name) {
                paid += Number(expense.amount);
            }

            if (expenseParticipants.includes(name)) {
                share +=
                    Number(expense.amount) / expenseParticipants.length;
            }
        });

        settlements.forEach((settlement) => {
            if (settlement.fromMember === name) {
                paidOut += Number(settlement.amount);
            }

            if (settlement.toMember === name) {
                received += Number(settlement.amount);
            }
        });

        return {
            name,
            paid,
            share,
            balance: paid - share - paidOut + received
        };
    });

    // Generate suggested payments from debtors to creditors
    const calculateSuggestedPayments = () => {
        const debtors = memberSummary
            .filter((member) => member.balance < -0.01)
            .map((member) => ({
                name: member.name,
                amount: -member.balance
            }));

        const creditors = memberSummary
            .filter((member) => member.balance > 0.01)
            .map((member) => ({
                name: member.name,
                amount: member.balance
            }));

        const suggestions = [];

        let debtorIndex = 0;
        let creditorIndex = 0;

        while (
            debtorIndex < debtors.length &&
            creditorIndex < creditors.length
        ) {
            const payment = Math.min(
                debtors[debtorIndex].amount,
                creditors[creditorIndex].amount
            );

            if (payment > 0.01) {
                suggestions.push({
                    from: debtors[debtorIndex].name,
                    to: creditors[creditorIndex].name,
                    amount: payment
                });
            }

            debtors[debtorIndex].amount -= payment;
            creditors[creditorIndex].amount -= payment;

            if (debtors[debtorIndex].amount < 0.01) {
                debtorIndex++;
            }

            if (creditors[creditorIndex].amount < 0.01) {
                creditorIndex++;
            }
        }

        return suggestions;
    };

    const suggestedPayments = calculateSuggestedPayments();

    return (
        <div className="shared-expense-container">

            <h2>Shared Expenses</h2>
            <p>
                Room Code: <strong>{roomCode}</strong>
            </p>

            {message && (
                <p className="success-message" role="status">{message}</p>
            )}

            {error && (
                <p className="error-message" role="alert">{error}</p>
            )}

            {/* Total room expenses */}
            <section className="shared-total-card">
                <h3>Total Room Spending</h3>
                <h2>₹{totalExpenses.toFixed(2)}</h2>
            </section>

            {/* Add expense form */}
            <section className="shared-expense-form">
                <h3>Add Shared Expense</h3>

                <form onSubmit={handleAddExpense}>
                    <input
                        aria-label="Shared expense title"
                        type="text"
                        placeholder="Expense title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <input
                        aria-label="Shared expense amount"
                        type="number"
                        placeholder="Amount"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <input
                        aria-label="Shared expense category"
                        type="text"
                        placeholder="Category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />

                    <label htmlFor="shared-expense-payer">Who paid?</label>

                    <select
                        id="shared-expense-payer"
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                    >
                        <option value="">Select payer</option>

                        {memberNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>

                    <label>Who participated in this expense?</label>

                    <div className="participant-selection">
                        {memberNames.map((name) => (
                            <label key={name}>
                                <input
                                    type="checkbox"
                                    checked={participants.includes(name)}
                                    onChange={() =>
                                        handleParticipantChange(name)
                                    }
                                />
                                {name}
                            </label>
                        ))}
                    </div>

                    {participants.length > 0 && amount && Number(amount) > 0 && (
                        <p>
                            Each participant pays:
                            <strong>
                                {' '}₹
                                {(
                                    Number(amount) / participants.length
                                ).toFixed(2)}
                            </strong>
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Please wait...' : 'Add Expense'}
                    </button>
                </form>
            </section>

            {/* Individual member summary */}
            <section className="member-summary">
                <h3>Individual Spending Summary</h3>

                <div className="member-summary-list">
                {memberSummary.map((member) => (
                    <div className="member-summary-item" key={member.name}>
                        <h4>{member.name}</h4>

                        <p className="balance-line">
                            Paid: ₹{member.paid.toFixed(2)}
                        </p>

                        <p>
                            Their share: ₹{member.share.toFixed(2)}
                        </p>

                        <p>
                            Balance:{' '}
                                <strong className={`balance-status ${member.balance > 0.01 ? 'positive' : member.balance < -0.01 ? 'negative' : 'settled'}`}>
                                {member.balance > 0.01
                                    ? `Gets ₹${member.balance.toFixed(2)}`
                                    : member.balance < -0.01
                                        ? `Owes ₹${Math.abs(member.balance).toFixed(2)}`
                                        : 'Settled'}
                            </strong>
                        </p>
                    </div>
                ))}
                </div>
            </section>

            {/* Suggested payments */}
            <section className="suggested-payments">
                <h3>Who Owes Whom?</h3>

                {suggestedPayments.length === 0 ? (
                    <p>Everyone is settled up!</p>
                ) : (
                    <div className="settlement-list">
                    {suggestedPayments.map((payment, index) => (
                        <div className="settlement-item" key={index}>
                            <p>
                                <strong>{payment.from}</strong> should pay{' '}
                                <strong>{payment.to}</strong>
                            </p>

                            <h4>₹{payment.amount.toFixed(2)}</h4>
                        </div>
                    ))
                    }
                    </div>
                )}
            </section>

            {/* Expense history */}
            <section className="shared-expense-history">
                <h3>Expense History</h3>

                {expenses.length === 0 ? (
                    <p>No shared expenses added yet.</p>
                ) : (
                    <div className="shared-expense-list">
                    {expenses.map((expense) => {
                        const expenseParticipants =
                            Array.isArray(expense.participants)
                                ? expense.participants
                                : memberNames;

                        const share =
                            expenseParticipants.length > 0
                                ? Number(expense.amount) /
                                  expenseParticipants.length
                                : 0;

                        return (
                            <div
                                className="shared-expense-item"
                                key={expense._id}
                            >
                                <h4>{expense.title}</h4>

                                <p>
                                    Amount: ₹
                                    {Number(expense.amount).toFixed(2)}
                                </p>

                                <p>Category: {expense.category}</p>

                                <p>Paid by: {expense.paidBy}</p>

                                <p>
                                    Participants:{' '}
                                    {expenseParticipants.join(', ')}
                                </p>

                                <p>
                                    Each participant's share: ₹
                                    {share.toFixed(2)}
                                </p>

                                <div className="expense-actions">
                                    <button type="button" className="edit-button" aria-label={`Edit ${expense.title}`} onClick={() => handleEditExpense(expense)}>
                                        Edit
                                    </button>
                                    <button type="button" className="delete-button" aria-label={`Delete ${expense.title}`} onClick={() => handleDeleteExpense(expense._id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                    }
                    </div>
                )}
            </section>

            {/* Record settlement */}
            <section className="settlement-form">
                <h3>Record a Payment</h3>

                <form onSubmit={handleAddSettlement}>
                    <label htmlFor="settlement-from-member">Who is paying?</label>

                    <select
                        id="settlement-from-member"
                        value={fromMember}
                        onChange={(e) => setFromMember(e.target.value)}
                    >
                        <option value="">Select member</option>

                        {memberNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="settlement-to-member">Who is receiving?</label>

                    <select
                        id="settlement-to-member"
                        value={toMember}
                        onChange={(e) => setToMember(e.target.value)}
                    >
                        <option value="">Select member</option>

                        {memberNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>

                    <input
                        aria-label="Payment amount"
                        type="number"
                        placeholder="Payment amount"
                        min="0.01"
                        step="0.01"
                        value={settlementAmount}
                        onChange={(e) =>
                            setSettlementAmount(e.target.value)
                        }
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Please wait...' : 'Record Payment'}
                    </button>
                </form>
            </section>

            {/* Settlement history */}
            <section className="settlement-history">
                <h3>Payment History</h3>

                {settlements.length === 0 ? (
                    <p>No payments recorded yet.</p>
                ) : (
                    <div className="settlement-list">
                    {settlements.map((settlement) => (
                        <div
                            className="settlement-item"
                            key={settlement._id}
                        >
                            <p>
                                <strong>{settlement.fromMember}</strong> paid{' '}
                                <strong>{settlement.toMember}</strong>
                            </p>

                            <h4>
                                ₹{Number(settlement.amount).toFixed(2)}
                            </h4>

                            <button
                                type="button"
                                onClick={() =>
                                    handleDeleteSettlement(settlement._id)
                                }
                            >
                                Delete
                            </button>
                        </div>
                    ))
                    }
                    </div>
                )}
            </section>

        </div>
    );
}

export default SharedExpense;

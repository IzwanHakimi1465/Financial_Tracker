let financeData = {
    transactions: [],
    budgets: [],
    savingsGoal: null
};

/* Load the currently logged-in user's financial data into memory */
function loadFinanceData() {
    if (typeof getCurrentUserFinancialData === "function") {
        financeData = getCurrentUserFinancialData();
    }
    return financeData;
}

// Initialize data on script load
loadFinanceData();

/* Format a numeric value into Malaysian Ringgit (RM) currency format */
function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
        minimumFractionDigits: 2
    }).format(val);
}

/* Calculate total income from all recorded "Income" transactions */
function getTotalIncome() {
    if (!financeData || !Array.isArray(financeData.transactions)) return 0;
    return financeData.transactions
        .filter(transaction => transaction.type === "Income")
        .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
}

/* Calculate total expenses from all recorded "Expense" transactions */
function getTotalExpenses() {
    if (!financeData || !Array.isArray(financeData.transactions)) return 0;
    return financeData.transactions
        .filter(transaction => transaction.type === "Expense")
        .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
}

/* Calculate net available balance (Total Income minus Total Expenses) */
function getBalance() {
    return getTotalIncome() - getTotalExpenses();
}

/* Aggregate total expense amounts grouped by spending category */
function getExpensesByCategory() {
    const categoryTotals = {};

    if (financeData && Array.isArray(financeData.transactions)) {
        financeData.transactions
            .filter(transaction => transaction.type === "Expense")
            .forEach(transaction => {
                const category = transaction.category || "Other";
                categoryTotals[category] =
                    (categoryTotals[category] || 0) +
                    (Number(transaction.amount) || 0);
            });
    }

    return categoryTotals;
}

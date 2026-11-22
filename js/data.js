/**
 * FinTrack - Financial Data & Calculation Module (js/data.js)
 *
 * Loads active user financial records from storage and provides
 * helper functions for currency formatting and summary calculations.
 */

let financeData = {
    transactions: [],
    budgets: [],
    savingsGoal: null
};

/**
 * Load the currently logged-in user's financial data into memory.
 * @returns {Object} User financial dataset
 */
function loadFinanceData() {
    if (typeof getCurrentUserFinancialData === "function") {
        financeData = getCurrentUserFinancialData();
    }
    return financeData;
}

// Initialize data on script load
loadFinanceData();

/**
 * Format a numeric value into Malaysian Ringgit (RM) currency format.
 * @param {number} amount
 * @returns {string} Formatted MYR string (e.g., "RM1,250.00")
 */
function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
        minimumFractionDigits: 2
    }).format(val);
}

/**
 * Calculate total income from all recorded "Income" transactions.
 * @returns {number}
 */
function getTotalIncome() {
    if (!financeData || !Array.isArray(financeData.transactions)) return 0;
    return financeData.transactions
        .filter(transaction => transaction.type === "Income")
        .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
}

/**
 * Calculate total expenses from all recorded "Expense" transactions.
 * @returns {number}
 */
function getTotalExpenses() {
    if (!financeData || !Array.isArray(financeData.transactions)) return 0;
    return financeData.transactions
        .filter(transaction => transaction.type === "Expense")
        .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
}

/**
 * Calculate net available balance (Total Income minus Total Expenses).
 * @returns {number}
 */
function getBalance() {
    return getTotalIncome() - getTotalExpenses();
}

/**
 * Aggregate total expense amounts grouped by spending category.
 * @returns {Object.<string, number>} Map of category name to total spent
 */
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
/**
 * FinTrack - Transactions Module (js/transactions.js)
 * 
 * Handles adding new transactions (Income / Expense), category updating,
 * client-side form validation, saving to localStorage per-user, deleting transactions,
 * and refreshing financial summary cards and table rows in real time.
 */

document.addEventListener("DOMContentLoaded", function () {
    // Category mapping per requirement
    const CATEGORIES = {
        Income: ["Salary", "Allowance", "Freelance", "Business", "Other"],
        Expense: ["Food", "Transportation", "Bills", "Shopping", "Entertainment", "Education", "Other"]
    };

    // DOM Elements
    const transactionForm = document.getElementById("transactionForm");
    const typeSelect = document.getElementById("transactionType");
    const dateInput = document.getElementById("transactionDate");
    const descriptionInput = document.getElementById("transactionDescription");
    const categorySelect = document.getElementById("transactionCategory");
    const amountInput = document.getElementById("transactionAmount");
    const messageAlert = document.getElementById("transactionMessage");

    const tableBody = document.getElementById("transactionTableBody");
    const searchInput = document.getElementById("searchTransaction");
    const emptyMessage = document.getElementById("emptyMessage");

    const totalIncomeEl = document.getElementById("totalIncome");
    const totalExpensesEl = document.getElementById("totalExpenses");
    const availableBalanceEl = document.getElementById("availableBalance");

    /**
     * Set default date in date input to today (YYYY-MM-DD)
     */
    function setDefaultDate() {
        if (dateInput && !dateInput.value) {
            const today = new Date().toISOString().split("T")[0];
            dateInput.value = today;
        }
    }

    /**
     * Populate category dropdown according to selected transaction type
     * @param {string} selectedType "Income" or "Expense"
     * @param {string|null} preferredCategory
     */
    function updateCategoryOptions(selectedType, preferredCategory = null) {
        if (!categorySelect) return;
        const type = (selectedType === "Income") ? "Income" : "Expense";
        const categories = CATEGORIES[type] || [];

        categorySelect.innerHTML = `<option value="" disabled ${!preferredCategory ? "selected" : ""}>Select a category</option>`;
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            if (preferredCategory && preferredCategory === cat) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    }

    /**
     * Show feedback message (success or error)
     * @param {string} text 
     * @param {boolean} isError 
     */
    function displayMessage(text, isError = false) {
        if (!messageAlert) return;
        messageAlert.textContent = text;
        messageAlert.className = isError 
            ? "alert alert-danger py-2 px-3 mb-3 fw-semibold small" 
            : "alert alert-success py-2 px-3 mb-3 fw-semibold small";
        messageAlert.classList.remove("d-none");

        // Auto-dismiss after 4 seconds
        clearTimeout(messageAlert._timer);
        messageAlert._timer = setTimeout(() => {
            messageAlert.classList.add("d-none");
        }, 4000);
    }

    /**
     * Refresh financial summary values on the page using calculations from js/data.js
     */
    function updateSummaryTotals() {
        if (typeof loadFinanceData === "function") {
            loadFinanceData();
        }
        if (totalIncomeEl) {
            totalIncomeEl.textContent = formatCurrency(getTotalIncome());
        }
        if (totalExpensesEl) {
            totalExpensesEl.textContent = formatCurrency(getTotalExpenses());
        }
        if (availableBalanceEl) {
            availableBalanceEl.textContent = formatCurrency(getBalance());
        }
    }

    /**
     * Render transactions list in table
     * @param {string} filterText 
     */
    function renderTransactions(filterText = "") {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        const transactions = (financeData && Array.isArray(financeData.transactions))
            ? financeData.transactions
            : [];

        const normalizedFilter = filterText.trim().toLowerCase();

        const filtered = transactions.filter(t => {
            if (!normalizedFilter) return true;
            const categoryMatch = (t.category || "").toLowerCase().includes(normalizedFilter);
            const dateMatch = (t.date || "").toLowerCase().includes(normalizedFilter);
            const typeMatch = (t.type || "").toLowerCase().includes(normalizedFilter);
            const descMatch = (t.description || "").toLowerCase().includes(normalizedFilter);
            return categoryMatch || dateMatch || typeMatch || descMatch;
        });

        if (filtered.length === 0) {
            if (emptyMessage) {
                emptyMessage.textContent = normalizedFilter
                    ? "No matching transactions found."
                    : "No transactions yet. Add your first transaction above to get started.";
                emptyMessage.classList.remove("d-none");
            }
            return;
        }

        if (emptyMessage) emptyMessage.classList.add("d-none");

        // Sort descending by date, then by creation/id
        const sorted = [...filtered].sort((a, b) => {
            const dateComparison = (b.date || "").localeCompare(a.date || "");
            if (dateComparison !== 0) return dateComparison;
            return (b.id || 0) - (a.id || 0);
        });

        sorted.forEach(txn => {
            const isIncome = txn.type === "Income";
            const row = document.createElement("tr");

            // Format date nicely if valid
            const dateDisplay = txn.date || "-";
            const descDisplay = txn.description ? `<div class="txn-desc text-truncate" style="max-width:220px;" title="${txn.description}">${txn.description}</div>` : "";

            row.innerHTML = `
                <td class="txn-date">${dateDisplay}</td>
                <td>
                    <div class="txn-category">${txn.category || "-"}</div>
                    ${descDisplay}
                </td>
                <td>
                    <span class="pill ${isIncome ? 'pill-income' : 'pill-expense'}">
                        <i class="bi ${isIncome ? 'bi-arrow-down-short' : 'bi-arrow-up-short'}"></i>
                        ${txn.type || "Expense"}
                    </span>
                </td>
                <td class="txn-amount ${isIncome ? 'amt-income' : 'amt-expense'}" style="text-align:right;">
                    ${formatCurrency(txn.amount)}
                </td>
                <td style="text-align:center; width: 60px;">
                    <button type="button" 
                            class="btn-delete-txn" 
                            data-id="${txn.id || ''}" 
                            title="Delete transaction" 
                            aria-label="Delete transaction">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    /**
     * Delete transaction by id (or fallback to matching attributes)
     * @param {string|number} txnId 
     */
    function deleteTransaction(txnId) {
        if (!confirm("Are you sure you want to delete this transaction?")) {
            return;
        }

        const data = getCurrentUserFinancialData();
        const initialCount = data.transactions.length;

        data.transactions = data.transactions.filter(t => {
            if (t.id !== undefined && txnId !== "") {
                return String(t.id) !== String(txnId);
            }
            return true;
        });

        if (data.transactions.length === initialCount) {
            displayMessage("Could not find the transaction to delete.", true);
            return;
        }

        const saved = saveCurrentUserFinancialData(data);
        if (saved) {
            updateSummaryTotals();
            const currentFilter = searchInput ? searchInput.value : "";
            renderTransactions(currentFilter);
            displayMessage("Transaction deleted successfully.", false);
        } else {
            displayMessage("Failed to delete transaction. Please try again.", true);
        }
    }

    // Attach event delegation for delete buttons
    if (tableBody) {
        tableBody.addEventListener("click", function (e) {
            const deleteBtn = e.target.closest(".btn-delete-txn");
            if (deleteBtn) {
                const id = deleteBtn.getAttribute("data-id");
                deleteTransaction(id);
            }
        });
    }

    // Dynamic category update when transaction type changes
    if (typeSelect) {
        typeSelect.addEventListener("change", function () {
            updateCategoryOptions(this.value);
        });
    }

    // Form submission handler
    if (transactionForm) {
        transactionForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const type = typeSelect ? typeSelect.value : "";
            const date = dateInput ? dateInput.value.trim() : "";
            const description = descriptionInput ? descriptionInput.value.trim() : "";
            const category = categorySelect ? categorySelect.value : "";
            const amountRaw = amountInput ? amountInput.value.trim() : "";
            const amount = parseFloat(amountRaw);

            // Validation 1: Required fields
            if (!type || !date || !category || !amountRaw) {
                displayMessage("Please fill in all required fields (Type, Date, Category, and Amount).", true);
                return;
            }

            // Validation 2: Positive amount only
            if (isNaN(amount) || amount <= 0) {
                displayMessage("Please enter a valid positive amount greater than RM 0.00.", true);
                if (amountInput) amountInput.focus();
                return;
            }

            // Validation 3: Logical upper bound safeguard (e.g. 1 billion RM)
            if (amount > 1000000000) {
                displayMessage("Amount exceeds maximum allowed limit.", true);
                return;
            }

            // Retrieve current user's financial data
            const userFinancialData = getCurrentUserFinancialData();
            if (!Array.isArray(userFinancialData.transactions)) {
                userFinancialData.transactions = [];
            }

            // Create new transaction object with unique ID
            const newTransaction = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                type: type,
                date: date,
                description: description || category,
                category: category,
                amount: amount,
                createdAt: new Date().toISOString()
            };

            // Prepend new transaction
            userFinancialData.transactions.push(newTransaction);

            // Save to localStorage for this specific user
            const success = saveCurrentUserFinancialData(userFinancialData);

            if (success) {
                displayMessage(`${type} of ${formatCurrency(amount)} added successfully!`, false);

                // Reset form fields but keep default date & sensible category
                if (descriptionInput) descriptionInput.value = "";
                if (amountInput) amountInput.value = "";
                setDefaultDate();
                updateCategoryOptions(typeSelect.value);

                // Refresh summary cards & history table
                updateSummaryTotals();
                const currentFilter = searchInput ? searchInput.value : "";
                renderTransactions(currentFilter);
            } else {
                displayMessage("Failed to save transaction. Please ensure you are logged in.", true);
            }
        });
    }

    // Search filter input listener
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            renderTransactions(e.target.value);
        });
    }

    // Initialize defaults on load
    setDefaultDate();
    if (typeSelect) {
        updateCategoryOptions(typeSelect.value || "Expense");
    }
    updateSummaryTotals();
    renderTransactions();
});

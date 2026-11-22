function getActualCategorySpending() {
    if (typeof getExpensesByCategory === "function") {
        return getExpensesByCategory();
    }
    return {};
}

/* Update the top summary cards (Total Budget, Total Spent, Budget Remaining) */
function updateBudgetSummary() {
    if (typeof loadFinanceData === "function") {
        loadFinanceData();
    }

    const budgets = (financeData && Array.isArray(financeData.budgets)) ? financeData.budgets : [];
    const actualSpending = getActualCategorySpending();

    const totalLimit = budgets.reduce((sum, item) => sum + (Number(item.limit || item.budget) || 0), 0);
    const totalUsed = budgets.reduce((sum, item) => {
        const spent = actualSpending[item.category] !== undefined
            ? actualSpending[item.category]
            : (Number(item.spent) || 0);
        return sum + spent;
    }, 0);
    const totalLeft = Math.max(0, totalLimit - totalUsed);

    const totalBudgetEl = document.getElementById("totalBudget");
    const totalSpentEl = document.getElementById("totalSpent");
    const budgetRemainingEl = document.getElementById("budgetRemaining");

    if (totalBudgetEl) totalBudgetEl.textContent = formatCurrency(totalLimit);
    if (totalSpentEl) totalSpentEl.textContent = formatCurrency(totalUsed);
    if (budgetRemainingEl) budgetRemainingEl.textContent = formatCurrency(totalLeft);
}

/* Populate the monthly budget table with category limits */
function displayBudgets() {
    if (typeof loadFinanceData === "function") {
        loadFinanceData();
    }

    const budgets = (financeData && Array.isArray(financeData.budgets)) ? financeData.budgets : [];
    const actualSpending = getActualCategorySpending();
    const tbody = document.getElementById("budgetTableBody") || document.getElementById("budgetList");

    if (!tbody) return;
    tbody.innerHTML = "";

    // Show empty state across all 6 columns if no budgets exist
    if (budgets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color: var(--txt-muted, #7A606A);">No monthly budgets set yet. Click "Set Budget" to add one.</td></tr>`;
        return;
    }

    // Build table rows for each budget category
    budgets.forEach(function (item) {
        const limit = Number(item.limit || item.budget) || 0;
        const spent = actualSpending[item.category] !== undefined
            ? actualSpending[item.category]
            : (Number(item.spent) || 0);
        const remaining = Math.max(0, limit - spent);
        const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const state = percentage >= 100 ? "over" : percentage >= 80 ? "warn" : "ok";
        const remClass = percentage >= 100 ? "val-over" : percentage >= 80 ? "val-warn" : "val-ok";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="cat-name">${item.category || "-"}</td>
            <td class="val-limit">${formatCurrency(limit)}</td>
            <td class="val-spent">${formatCurrency(spent)}</td>
            <td class="${remClass} fw-semibold">${formatCurrency(remaining)}</td>
            <td style="min-width:130px;">
                <div class="bgt-track"
                     role="progressbar"
                     aria-label="${item.category || 'Budget'} used"
                     aria-valuenow="${Math.round(percentage)}"
                     aria-valuemin="0" aria-valuemax="100">
                    <div class="bgt-fill ${state}" style="width: ${percentage}%"></div>
                </div>
                <div class="bgt-pct ${remClass}">${Math.round(percentage)}%</div>
            </td>
            <td style="text-align:center; width: 60px;">
                <button type="button"
                        class="btn-delete-bgt"
                        data-category="${item.category || ''}"
                        title="Delete budget"
                        aria-label="Delete ${item.category || 'category'} budget">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* Update the Savings Goal tracker card with target amount */
function displaySavingsGoal() {
    if (typeof loadFinanceData === "function") {
        loadFinanceData();
    }

    const goal = (financeData && financeData.savingsGoal)
        ? financeData.savingsGoal
        : { name: "No active goal set", target: 0, saved: 0 };

    const target = Math.max(0, Number(goal.target) || 0);
    const saved = Math.max(0, Number(goal.saved) || 0);
    const percentage = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    const goalName = document.getElementById("goalName");
    const goalAmounts = document.getElementById("goalAmounts");
    const goalFill = document.getElementById("goalFill");
    const goalProgressBar = document.getElementById("goalProgressBar");
    const goalSaved = document.getElementById("goalSaved");
    const goalTarget = document.getElementById("goalTarget");
    const goalPct = document.getElementById("goalPct");
    const goalNote = document.getElementById("goalNote");

    if (goalName) goalName.textContent = goal.name || "No active goal set";
    if (goalAmounts) {
        goalAmounts.textContent = target > 0
            ? `${formatCurrency(saved)} of ${formatCurrency(target)}`
            : "No target set";
    }
    if (goalFill) goalFill.style.width = `${percentage}%`;
    if (goalProgressBar) goalProgressBar.setAttribute("aria-valuenow", Math.round(percentage));
    if (goalSaved) goalSaved.textContent = formatCurrency(saved);
    if (goalTarget) goalTarget.textContent = formatCurrency(target);
    if (goalPct) goalPct.textContent = `${Math.round(percentage)}%`;

    if (goalNote) {
        if (target <= 0) {
            goalNote.textContent = "Set a savings target to track your progress.";
        } else if (saved >= target) {
            goalNote.textContent = "🎉 Congratulations! You have reached your savings goal.";
        } else {
            goalNote.textContent = `${formatCurrency(target - saved)} remaining to reach your goal.`;
        }
    }
}

/* Initialize Set Monthly Budget modal form submission and delete handlers */
function setupBudgetInteractions() {
    const budgetForm = document.getElementById("budgetForm");
    const budgetModalEl = document.getElementById("budgetModal");
    const categoryInput = document.getElementById("budgetCategoryInput");
    const limitInput = document.getElementById("budgetLimitInput");
    const budgetAlert = document.getElementById("budgetAlert");
    const tbody = document.getElementById("budgetTableBody");

    // Reset alert when modal opens
    if (budgetModalEl) {
        budgetModalEl.addEventListener("show.bs.modal", function () {
            if (budgetAlert) {
                budgetAlert.classList.add("d-none");
                budgetAlert.textContent = "";
            }
        });
    }

    // Handle adding or updating a category budget limit
    if (budgetForm) {
        budgetForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const category = categoryInput ? categoryInput.value.trim() : "";
            const limit = parseFloat(limitInput ? limitInput.value : "0");

            if (!category) {
                if (budgetAlert) {
                    budgetAlert.textContent = "Please select an expense category.";
                    budgetAlert.className = "alert alert-danger py-2 px-3 mb-3 fw-semibold small";
                    budgetAlert.classList.remove("d-none");
                }
                return;
            }

            if (isNaN(limit) || limit <= 0) {
                if (budgetAlert) {
                    budgetAlert.textContent = "Please enter a valid monthly limit greater than RM 0.00.";
                    budgetAlert.className = "alert alert-danger py-2 px-3 mb-3 fw-semibold small";
                    budgetAlert.classList.remove("d-none");
                }
                return;
            }

            const userFinData = getCurrentUserFinancialData();
            if (!Array.isArray(userFinData.budgets)) {
                userFinData.budgets = [];
            }

            const actualSpending = getActualCategorySpending();
            const currentSpent = actualSpending[category] || 0;
            const existingIndex = userFinData.budgets.findIndex(b => b.category === category);

            if (existingIndex !== -1) {
                userFinData.budgets[existingIndex].limit = limit;
                userFinData.budgets[existingIndex].spent = currentSpent;
            } else {
                userFinData.budgets.push({
                    category: category,
                    limit: limit,
                    spent: currentSpent
                });
            }

            if (saveCurrentUserFinancialData(userFinData)) {
                updateBudgetSummary();
                displayBudgets();
                budgetForm.reset();

                if (window.bootstrap && budgetModalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(budgetModalEl) || new bootstrap.Modal(budgetModalEl);
                    modalInstance.hide();
                }
            }
        });
    }

    // Handle deleting a category budget
    if (tbody) {
        tbody.addEventListener("click", function (e) {
            const deleteBtn = e.target.closest(".btn-delete-bgt");
            if (!deleteBtn) return;

            const category = deleteBtn.getAttribute("data-category");
            if (!category || !confirm(`Remove monthly budget for "${category}"?`)) return;

            const userFinData = getCurrentUserFinancialData();
            userFinData.budgets = (userFinData.budgets || []).filter(b => b.category !== category);

            if (saveCurrentUserFinancialData(userFinData)) {
                updateBudgetSummary();
                displayBudgets();
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    updateBudgetSummary();
    displayBudgets();
    displaySavingsGoal();
    setupBudgetInteractions();
});

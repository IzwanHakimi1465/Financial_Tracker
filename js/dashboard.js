let expenseDoughnutChart = null;

function updateDashboard() {
    if (typeof loadFinanceData === "function") {
        loadFinanceData();
    }

    if (typeof getCurrentUsername === "function") {
        const username = getCurrentUsername();
        if (username) {
            const heroSubtitle = document.querySelector(".dash-hero p");
            if (heroSubtitle) {
                heroSubtitle.innerHTML = `Welcome back, <strong style="color: var(--gold);">${username}</strong>! Every ringgit has a purpose. Track your progress and build a stronger financial future with FinTrack.`;
            }
        }
    }

    const totalIncomeEl = document.getElementById("totalIncome");
    const totalExpensesEl = document.getElementById("totalExpenses");
    const balanceEl = document.getElementById("balance");

    if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(getTotalIncome());
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(getTotalExpenses());
    if (balanceEl) balanceEl.textContent = formatCurrency(getBalance());

    const goal = (financeData && financeData.savingsGoal)
        ? financeData.savingsGoal
        : { name: "No active goal set", target: 0, saved: 0 };

    const goalSaved = Math.max(0, Number(goal.saved) || 0);
    const goalTarget = Math.max(0, Number(goal.target) || 0);

    let rawPercent = 0;
    if (goalTarget > 0) {
        rawPercent = (goalSaved / goalTarget) * 100;
    }
    const displayPercent = (goalTarget > 0) ? Math.min(Math.round(rawPercent), 100) : 0;
    const isCompleted = goalTarget > 0 && goalSaved >= goalTarget;

    const savingsProgress = document.getElementById("savingsProgress");
    const savingsDetails = document.getElementById("savingsDetails");
    const savingsProgress2 = document.getElementById("savingsProgress2");
    const savingsGoalName = document.getElementById("savingsGoalName");
    const savingsAmounts = document.getElementById("savingsAmounts");
    const savingsProgressFill = document.getElementById("savingsProgressFill");
    const savingsProgressBar = document.getElementById("savingsProgressBar");
    const remainingSavings = document.getElementById("remainingSavings");
    const savingsStatSaved = document.getElementById("savingsStatSaved");
    const savingsStatTarget = document.getElementById("savingsStatTarget");

    if (savingsProgress) {
        savingsProgress.textContent = displayPercent + "%";
    }
    if (savingsDetails) {
        savingsDetails.textContent = goalTarget > 0
            ? (formatCurrency(goalSaved) + " saved")
            : "RM0.00 saved";
    }

    if (savingsProgress2) {
        savingsProgress2.textContent = displayPercent + "%";
    }
    if (savingsGoalName) {
        savingsGoalName.textContent = goal.name || "No active goal set";
    }
    if (savingsAmounts) {
        savingsAmounts.textContent = goalTarget > 0
            ? (formatCurrency(goalSaved) + " of " + formatCurrency(goalTarget))
            : "RM0.00 of RM0.00";
    }

    if (savingsProgressFill) {
        savingsProgressFill.style.width = displayPercent + "%";
        if (isCompleted) {
            savingsProgressFill.style.background = "linear-gradient(90deg, #14785A 0%, #2ECC9A 100%)";
        } else {
            savingsProgressFill.style.background = "linear-gradient(90deg, var(--burg) 0%, var(--gold) 100%)";
        }
    }
    if (savingsProgressBar) {
        savingsProgressBar.setAttribute("aria-valuenow", displayPercent);
    }

    if (remainingSavings) {
        if (goalTarget <= 0) {
            remainingSavings.textContent = "Set a savings goal to start tracking.";
            remainingSavings.className = "goal-remaining";
        } else if (isCompleted) {
            remainingSavings.textContent = "🎉 Congratulations! You have reached your savings goal.";
            remainingSavings.className = "goal-remaining text-success fw-bold";
        } else {
            const remaining = Math.max(0, goalTarget - goalSaved);
            remainingSavings.textContent = `${formatCurrency(remaining)} remaining to reach your goal.`;
            remainingSavings.className = "goal-remaining";
        }
    }

    if (savingsStatSaved) savingsStatSaved.textContent = formatCurrency(goalSaved);
    if (savingsStatTarget) savingsStatTarget.textContent = formatCurrency(goalTarget);

    const txnBody = document.getElementById("recentTransactions");
    if (txnBody) {
        const transactions = (financeData && Array.isArray(financeData.transactions))
            ? financeData.transactions
            : [];

        if (transactions.length === 0) {
            txnBody.innerHTML = `<tr><td colspan="4" class="text-center py-4" style="color: var(--txt-muted);">No transactions yet. Add your first transaction to get started.</td></tr>`;
        } else {
            txnBody.innerHTML = "";
            const latestTxns = [...transactions]
                .sort((a, b) => {
                    const dateComparison = (b.date || "").localeCompare(a.date || "");
                    if (dateComparison !== 0) return dateComparison;
                    return (b.id || 0) - (a.id || 0);
                })
                .slice(0, 5);

            latestTxns.forEach(txn => {
                const row = document.createElement("tr");
                const isIncome = txn.type === "Income";

                row.innerHTML = `
                    <td class="txn-date">${txn.date || "-"}</td>
                    <td class="txn-category">${txn.category || "-"}</td>
                    <td>
                        <span class="pill ${isIncome ? 'pill-income' : 'pill-expense'}">
                            <i class="bi ${isIncome ? 'bi-arrow-down-short' : 'bi-arrow-up-short'}"></i>
                            ${txn.type || 'Expense'}
                        </span>
                    </td>
                    <td class="txn-amount ${isIncome ? 'txn-income' : 'txn-expense'}" style="text-align:right;">
                        ${formatCurrency(txn.amount)}
                    </td>
                `;

                txnBody.appendChild(row);
            });
        }
    }

    // 5. Expense Breakdown Chart
    renderExpenseChart();
}

/** Render or refresh the Doughnut Chart for expense breakdown */
function renderExpenseChart() {
    const canvas = document.getElementById("expenseChart");
    if (!canvas || typeof Chart === "undefined") return;

    const expenses = getExpensesByCategory();
    let chartLabels = Object.keys(expenses);
    let chartAmounts = Object.values(expenses);

    // Fallback placeholder display if user has no expenses yet
    const hasExpenses = chartLabels.length > 0;
    if (!hasExpenses) {
        chartLabels = ["No Expenses Yet"];
        chartAmounts = [1];
    }

    const isPlaceholder = !hasExpenses;
    const isLightTheme = document.documentElement.dataset.theme === "light";
    const bgColors = isPlaceholder
        ? [isLightTheme ? "rgba(120,31,61,0.12)" : "rgba(255,255,255,0.12)"]
        : ["#D4AF5A", "#922B4C", "#C9956C", "#4A1028", "#A55A3A", "#E8C97A"];

    // If chart exists, destroy and re-create to cleanly update labels and data
    if (expenseDoughnutChart) {
        expenseDoughnutChart.destroy();
    }

    expenseDoughnutChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "Expenses (RM)",
                data: chartAmounts,
                backgroundColor: bgColors,
                borderWidth: 3,
                borderColor: "#3A0C1E",
                hoverOffset: isPlaceholder ? 0 : 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: isLightTheme ? "#66535b" : "rgba(255,255,255,0.75)",
                        font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
                        padding: 14,
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(74,16,40,0.95)",
                    titleColor: "#F5E6B8",
                    bodyColor: "#fff",
                    cornerRadius: 10,
                    padding: 12,
                    callbacks: {
                        label: ctx => isPlaceholder
                            ? " No expenses recorded"
                            : "  " + ctx.label + ": " + formatCurrency(ctx.raw)
                    }
                }
            }
        }
    });
}

document.addEventListener("fintrack-theme-change", () => {
    if (expenseDoughnutChart) {
        renderExpenseChart();
    }
});

/* Setup Savings Goal Modal event listeners and form submission */
function setupSavingsGoalModal() {
    const editBtn = document.getElementById("editGoalBtn");
    const goalModalEl = document.getElementById("savingsGoalModal");
    const goalForm = document.getElementById("savingsGoalForm");
    const goalNameInput = document.getElementById("goalNameInput");
    const goalTargetInput = document.getElementById("goalTargetInput");
    const goalSavedInput = document.getElementById("goalSavedInput");
    const goalAlert = document.getElementById("savingsGoalAlert");

    // Populate modal form fields with existing goal values when opened
    if (goalModalEl) {
        goalModalEl.addEventListener("show.bs.modal", function () {
            if (goalAlert) {
                goalAlert.classList.add("d-none");
                goalAlert.textContent = "";
            }

            const current = (financeData && financeData.savingsGoal) ? financeData.savingsGoal : null;
            if (goalNameInput) {
                goalNameInput.value = (current && current.name && current.name !== "No active goal set") ? current.name : "";
            }
            if (goalTargetInput) {
                goalTargetInput.value = (current && current.target > 0) ? current.target : "";
            }
            if (goalSavedInput) {
                goalSavedInput.value = (current && current.saved !== undefined) ? current.saved : 0;
            }
        });
    }

    // Form submit handler
    if (goalForm) {
        goalForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const name = goalNameInput ? goalNameInput.value.trim() : "";
            const target = parseFloat(goalTargetInput ? goalTargetInput.value : "0");
            const saved = parseFloat(goalSavedInput ? goalSavedInput.value : "0");

            // Validation 1: Required name
            if (!name) {
                if (goalAlert) {
                    goalAlert.textContent = "Please enter a valid name for your savings goal.";
                    goalAlert.className = "alert alert-danger py-2 px-3 mb-3 fw-semibold small";
                    goalAlert.classList.remove("d-none");
                }
                if (goalNameInput) goalNameInput.focus();
                return;
            }

            // Validation 2: Positive target
            if (isNaN(target) || target <= 0) {
                if (goalAlert) {
                    goalAlert.textContent = "Target amount must be a positive number greater than RM 0.00.";
                    goalAlert.className = "alert alert-danger py-2 px-3 mb-3 fw-semibold small";
                    goalAlert.classList.remove("d-none");
                }
                if (goalTargetInput) goalTargetInput.focus();
                return;
            }

            // Validation 3: Non-negative saved amount
            if (isNaN(saved) || saved < 0) {
                if (goalAlert) {
                    goalAlert.textContent = "Current amount saved cannot be negative.";
                    goalAlert.className = "alert alert-danger py-2 px-3 mb-3 fw-semibold small";
                    goalAlert.classList.remove("d-none");
                }
                if (goalSavedInput) goalSavedInput.focus();
                return;
            }

            // Save goal into current user's financial record
            const userFinData = getCurrentUserFinancialData();
            userFinData.savingsGoal = {
                name: name,
                target: target,
                saved: saved
            };

            const success = saveCurrentUserFinancialData(userFinData);

            if (success) {
                // Update dashboard immediately
                updateDashboard();

                // Close modal
                if (window.bootstrap && goalModalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(goalModalEl) || new bootstrap.Modal(goalModalEl);
                    modalInstance.hide();
                }
            } else {
                if (goalAlert) {
                    goalAlert.textContent = "Failed to save savings goal. Please ensure you are logged in.";
                    goalAlert.className = "alert alert-danger py-2 px-3 mb-3 fw-semibold small";
                    goalAlert.classList.remove("d-none");
                }
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", function () {
    updateDashboard();
    setupSavingsGoalModal();

    // Attach logout event listener
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener("click", function (e) {
            e.preventDefault();
            if (typeof logoutCurrentUser === "function") {
                logoutCurrentUser();
            }
        });
    }
});

// Update automatically if transactions or goals are updated in another tab/window
window.addEventListener("storage", function (event) {
    if (event.key && event.key.startsWith("fintrack_data_")) {
        updateDashboard();
    }
});

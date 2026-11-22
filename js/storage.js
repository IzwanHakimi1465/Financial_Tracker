const STORAGE_USERS_KEY = "fintrack_users";
const STORAGE_DATA_PREFIX = "fintrack_data_";
const THEME_STORAGE_KEY = "fintrack_theme";

/* 1. Theme Management (Persistent Light & Dark Mode) */
/*Apply the specified theme ("dark" or "light") to the document */
function applyTheme(theme) {
    const activeTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", activeTheme);

    const toggleButtons = document.querySelectorAll(".theme-toggle-btn");
    toggleButtons.forEach(btn => {
        if (activeTheme === "dark") {
            btn.innerHTML = '<i class="bi bi-sun-fill" aria-hidden="true"></i><span>Light mode</span>';
            btn.setAttribute("aria-label", "Switch to Light mode");
            btn.setAttribute("aria-pressed", "false");
        } else {
            btn.innerHTML = '<i class="bi bi-moon-fill" aria-hidden="true"></i><span>Dark mode</span>';
            btn.setAttribute("aria-label", "Switch to Dark mode");
            btn.setAttribute("aria-pressed", "true");
        }
    });
}

/* Toggle between Light Mode and Dark Mode and save preference in localStorage */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
}

// Immediately apply saved theme before page renders to prevent color flicker
(function initSavedTheme() {
    const requestedTheme = new URLSearchParams(window.location.search).get("theme");
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const savedTheme = requestedTheme === "light" || requestedTheme === "dark"
        ? requestedTheme
        : storedTheme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (requestedTheme === "light" || requestedTheme === "dark") {
        localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
    }
    document.addEventListener("DOMContentLoaded", function () {
        applyTheme(savedTheme);
    });
})();

function finTrackThemeUrl(path) {
    if (window.location.protocol !== "file:") {
        return path;
    }

    const target = new URL(path, window.location.href);
    target.searchParams.set("theme", document.documentElement.getAttribute("data-theme") || "dark");
    return target.href;
}

/* 2. Password Hashing & User Account Management */
/* Hash password using Web Crypto API SHA-256. */
async function hashPassword(password) {
    if (window.crypto && window.crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        } catch (e) {
            console.warn("crypto.subtle failed, using fallback hash", e);
        }
    }
    // Fallback hash for older browsers/environments
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return "demo_hash_" + Math.abs(hash).toString(16);
}

/* Get all registered user accounts from localStorage */
function getUsers() {
    let users = [];
    try {
        const stored = localStorage.getItem(STORAGE_USERS_KEY);
        if (stored) {
            users = JSON.parse(stored);
        } else {
            const oldStored = localStorage.getItem("fintrackUsers");
            if (oldStored) {
                users = JSON.parse(oldStored);
                localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
            }
        }
    } catch (e) {
        console.error("Error reading users from localStorage", e);
        users = [];
    }
    return Array.isArray(users) ? users : [];
}

/* Save user list to localStorage */
function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

/* Check whether a username already exists (case-insensitive) */
function usernameExists(username) {
    if (!username) return false;
    const users = getUsers();
    const cleanUsername = username.trim().toLowerCase();
    return users.some(u =>
        u && typeof u.username === "string" && u.username.trim().toLowerCase() === cleanUsername
    );
}

/* Retrieve a user's password hint without exposing the stored password */
function getPasswordHint(username) {
    if (!username) return null;
    const cleanUsername = username.trim().toLowerCase();
    const user = getUsers().find(account =>
        account && typeof account.username === "string" &&
        account.username.trim().toLowerCase() === cleanUsername
    );
    return typeof user?.passwordHint === "string" && user.passwordHint.trim()
        ? user.passwordHint.trim()
        : null;
}

/* 3. Per-User Financial Data Storage */
/* Creates empty financial data structure for a new user */
function createEmptyFinancialData() {
    return {
        transactions: [],
        budgets: [],
        savingsGoal: null
    };
}

/* Generates the storage key for a user's financial data */
function getUserDataKey(username) {
    if (!username) return "";
    return STORAGE_DATA_PREFIX + username.trim().toLowerCase();
}

/* Initialize empty financial data for a user in localStorage */
function initUserFinancialData(username) {
    const key = getUserDataKey(username);
    if (!key) return createEmptyFinancialData();

    const existing = localStorage.getItem(key);
    if (!existing) {
        const initialData = createEmptyFinancialData();
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    }
    try {
        return JSON.parse(existing);
    } catch (e) {
        const initialData = createEmptyFinancialData();
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    }
}

/* Register a new user account and initialize their separate financial data */
async function registerUser(username, password, passwordHint) {
    const cleanUsername = (username || "").trim();
    const cleanPasswordHint = (passwordHint || "").trim();
    if (cleanUsername.length < 3) {
        return { success: false, message: "Username must contain at least 3 characters." };
    }
    if (!password || password.length < 8) {
        return { success: false, message: "Password must contain at least 8 characters." };
    }
    if (!cleanPasswordHint) {
        return { success: false, message: "Please enter a password hint." };
    }

    if (usernameExists(cleanUsername)) {
        return { success: false, message: "This username is already registered." };
    }

    const hashed = await hashPassword(password);
    const users = getUsers();
    const normalizedUsername = cleanUsername.toLowerCase();
    if (users.some(user =>
        user && typeof user.username === "string" &&
        user.username.trim().toLowerCase() === normalizedUsername
    )) {
        return { success: false, message: "This username is already registered." };
    }
    users.push({
        username: cleanUsername,
        passwordHash: hashed,
        passwordHint: cleanPasswordHint,
        createdAt: new Date().toISOString()
    });
    saveUsers(users);

    initUserFinancialData(cleanUsername);

    return { success: true, message: "Account created successfully! Redirecting to Log In..." };
}

/**
 * Validate credentials for login.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{success: boolean, message?: string, user?: Object}>}
 */
async function validateUserLogin(username, password) {
    const cleanUsername = (username || "").trim();
    if (!cleanUsername || !password) {
        return { success: false, message: "Please enter both username and password." };
    }

    const users = getUsers();
    const user = users.find(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!user) {
        return { success: false, message: "Account not found. Please sign up first." };
    }

    const inputHash = await hashPassword(password);
    const isValid = (user.passwordHash && user.passwordHash === inputHash) ||
                    (user.password && user.password === password);

    if (!isValid) {
        return { success: false, message: "Incorrect password. Please try again." };
    }

    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("username", user.username);

    initUserFinancialData(user.username);

    return { success: true, user: user };
}

/**
 * Get current logged in username from sessionStorage.
 * @returns {string|null}
 */
function getCurrentUsername() {
    return sessionStorage.getItem("username");
}

/**
 * Check whether a user is currently logged in.
 * @returns {boolean}
 */
function isUserLoggedIn() {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    const username = getCurrentUsername();
    if (!isLoggedIn || !username) {
        return false;
    }
    return usernameExists(username);
}

/**
 * Retrieve the currently logged-in user's financial data.
 * @returns {{transactions: Array, budgets: Array, savingsGoal: Object|null}}
 */
function getCurrentUserFinancialData() {
    const username = getCurrentUsername();
    if (!username) {
        return createEmptyFinancialData();
    }
    const key = getUserDataKey(username);
    const raw = localStorage.getItem(key);
    if (!raw) {
        return initUserFinancialData(username);
    }
    try {
        const data = JSON.parse(raw);
        return {
            transactions: Array.isArray(data.transactions) ? data.transactions : [],
            budgets: Array.isArray(data.budgets) ? data.budgets : [],
            savingsGoal: data.savingsGoal || null
        };
    } catch (e) {
        console.error("Error parsing user financial data", e);
        return initUserFinancialData(username);
    }
}

/**
 * Save financial data for the current logged-in user.
 * @param {Object} data 
 * @returns {boolean}
 */
function saveCurrentUserFinancialData(data) {
    const username = getCurrentUsername();
    if (!username) {
        console.warn("Cannot save financial data: No user is currently logged in.");
        return false;
    }
    const key = getUserDataKey(username);
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("Error saving user financial data", e);
        return false;
    }
}

/**
 * Log out the current user and redirect to login page.
 */
function logoutCurrentUser() {
    sessionStorage.clear();
    window.location.replace(finTrackThemeUrl("index.html"));
}

/**
 * Auth guard: redirects to login if user is not authenticated.
 */
function requireAuth() {
    if (!isUserLoggedIn()) {
        sessionStorage.clear();
        window.location.replace(finTrackThemeUrl("index.html"));
    }
}

/* ==========================================================================
   4. Default Hardcoded Demo Account Initialization
   ========================================================================== */

/**
 * Seeds a default demo user account ("admin" / "admin1234") with sample
 * transactions, budgets, and savings goal if it does not already exist.
 */
function initDemoAccount() {
    const demoUsername = "admin";
    const demoPassword = "admin1234";
    const demoSeedKey = "fintrack_demo_seeded";

    // 1. Daftar akaun demo jika belum wujud dalam localStorage
    if (!usernameExists(demoUsername)) {
        const users = getUsers();
        users.push({
            username: demoUsername,
            password: demoPassword,
            passwordHint: "The demo password is listed on the login page.",
            createdAt: new Date().toISOString()
        });
        saveUsers(users);
    } else {
        const users = getUsers();
        const demoUser = users.find(user =>
            user && typeof user.username === "string" &&
            user.username.trim().toLowerCase() === demoUsername
        );
        if (demoUser && !demoUser.passwordHint) {
            demoUser.passwordHint = "The demo password is listed on the login page.";
            saveUsers(users);
        }
    }

    // 2. Sediakan data demo untuk storan baharu atau storan kosong yang lama
    const dataKey = getUserDataKey(demoUsername);
    if (localStorage.getItem(demoSeedKey) === "true") {
        return;
    }

    const existingData = localStorage.getItem(dataKey);
    if (existingData) {
        try {
            const parsedData = JSON.parse(existingData);
            const hasFinancialRecords =
                (Array.isArray(parsedData.transactions) && parsedData.transactions.length > 0) ||
                (Array.isArray(parsedData.budgets) && parsedData.budgets.length > 0) ||
                Boolean(parsedData.savingsGoal);

            if (hasFinancialRecords) {
                localStorage.setItem(demoSeedKey, "true");
                return;
            }
        } catch (error) {
            console.warn("Could not read existing demo data; restoring the sample data.", error);
        }
    }

    const sampleData = {
            transactions: [
                {
                    id: 1001,
                    type: "Income",
                    date: "2026-11-01",
                    description: "Monthly Student Allowance",
                    category: "Allowance",
                    amount: 1500.00
                },
                {
                    id: 1002,
                    type: "Income",
                    date: "2026-11-05",
                    description: "Freelance Web Design Project",
                    category: "Freelance",
                    amount: 450.00
                },
                {
                    id: 1003,
                    type: "Expense",
                    date: "2026-11-06",
                    description: "Groceries & Lunch",
                    category: "Food",
                    amount: 85.50
                },
                {
                    id: 1004,
                    type: "Expense",
                    date: "2026-11-08",
                    description: "Petrol & Campus Shuttle",
                    category: "Transportation",
                    amount: 45.00
                },
                {
                    id: 1005,
                    type: "Expense",
                    date: "2026-11-10",
                    description: "Mobile Data & Internet Plan",
                    category: "Bills",
                    amount: 60.00
                },
                {
                    id: 1006,
                    type: "Expense",
                    date: "2026-11-12",
                    description: "Reference Books & Printing",
                    category: "Education",
                    amount: 55.00
                }
            ],
            budgets: [
                { category: "Food", limit: 400.00, spent: 85.50 },
                { category: "Transportation", limit: 150.00, spent: 45.00 },
                { category: "Bills", limit: 120.00, spent: 60.00 },
                { category: "Education", limit: 150.00, spent: 55.00 }
            ],
            savingsGoal: {
                name: "Emergency Fund",
                target: 2000.00,
                saved: 850.00
            }
        };

    localStorage.setItem(dataKey, JSON.stringify(sampleData));
    localStorage.setItem(demoSeedKey, "true");
}

// Jalankan inisialisasi akaun demo secara automatik semasa fail dimuatkan
initDemoAccount();

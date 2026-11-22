document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const passwordHintMessage = document.getElementById("passwordHintMessage");

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", function (event) {
            event.preventDefault();

            const usernameInput = document.getElementById("username");
            const username = usernameInput ? usernameInput.value.trim() : "";
            if (passwordHintMessage) {
                passwordHintMessage.hidden = false;
                passwordHintMessage.textContent = "";
            }

            if (!username) {
                if (passwordHintMessage) {
                    passwordHintMessage.textContent = "Enter your username to view its password hint.";
                }
                if (usernameInput) usernameInput.focus();
                return;
            }

            const hint = typeof getPasswordHint === "function" ? getPasswordHint(username) : null;
            if (passwordHintMessage) {
                passwordHintMessage.textContent = hint
                    ? "Password hint: " + hint
                    : "No password hint is available for this username.";
            }
        });
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const errorMessage = document.getElementById("errorMessage");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (errorMessage) {
            errorMessage.textContent = "";
        }

        if (!username || !password) {
            if (errorMessage) {
                errorMessage.textContent = "Please enter both username and password.";
            }
            return;
        }

        const submitBtn = loginForm.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        try {
            if (typeof validateUserLogin === "function") {
                const result = await validateUserLogin(username, password);

                if (result.success) {
                    window.location.href = finTrackThemeUrl("dashboard.html");
                } else {
                    if (errorMessage) {
                        errorMessage.textContent = result.message || "Invalid credentials.";
                    }
                    if (submitBtn) submitBtn.disabled = false;
                }
            } else {
                if (errorMessage) {
                    errorMessage.textContent = "Authentication storage module not loaded.";
                }
                if (submitBtn) submitBtn.disabled = false;
            }
        } catch (error) {
            console.error("Login verification error:", error);
            if (errorMessage) {
                errorMessage.textContent = "An error occurred while logging in. Please try again.";
            }
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});
/**
 * FinTrack - Sign Up Module (js/signup.js)
 * 
 * Handles user registration with validation, password confirmation,
 * duplicate username checks, and separate localStorage account creation.
 */

document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");
    if (!signupForm) return;

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Get input values
        const usernameInput = document.getElementById("signupUsername");
        const passwordInput = document.getElementById("signupPassword");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const passwordHintInput = document.getElementById("passwordHint");
        const signupMessage = document.getElementById("signupMessage");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
        const passwordHint = passwordHintInput ? passwordHintInput.value.trim() : "";

        // Helper to show message
        function showMessage(text, isError = true) {
            if (!signupMessage) return;
            signupMessage.textContent = text;
            signupMessage.className = isError ? "mb-3 text-danger fw-semibold" : "mb-3 text-success fw-semibold";
        }

        // Validate all fields filled
        if (!username || !password || !confirmPassword || !passwordHint) {
            showMessage("Please fill in all fields.", true);
            return;
        }

        // Check username length
        if (username.length < 3) {
            showMessage("Username must contain at least 3 characters.", true);
            return;
        }

        // Check password length
        if (password.length < 8) {
            showMessage("Password must contain at least 8 characters.", true);
            return;
        }

        // Check password match
        if (password !== confirmPassword) {
            showMessage("Passwords do not match. Please try again.", true);
            return;
        }

        // Check if username already exists using storage.js
        if (typeof usernameExists === "function" && usernameExists(username)) {
            showMessage("This username is already registered.", true);
            return;
        }

        // Disable submit button temporarily
        const submitBtn = signupForm.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        try {
            // Register via storage.js
            let result;
            if (typeof registerUser === "function") {
                result = await registerUser(username, password, passwordHint);
            } else {
                result = { success: false, message: "Storage module not loaded." };
            }

            if (result.success) {
                showMessage(result.message, false);
                signupForm.reset();

                // Redirect to Login page (index.html)
                setTimeout(function () {
                    window.location.href = finTrackThemeUrl("index.html");
                }, 1500);
            } else {
                showMessage(result.message, true);
                if (submitBtn) submitBtn.disabled = false;
            }
        } catch (error) {
            console.error("Sign up error:", error);
            showMessage("An unexpected error occurred. Please try again.", true);
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.passwordToggle);
            if (!input) {
                return;
            }

            const isVisible = input.type === "password";
            input.type = isVisible ? "text" : "password";
            button.setAttribute("aria-label", isVisible ? "Hide password" : "Show password");
            button.setAttribute("aria-pressed", String(isVisible));
            button.title = isVisible ? "Hide password" : "Show password";
            button.querySelector("i").className = isVisible ? "bi bi-eye-slash" : "bi bi-eye";
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const syncFileLinks = () => {
        if (window.location.protocol !== "file:") {
            return;
        }

        const activeTheme = document.documentElement.getAttribute("data-theme");
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("theme", activeTheme);
        window.history.replaceState(null, "", currentUrl.href);

        const currentDirectory = window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/"));
        document.querySelectorAll("a[href]").forEach((link) => {
            const target = new URL(link.href, window.location.href);
            const targetDirectory = target.pathname.slice(0, target.pathname.lastIndexOf("/"));
            if (target.protocol === "file:" && targetDirectory === currentDirectory && /\.html$/i.test(target.pathname)) {
                target.searchParams.set("theme", activeTheme);
                link.href = target.href;
            }
        });
    };

    const themeButton = document.createElement("button");
    themeButton.type = "button";
    themeButton.className = "theme-toggle theme-toggle-btn";
    themeButton.innerHTML = '<i class="bi bi-sun-fill" aria-hidden="true"></i><span></span>';
    const navigationItems = document.querySelector(".ft-nav .navbar-nav");
    if (navigationItems) {
        const themeItem = document.createElement("li");
        themeItem.className = "nav-item theme-nav-item";
        themeButton.classList.add("theme-toggle-nav");
        themeItem.appendChild(themeButton);
        navigationItems.appendChild(themeItem);
    } else {
        document.body.appendChild(themeButton);
    }

    applyTheme(document.documentElement.getAttribute("data-theme") || "dark");
    syncFileLinks();
    themeButton.addEventListener("click", () => {
        toggleTheme();
        syncFileLinks();
        document.dispatchEvent(new CustomEvent("fintrack-theme-change", {
            detail: { theme: document.documentElement.getAttribute("data-theme") }
        }));
    });
});

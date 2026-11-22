# FinTrack - Personal Finance & Budget Tracker

## Project Description
FinTrack is a web based application designed as an Individual Assignment for IMS566 (Advanced Web Design Development and Content Management). It enables users to add income and expenses into the system, create and view budgets depending on category, track their savings goals and view a graphical display of expenses.

## Features Included
- User Authentication (Login & Sign-Up): User login and registration functionality. Users are able to create unique usernames and have password hints to recover accounts. Prevents session hijacking and separates data for different users using localStorage and sessionStorage.
- Password Recovery Hint: Users have the option to enter a password hint when registering. This password hint can be viewed from the login page by entering the users username. Password hints are stored in the browsers local storage. As these are not password resets, users should not include their real password in their hint.
- Password Visibility: Show or hide password values on the login and sign-up forms.
- Dark & Light Themes: Users can change between dark/Light Themes from any page. The theme chosen will be stored in the browser and the same theme will be used throughout the application.
- Interactive Dashboard: Summary of total income, expenses, current balance and savings goals reached. Visual representation of expenses with a live doughnut chart using Chart.js, along with recent transactions.
- Transaction Management: View structured data. Add new income/expense, filter transactions via search bar and delete records.
- Budget & Savings Planner: View structured data. View budget limits for categories, remaining budget, and visual progress bars. Track savings goals.
- Responsive Navigation & Layout: Navigation bar has been made responsive and sticky. Grid layout responsive. Tested on Google Chrome on desktop and mobile devices.
- Consistent Visual Design: A burgundy and gold colour scheme. Login and register pages have been redesigned with 2 columns. Focus states are accessible. Cards are responsive. Light theme colours have been co-ordinated to match the rest of the application.

## Instructions to Test Login
1. Open the live GitHub Pages link using Google Chrome.
2. On the Login page (`index.html`), enter the pre-configured demo credentials:
   - Username: `admin`
   - Password: `admin1234`
3. Click Login to access the dashboard pre-loaded with sample transactions, budgets, and savings goal data.
4. *(Optional)* Click Sign Up (`signup.html`) to register a brand-new user account and test starting from a clean financial slate.

## Frameworks & Libraries Used
- HTML5 & CSS3 - (Custom CSS variables, Flexbox, and responsive media queries)
- JavaScript - (ES6 (`localStorage` & `sessionStorage` for simulated database persistence)
- Bootstrap 5.3 - (Responsive grid system, navigation bar, cards, tables, and modals)
- Bootstrap Icons 1.11 - UI iconography)
- Chart.js - (Interactive doughnut chart for category expense visualization)
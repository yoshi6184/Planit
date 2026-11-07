# Planit — Personal Budgeting App

A simple, YNAB-style personal budgeting web app with onboarding, configuration, dashboard, transactions, and reports. Uses mock data.

![Landing](docs/screenshots/Landing.png)


## Screenshots


<h3 align="center">Dashboard</h3>
<p align="center">
  <img src="docs/screenshots/Dashboard.png" alt="Dashboard" width="700">
</p>

---

<h3 align="center">Budget</h3>
<p align="center">
  <img src="docs/screenshots/Budget.png" alt="Budget plan" width="700">
</p>

---

<h3 align="center">Transactions</h3>
<p align="center">
  <img src="docs/screenshots/Transactions.png" alt="Transactions" width="700">
</p>

---

<h3 align="center">Reports</h3>
<p align="center">
  <img src="docs/screenshots/Reports.png" alt="Reports" width="700">
</p>


## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Tech

- React 18, Vite, React Router
- Recharts for graphs
- Mock data in `src/data/mockData.js` and app state in `src/context/AppContext.jsx`

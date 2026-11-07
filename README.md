# Planit — Personal Budgeting App

A simple, YNAB-style personal budgeting web app with onboarding, configuration, dashboard, transactions, and reports. Uses mock data.

![Landing](docs/screenshots/Landing.png)


## Screenshots



<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/Dashboard.png" alt="Dashboard">
      <br>
      <sub><b>Dashboard</b></sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/Onboarding.png" alt="Onboarding">
      <br>
      <sub><b>Onboarding</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/Budget.png" alt="Budget">
      <br>
      <sub><b>Budget</b></sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/Transactions.png" alt="Transactions">
      <br>
      <sub><b>Transactions</b></sub>
    </td>
  </tr>
</table>

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

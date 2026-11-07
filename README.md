# Planit — Personal Budgeting App

A simple, YNAB-style personal budgeting web app with onboarding, configuration, dashboard, transactions, and reports. Uses mock data.

![Landing](docs/screenshots/Landing.png)


## Screenshots

![Dashboard](docs/screenshots/Dashboard.png)

![Budget](docs/screenshots/Budget.png)

![Transactions](docs/screenshots/Transactions.png)

![Reports](docs/screenshots/Reports.png)

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

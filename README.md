# Personal Budget — Control Your Finance

A simple, YNAB-style personal budgeting web app with onboarding, configuration, dashboard, transactions, and reports. Uses mock data.

## Features

- **Onboarding** — Goal-based start (control your finance)
- **Configuration** — Monthly income, categories by type (Need / Want / Bills & Subscriptions), budget per category
- **Dashboard** — Total balance, budget left, spend vs budget bar chart, spending pie chart, account list, category progress bars, inspirational quote
- **Transactions** — Add transactions, import (CSV-style: date, payee, amount, categoryId), connect bank (mock)
- **Reports** — Monthly spending trend, spending by category, detailed summary table

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

# Smart Wallet: Personal Money Management System

Web Programming project, section BDS-7A, FAST-NUCES Lahore.

| Member | ID |
| --- | --- |
| Areeba Umair | 23L-2533 |
| Zoha Faiz | 23L-2597 |

Smart Wallet is a MERN-stack personal money manager. Users split their balance into virtual buckets
(Travel, Emergency, Bills and so on), set auto-split rules for new income, save toward shared goals
with another user, and borrow between buckets while the app tracks what is owed.

## Status

| Part | State |
| --- | --- |
| React front end (`client/`) | Complete: all screens and flows |
| Express + MongoDB back end (`server/`) | In progress |

The front end currently talks to `client/src/api/mockApi.js`, a localStorage-backed mock that has the same
function names and behaviour as the planned REST endpoints (each function is annotated with its route).
When the server is ready, only that one file changes: replace each function body with an axios call.

## Front-end features

- Register, log in and log out (session restored on refresh)
- Dashboard: total balance, how it is divided, bucket tanks, saving progress, recent activity
- Custom buckets with colours and optional goal amounts
- Add income with live auto-split preview, and editable percentage rules
- Expenses assigned to a bucket and category, with overspend protection
- Move money between buckets, or borrow and return it with a "to return" list
- Shared goals between two users with per-person contribution totals
- Saving goals with progress meters
- Transaction history with type filters

## Tech

React 18, Vite, Redux Toolkit, React Router 6, plain CSS.

## Run the front end

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. To try a shared goal, register two accounts (log out in between), then create
the shared goal with the other account's email.

## Structure

```
client/src
  api/         mockApi.js (swap for real REST calls later)
  store/       authSlice, walletSlice (thunks + selectors)
  components/  Layout, ProtectedRoute, BucketVessel, Feedback
  pages/       Login, Register, Dashboard, Buckets, Income, Expenses, Move, Shared, Goals, History
  utils/       format.js, tx.js
```

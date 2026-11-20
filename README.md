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
| Express + MongoDB back end (`server/`) | Complete: REST API with JWT auth, connected to the front end |

The front end talks to the real API through `client/src/api/api.js`. `mockApi.js` is kept only as a reference
for the original behaviour (the server is a port of it).

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

## Run the project

You need Node 18+ and MongoDB (local `mongod`, or a free MongoDB Atlas connection string).

**1. Back end**

```bash
cd server
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

Open `.env` and set `JWT_SECRET` to any long random text, and `MONGO_URI` if you use Atlas.

```bash
npm run dev                 # API on http://localhost:5000
```

**2. Front end** (second terminal)

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

Vite forwards `/api` to the server, so no CORS setup is needed in development. To try a shared goal,
register two accounts (log out in between), then create the shared goal with the other account's email.

**3. Tests**

```bash
cd server
npm test
```

The tests run the real Express app against a real MongoDB (an in-memory one is downloaded on first run;
set `TEST_MONGO_URI` to use your own instead).

## REST API

All routes are under `/api`. Everything except register and login needs `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /auth/register, /auth/login | Create account / log in, returns `{ token, user }` |
| GET | /auth/me | Current user |
| GET | /wallet | Whole snapshot: balance, buckets, rules, loans, transactions |
| POST / PATCH / DELETE | /buckets, /buckets/:id | Create, rename or set goal, delete a bucket |
| POST | /transactions/income | Add income, split by the user's rules |
| PUT | /rules | Save auto-split percentages (total at most 100) |
| POST | /transactions/expense | Spend from a bucket or the unallocated balance |
| POST | /transactions/transfer | Move money, or borrow with `asLoan: true` |
| POST | /loans/:id/return | Return a borrowed amount |
| POST | /shared-buckets | Create a shared goal with a partner (by email) |
| POST | /shared-buckets/:id/contribute | Add money from your unallocated balance |

Passwords are hashed with bcrypt, sessions use JWT (7 days), and every query is scoped to the logged-in user.
Balance changes use atomic conditional updates, so two requests cannot overspend a bucket.

## Structure

```
client/src
  api/         api.js (real REST client), mockApi.js (reference only)
  store/       authSlice, walletSlice (thunks + selectors)
  components/  Layout, ProtectedRoute, BucketVessel, Feedback
  pages/       Login, Register, Dashboard, Buckets, Income, Expenses, Move, Shared, Goals, History
  utils/       format.js, tx.js
server/src
  config/       db.js
  models/       User, Bucket, Loan, Transaction
  middleware/   auth (JWT), errors
  controllers/  auth, wallet, bucket, transaction, shared
  services/     accounts.js (atomic debit/credit)
  routes/       index.js
  app.js, server.js
server/tests    api.test.js
```

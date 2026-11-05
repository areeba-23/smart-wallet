/*
 * Mock API layer.
 *
 * Every function here mirrors a REST endpoint the Express backend will expose
 * (see the endpoint comment above each function). Data lives in localStorage so
 * the whole front end works without a server. When the backend is ready, swap
 * each function body for an axios/fetch call and keep the same signature.
 * The Redux store never touches localStorage directly.
 */

const DB_KEY = 'smartwallet_db';
const SESSION_KEY = 'smartwallet_session';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const emptyDb = () => ({
  users: [],
  wallets: {},
  buckets: [],
  rules: {},
  loans: [],
  transactions: [],
});

function read() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : emptyDb();
  } catch {
    return emptyDb();
  }
}

function write(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function fail(message) {
  throw new Error(message);
}

function positive(amount) {
  const value = round(amount);
  if (!(value > 0)) fail('Enter an amount greater than zero.');
  return value;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function addTx(db, tx) {
  db.transactions.push({ id: uid(), date: new Date().toISOString(), ...tx });
}

/* An "account" is either the unallocated wallet pool ('wallet') or a personal bucket. */
function account(db, userId, id) {
  if (id === 'wallet') {
    const wallet = db.wallets[userId];
    return {
      id: 'wallet',
      name: 'Unallocated',
      get: () => wallet.unallocated,
      add: (n) => {
        wallet.unallocated = round(wallet.unallocated + n);
      },
    };
  }
  const bucket = db.buckets.find((b) => b.id === id && b.ownerId === userId && !b.shared);
  if (!bucket) fail('That bucket no longer exists.');
  return {
    id: bucket.id,
    name: bucket.name,
    get: () => bucket.balance,
    add: (n) => {
      bucket.balance = round(bucket.balance + n);
    },
  };
}

function requireFunds(acc, amount) {
  if (acc.get() < amount) {
    fail(`Not enough in ${acc.name}. It has Rs ${acc.get().toLocaleString('en-PK')}.`);
  }
}

/* ---------- Auth ---------- */

// POST /api/auth/register
export async function register({ name, email, password }) {
  await delay();
  const db = read();
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanName) fail('Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) fail('Enter a valid email address.');
  if ((password || '').length < 6) fail('Use a password with at least 6 characters.');
  if (db.users.some((u) => u.email === cleanEmail)) fail('An account with this email already exists.');

  // NOTE: plain-text password is only acceptable in this mock. The real backend hashes with bcrypt.
  const user = { id: uid(), name: cleanName, email: cleanEmail, password };
  db.users.push(user);
  db.wallets[user.id] = { unallocated: 0 };
  db.rules[user.id] = [];
  write(db);
  localStorage.setItem(SESSION_KEY, user.id);
  return publicUser(user);
}

// POST /api/auth/login
export async function login({ email, password }) {
  await delay();
  const db = read();
  const user = db.users.find((u) => u.email === (email || '').trim().toLowerCase());
  if (!user || user.password !== password) fail('Email or password is incorrect.');
  localStorage.setItem(SESSION_KEY, user.id);
  return publicUser(user);
}

// GET /api/auth/me
export async function me() {
  await delay(40);
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const user = read().users.find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

// POST /api/auth/logout
export async function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- Wallet snapshot ---------- */

// GET /api/wallet  (wallet, buckets, rules, loans and history in one call)
export async function getWallet(userId) {
  await delay(60);
  const db = read();
  const nameOf = (id) => db.users.find((u) => u.id === id)?.name || 'Unknown';

  const buckets = db.buckets
    .filter((b) => b.members.includes(userId))
    .map((b) => {
      const contributions = b.shared
        ? b.members.map((memberId) => ({
            userId: memberId,
            isMe: memberId === userId,
            name: memberId === userId ? 'You' : nameOf(memberId),
            total: round(
              db.transactions
                .filter((t) => t.type === 'contribution' && t.bucketId === b.id && t.userId === memberId)
                .reduce((sum, t) => sum + t.amount, 0)
            ),
          }))
        : [];
      return { ...b, contributions };
    });

  return {
    unallocated: db.wallets[userId].unallocated,
    buckets,
    rules: db.rules[userId] || [],
    loans: db.loans.filter((l) => l.userId === userId),
    transactions: db.transactions
      .filter((t) => t.visibleTo.includes(userId))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
  };
}

/* ---------- Buckets ---------- */

// POST /api/buckets
export async function createBucket(userId, { name, color, target }) {
  await delay();
  const db = read();
  const cleanName = (name || '').trim();
  if (!cleanName) fail('Give the bucket a name.');
  const goal = target === '' || target == null ? null : round(target);
  if (goal !== null && !(goal > 0)) fail('A goal must be greater than zero.');
  db.buckets.push({
    id: uid(),
    ownerId: userId,
    members: [userId],
    shared: false,
    name: cleanName,
    color: color || '#0E7C7B',
    balance: 0,
    target: goal,
    createdAt: new Date().toISOString(),
  });
  write(db);
}

// PATCH /api/buckets/:id
export async function updateBucket(userId, { id, name, target }) {
  await delay();
  const db = read();
  const bucket = db.buckets.find((b) => b.id === id && b.ownerId === userId);
  if (!bucket) fail('Only the bucket owner can change it.');
  if (name !== undefined) {
    if (!name.trim()) fail('Give the bucket a name.');
    bucket.name = name.trim();
  }
  if (target !== undefined) {
    if (target === '' || target === null) {
      bucket.target = null;
    } else {
      const goal = round(target);
      if (!(goal > 0)) fail('A goal must be greater than zero.');
      bucket.target = goal;
    }
  }
  write(db);
}

// DELETE /api/buckets/:id
export async function deleteBucket(userId, { id }) {
  await delay();
  const db = read();
  const bucket = db.buckets.find((b) => b.id === id && b.ownerId === userId);
  if (!bucket) fail('That bucket no longer exists.');
  if (bucket.shared) {
    if (bucket.balance > 0) fail('A shared bucket must be empty before it can be deleted.');
  } else {
    db.wallets[userId].unallocated = round(db.wallets[userId].unallocated + bucket.balance);
    db.rules[userId] = (db.rules[userId] || []).filter((r) => r.bucketId !== id);
    db.loans.forEach((l) => {
      if (l.status === 'open' && (l.fromId === id || l.toId === id)) l.status = 'cancelled';
    });
  }
  db.buckets = db.buckets.filter((b) => b.id !== id);
  write(db);
}

/* ---------- Money in and out ---------- */

// POST /api/transactions/income
export async function addIncome(userId, { amount, note }) {
  await delay();
  const db = read();
  const value = positive(amount);
  const rules = (db.rules[userId] || []).filter((r) =>
    db.buckets.some((b) => b.id === r.bucketId && b.ownerId === userId)
  );

  const splits = [];
  let allocated = 0;
  rules.forEach((rule) => {
    const share = round((value * rule.percent) / 100);
    if (share <= 0) return;
    const bucket = db.buckets.find((b) => b.id === rule.bucketId);
    bucket.balance = round(bucket.balance + share);
    allocated = round(allocated + share);
    splits.push({ bucketId: bucket.id, bucketName: bucket.name, amount: share });
  });

  const remainder = round(value - allocated);
  db.wallets[userId].unallocated = round(db.wallets[userId].unallocated + remainder);
  addTx(db, {
    type: 'income',
    userId,
    visibleTo: [userId],
    amount: value,
    note: (note || '').trim(),
    splits,
    remainder,
  });
  write(db);
}

// PUT /api/rules
export async function saveRules(userId, { rules }) {
  await delay();
  const db = read();
  const cleaned = rules
    .map((r) => ({ bucketId: r.bucketId, percent: round(r.percent) }))
    .filter((r) => r.percent > 0);
  cleaned.forEach((r) => {
    if (r.percent > 100) fail('A single bucket cannot take more than 100%.');
    if (!db.buckets.some((b) => b.id === r.bucketId && b.ownerId === userId && !b.shared)) {
      fail('One of the buckets in your split no longer exists.');
    }
  });
  const sum = cleaned.reduce((s, r) => s + r.percent, 0);
  if (sum > 100) fail(`Your split adds up to ${sum}%. Keep it at 100% or less.`);
  db.rules[userId] = cleaned;
  write(db);
}

// POST /api/transactions/expense
export async function addExpense(userId, { amount, bucketId, category, note }) {
  await delay();
  const db = read();
  const value = positive(amount);
  const source = account(db, userId, bucketId || 'wallet');
  requireFunds(source, value);
  source.add(-value);
  addTx(db, {
    type: 'expense',
    userId,
    visibleTo: [userId],
    amount: value,
    bucketId: source.id,
    bucketName: source.name,
    category: (category || '').trim() || 'General',
    note: (note || '').trim(),
  });
  write(db);
}

// POST /api/transactions/transfer   (asLoan = true records an amount to return)
export async function transfer(userId, { fromId, toId, amount, asLoan, note }) {
  await delay();
  const db = read();
  const value = positive(amount);
  if (!fromId || !toId) fail('Choose where the money comes from and where it goes.');
  if (fromId === toId) fail('Pick two different places.');
  if (asLoan && (fromId === 'wallet' || toId === 'wallet')) {
    fail('Borrowing works between two buckets, not the unallocated balance.');
  }
  const from = account(db, userId, fromId);
  const to = account(db, userId, toId);
  requireFunds(from, value);
  from.add(-value);
  to.add(value);

  let loanId = null;
  if (asLoan) {
    loanId = uid();
    db.loans.push({
      id: loanId,
      userId,
      fromId,
      toId,
      fromName: from.name,
      toName: to.name,
      amount: value,
      status: 'open',
      date: new Date().toISOString(),
    });
  }
  addTx(db, {
    type: asLoan ? 'borrow' : 'transfer',
    userId,
    visibleTo: [userId],
    amount: value,
    fromName: from.name,
    toName: to.name,
    loanId,
    note: (note || '').trim(),
  });
  write(db);
}

// POST /api/loans/:id/return
export async function returnLoan(userId, { loanId }) {
  await delay();
  const db = read();
  const loan = db.loans.find((l) => l.id === loanId && l.userId === userId);
  if (!loan || loan.status !== 'open') fail('This loan is already closed.');
  const borrower = account(db, userId, loan.toId);
  const lender = account(db, userId, loan.fromId);
  requireFunds(borrower, loan.amount);
  borrower.add(-loan.amount);
  lender.add(loan.amount);
  loan.status = 'returned';
  loan.returnedAt = new Date().toISOString();
  addTx(db, {
    type: 'return',
    userId,
    visibleTo: [userId],
    amount: loan.amount,
    fromName: loan.toName,
    toName: loan.fromName,
    loanId: loan.id,
    note: 'Loan returned',
  });
  write(db);
}

/* ---------- Shared buckets ---------- */

// POST /api/shared-buckets
export async function createSharedBucket(userId, { name, partnerEmail, target, color }) {
  await delay();
  const db = read();
  const cleanName = (name || '').trim();
  if (!cleanName) fail('Give the shared goal a name.');
  const partner = db.users.find((u) => u.email === (partnerEmail || '').trim().toLowerCase());
  if (!partner) fail('No Smart Wallet account uses that email. Ask them to register first.');
  if (partner.id === userId) fail('Add someone other than yourself.');
  const goal = target === '' || target == null ? null : round(target);
  if (goal !== null && !(goal > 0)) fail('A goal must be greater than zero.');
  db.buckets.push({
    id: uid(),
    ownerId: userId,
    members: [userId, partner.id],
    shared: true,
    name: cleanName,
    color: color || '#4F46E5',
    balance: 0,
    target: goal,
    createdAt: new Date().toISOString(),
  });
  write(db);
}

// POST /api/shared-buckets/:id/contribute
export async function contribute(userId, { bucketId, amount }) {
  await delay();
  const db = read();
  const value = positive(amount);
  const bucket = db.buckets.find((b) => b.id === bucketId && b.shared && b.members.includes(userId));
  if (!bucket) fail('You are not a member of that shared goal.');
  const wallet = account(db, userId, 'wallet');
  if (wallet.get() < value) {
    fail(
      `Your unallocated balance is Rs ${wallet.get().toLocaleString('en-PK')}. ` +
        'Add income or move money out of a bucket first.'
    );
  }
  wallet.add(-value);
  bucket.balance = round(bucket.balance + value);
  addTx(db, {
    type: 'contribution',
    userId,
    userName: db.users.find((u) => u.id === userId)?.name || 'A member',
    visibleTo: bucket.members,
    amount: value,
    bucketId: bucket.id,
    bucketName: bucket.name,
    note: '',
  });
  write(db);
}

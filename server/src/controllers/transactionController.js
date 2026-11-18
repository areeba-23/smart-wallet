import Bucket from '../models/Bucket.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { getAccount } from '../services/accounts.js';
import { HttpError } from '../utils/HttpError.js';
import { positive, round } from '../utils/money.js';

const clean = (v) => (v || '').toString().trim();

// POST /api/transactions/income : splits the amount using the user's rules
export async function addIncome(req, res) {
  const user = req.user;
  const value = positive(req.body.amount);

  // only rules whose bucket still belongs to the user
  const buckets = await Bucket.find({ ownerId: user._id, shared: false });
  const byId = Object.fromEntries(buckets.map((b) => [String(b._id), b]));
  const splits = [];
  let allocated = 0;
  for (const rule of user.rules) {
    const bucket = byId[String(rule.bucketId)];
    if (!bucket) continue;
    const share = round((value * rule.percent) / 100);
    if (share <= 0) continue;
    await Bucket.updateOne({ _id: bucket._id }, { $inc: { balance: share } });
    allocated = round(allocated + share);
    splits.push({ bucketId: String(bucket._id), bucketName: bucket.name, amount: share });
  }
  const remainder = round(value - allocated);
  await User.updateOne({ _id: user._id }, { $inc: { unallocated: remainder } });
  await Transaction.create({
    type: 'income',
    userId: user._id,
    visibleTo: [user._id],
    amount: value,
    note: clean(req.body.note),
    splits,
    remainder,
  });
  res.status(201).json({ ok: true });
}

// POST /api/transactions/expense
export async function addExpense(req, res) {
  const value = positive(req.body.amount);
  const source = await getAccount(req.user._id, req.body.bucketId || 'wallet');
  await source.debit(value);
  await Transaction.create({
    type: 'expense',
    userId: req.user._id,
    visibleTo: [req.user._id],
    amount: value,
    bucketId: source.id,
    bucketName: source.name,
    category: clean(req.body.category) || 'General',
    note: clean(req.body.note),
  });
  res.status(201).json({ ok: true });
}

// POST /api/transactions/transfer   (asLoan = true records an amount to return)
export async function transfer(req, res) {
  const { fromId, toId, asLoan } = req.body;
  const value = positive(req.body.amount);
  if (!fromId || !toId) throw new HttpError(400, 'Choose where the money comes from and where it goes.');
  if (fromId === toId) throw new HttpError(400, 'Pick two different places.');
  if (asLoan && (fromId === 'wallet' || toId === 'wallet')) {
    throw new HttpError(400, 'Borrowing works between two buckets, not the unallocated balance.');
  }
  const from = await getAccount(req.user._id, fromId);
  const to = await getAccount(req.user._id, toId);
  await from.debit(value);
  await to.credit(value);

  let loanId = null;
  if (asLoan) {
    const loan = await Loan.create({
      userId: req.user._id,
      fromId: from.id,
      toId: to.id,
      fromName: from.name,
      toName: to.name,
      amount: value,
    });
    loanId = String(loan._id);
  }
  await Transaction.create({
    type: asLoan ? 'borrow' : 'transfer',
    userId: req.user._id,
    visibleTo: [req.user._id],
    amount: value,
    fromName: from.name,
    toName: to.name,
    loanId,
    note: clean(req.body.note),
  });
  res.status(201).json({ ok: true });
}

// POST /api/loans/:id/return
export async function returnLoan(req, res) {
  const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
  if (!loan || loan.status !== 'open') throw new HttpError(400, 'This loan is already closed.');
  const borrower = await getAccount(req.user._id, loan.toId);
  const lender = await getAccount(req.user._id, loan.fromId);
  await borrower.debit(loan.amount);
  await lender.credit(loan.amount);
  loan.status = 'returned';
  loan.returnedAt = new Date();
  await loan.save();
  await Transaction.create({
    type: 'return',
    userId: req.user._id,
    visibleTo: [req.user._id],
    amount: loan.amount,
    fromName: loan.toName,
    toName: loan.fromName,
    loanId: String(loan._id),
    note: 'Loan returned',
  });
  res.json({ ok: true });
}

// PUT /api/rules
export async function saveRules(req, res) {
  const incoming = Array.isArray(req.body.rules) ? req.body.rules : [];
  const rules = incoming
    .map((r) => ({ bucketId: r.bucketId, percent: round(r.percent) }))
    .filter((r) => r.percent > 0);
  const owned = await Bucket.find({ ownerId: req.user._id, shared: false }).select('_id');
  const ownedIds = new Set(owned.map((b) => String(b._id)));
  for (const r of rules) {
    if (r.percent > 100) throw new HttpError(400, 'A single bucket cannot take more than 100%.');
    if (!ownedIds.has(String(r.bucketId))) {
      throw new HttpError(400, 'One of the buckets in your split no longer exists.');
    }
  }
  const sum = rules.reduce((s, r) => s + r.percent, 0);
  if (sum > 100) throw new HttpError(400, `Your split adds up to ${sum}%. Keep it at 100% or less.`);
  await User.updateOne({ _id: req.user._id }, { rules });
  res.json({ ok: true });
}

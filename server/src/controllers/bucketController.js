import Bucket from '../models/Bucket.js';
import Loan from '../models/Loan.js';
import User from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { round } from '../utils/money.js';

function parseGoal(target) {
  if (target === '' || target === null || target === undefined) return null;
  const goal = round(target);
  if (!(goal > 0)) throw new HttpError(400, 'A goal must be greater than zero.');
  return goal;
}

// POST /api/buckets
export async function createBucket(req, res) {
  const name = (req.body.name || '').trim();
  if (!name) throw new HttpError(400, 'Give the bucket a name.');
  const bucket = await Bucket.create({
    ownerId: req.user._id,
    members: [req.user._id],
    shared: false,
    name,
    color: req.body.color || '#0E7C7B',
    target: parseGoal(req.body.target),
  });
  res.status(201).json({ id: String(bucket._id) });
}

// PATCH /api/buckets/:id
export async function updateBucket(req, res) {
  const bucket = await Bucket.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!bucket) throw new HttpError(404, 'Only the bucket owner can change it.');
  if (req.body.name !== undefined) {
    if (!String(req.body.name).trim()) throw new HttpError(400, 'Give the bucket a name.');
    bucket.name = String(req.body.name).trim();
  }
  if (req.body.target !== undefined) bucket.target = parseGoal(req.body.target);
  await bucket.save();
  res.json({ ok: true });
}

// DELETE /api/buckets/:id
export async function deleteBucket(req, res) {
  const bucket = await Bucket.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!bucket) throw new HttpError(404, 'That bucket no longer exists.');

  if (bucket.shared) {
    if (bucket.balance > 0) throw new HttpError(400, 'A shared bucket must be empty before it can be deleted.');
  } else {
    // return its money to the unallocated pool, drop its split rule, cancel open loans
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { unallocated: bucket.balance }, $pull: { rules: { bucketId: bucket._id } } }
    );
    await Loan.updateMany(
      { userId: req.user._id, status: 'open', $or: [{ fromId: String(bucket._id) }, { toId: String(bucket._id) }] },
      { status: 'cancelled' }
    );
  }
  await bucket.deleteOne();
  res.json({ ok: true });
}

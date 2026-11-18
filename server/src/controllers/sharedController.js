import Bucket from '../models/Bucket.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { getAccount } from '../services/accounts.js';
import { HttpError } from '../utils/HttpError.js';
import { positive, round, rs } from '../utils/money.js';

// POST /api/shared-buckets
export async function createSharedBucket(req, res) {
  const name = (req.body.name || '').trim();
  if (!name) throw new HttpError(400, 'Give the shared goal a name.');
  const partner = await User.findOne({ email: (req.body.partnerEmail || '').trim().toLowerCase() });
  if (!partner) throw new HttpError(404, 'No Smart Wallet account uses that email. Ask them to register first.');
  if (String(partner._id) === String(req.user._id)) throw new HttpError(400, 'Add someone other than yourself.');

  let target = null;
  if (req.body.target !== '' && req.body.target != null) {
    target = round(req.body.target);
    if (!(target > 0)) throw new HttpError(400, 'A goal must be greater than zero.');
  }
  const bucket = await Bucket.create({
    ownerId: req.user._id,
    members: [req.user._id, partner._id],
    shared: true,
    name,
    color: req.body.color || '#4F46E5',
    target,
  });
  res.status(201).json({ id: String(bucket._id) });
}

// POST /api/shared-buckets/:id/contribute : money comes from the member's unallocated pool
export async function contribute(req, res) {
  const value = positive(req.body.amount);
  const bucket = await Bucket.findOne({ _id: req.params.id, shared: true, members: req.user._id });
  if (!bucket) throw new HttpError(403, 'You are not a member of that shared goal.');

  const wallet = await getAccount(req.user._id, 'wallet');
  const have = await wallet.balance();
  if (have < value) {
    throw new HttpError(
      400,
      `Your unallocated balance is ${rs(have)}. Add income or move money out of a bucket first.`
    );
  }
  await wallet.debit(value);
  await Bucket.updateOne({ _id: bucket._id }, { $inc: { balance: value } });
  await Transaction.create({
    type: 'contribution',
    userId: req.user._id,
    userName: req.user.name,
    visibleTo: bucket.members,
    amount: value,
    bucketId: String(bucket._id),
    bucketName: bucket.name,
  });
  res.status(201).json({ ok: true });
}

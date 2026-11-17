import Bucket from '../models/Bucket.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { bucketJson, loanJson, txJson } from '../utils/serialize.js';
import { round } from '../utils/money.js';

// GET /api/wallet : everything the dashboard needs in one call
export async function getWallet(req, res) {
  const userId = req.user._id;
  const [user, buckets, loans, transactions] = await Promise.all([
    User.findById(userId),
    Bucket.find({ members: userId }).sort({ createdAt: 1 }),
    Loan.find({ userId }).sort({ createdAt: -1 }),
    Transaction.find({ visibleTo: userId }).sort({ createdAt: -1 }).limit(500),
  ]);

  // contribution totals per member for the shared buckets
  const sharedIds = buckets.filter((b) => b.shared).map((b) => String(b._id));
  const contribTx = sharedIds.length
    ? await Transaction.find({ type: 'contribution', bucketId: { $in: sharedIds } })
    : [];
  const memberIds = [...new Set(buckets.flatMap((b) => b.members.map(String)))];
  const members = await User.find({ _id: { $in: memberIds } }).select('name');
  const nameOf = Object.fromEntries(members.map((m) => [String(m._id), m.name]));

  const bucketList = buckets.map((b) => {
    if (!b.shared) return bucketJson({ ...b.toObject(), balance: round(b.balance) });
    const contributions = b.members.map((m) => ({
      userId: String(m),
      isMe: String(m) === String(userId),
      name: String(m) === String(userId) ? 'You' : nameOf[String(m)] || 'Unknown',
      total: round(
        contribTx
          .filter((t) => t.bucketId === String(b._id) && String(t.userId) === String(m))
          .reduce((s, t) => s + t.amount, 0)
      ),
    }));
    return bucketJson({ ...b.toObject(), balance: round(b.balance) }, contributions);
  });

  res.json({
    unallocated: round(user.unallocated),
    buckets: bucketList,
    rules: user.rules.map((r) => ({ bucketId: String(r.bucketId), percent: r.percent })),
    loans: loans.map(loanJson),
    transactions: transactions.map(txJson),
  });
}

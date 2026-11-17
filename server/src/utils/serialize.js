/* Turns Mongo documents into the exact JSON shapes the React client expects. */
const id = (v) => String(v);

export const publicUser = (u) => ({ id: id(u._id), name: u.name, email: u.email });

export function bucketJson(b, contributions = []) {
  return {
    id: id(b._id),
    ownerId: id(b.ownerId),
    members: b.members.map(id),
    shared: b.shared,
    name: b.name,
    color: b.color,
    balance: b.balance,
    target: b.target ?? null,
    createdAt: b.createdAt,
    contributions,
  };
}

export const loanJson = (l) => ({
  id: id(l._id),
  userId: id(l.userId),
  fromId: l.fromId,
  toId: l.toId,
  fromName: l.fromName,
  toName: l.toName,
  amount: l.amount,
  status: l.status,
  date: l.createdAt,
  returnedAt: l.returnedAt,
});

export const txJson = (t) => ({
  id: id(t._id),
  type: t.type,
  userId: id(t.userId),
  userName: t.userName,
  date: t.createdAt,
  amount: t.amount,
  note: t.note,
  bucketId: t.bucketId,
  bucketName: t.bucketName,
  category: t.category,
  fromName: t.fromName,
  toName: t.toName,
  loanId: t.loanId,
  splits: t.splits,
  remainder: t.remainder,
});

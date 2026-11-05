import { useState } from 'react';
import { useSelector } from 'react-redux';
import { contribute, createSharedBucket, selectWallet } from '../store/walletSlice.js';
import { useSubmit } from '../hooks.js';
import { BUCKET_COLORS, money, percent } from '../utils/format.js';
import { EmptyState, FormMessage, PageHeader } from '../components/Feedback.jsx';

function SharedCard({ bucket, unallocated }) {
  const { submit, error, notice, busy } = useSubmit();
  const [amount, setAmount] = useState('');
  const pct = bucket.target ? percent(bucket.balance, bucket.target) : null;

  async function onSubmit(e) {
    e.preventDefault();
    if (await submit(contribute, { bucketId: bucket.id, amount }, `Added ${money(amount)}.`)) setAmount('');
  }

  return (
    <article className="panel shared-card">
      <div className="row-between">
        <h3>{bucket.name}</h3>
        <b>{money(bucket.balance)}{bucket.target ? ` of ${money(bucket.target)}` : ''}</b>
      </div>
      {pct !== null && (
        <div className="meter" aria-label={`${Math.round(pct)}% of goal`}>
          <span style={{ width: `${pct}%`, background: bucket.color }} />
        </div>
      )}
      <ul className="contrib-list">
        {bucket.contributions.map((c) => (
          <li key={c.userId}>
            <span>{c.name}</span>
            <b>{money(c.total)}</b>
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={onSubmit}>
        <input type="number" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" aria-label={`Contribute to ${bucket.name}`} required />
        <button className="btn btn-primary" disabled={busy}>Contribute</button>
      </form>
      <p className="muted small">Contributions come from your unallocated balance ({money(unallocated)}).</p>
      <FormMessage error={error} notice={notice} />
    </article>
  );
}

export default function Shared() {
  const data = useSelector(selectWallet);
  const { submit, error, notice, busy } = useSubmit();
  const [form, setForm] = useState({ name: '', partnerEmail: '', target: '', color: BUCKET_COLORS[1] });
  if (!data) return null;

  const shared = data.buckets.filter((b) => b.shared);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const ok = await submit(createSharedBucket, form, `"${form.name.trim()}" is shared.`);
    if (ok) setForm({ ...form, name: '', partnerEmail: '', target: '' });
  }

  return (
    <>
      <PageHeader title="Shared goals">
        Save toward one goal with another Smart Wallet user. Everyone sees who contributed what.
      </PageHeader>

      <form className="panel form-grid" onSubmit={onSubmit}>
        <label>
          Goal name
          <input value={form.name} onChange={set('name')} placeholder="Trip to Hunza" required />
        </label>
        <label>
          Partner's email
          <input type="email" value={form.partnerEmail} onChange={set('partnerEmail')} required />
        </label>
        <label>
          Target amount (optional)
          <input type="number" min="1" step="any" value={form.target} onChange={set('target')} />
        </label>
        <div className="full">
          <FormMessage error={error} notice={notice} />
          <button className="btn btn-primary" disabled={busy}>Create shared goal</button>
        </div>
      </form>

      {shared.length === 0 ? (
        <EmptyState title="No shared goals yet">Create one above. Your partner needs a Smart Wallet account first.</EmptyState>
      ) : (
        <div className="shared-grid">
          {shared.map((b) => <SharedCard key={b.id} bucket={b} unallocated={data.unallocated} />)}
        </div>
      )}
    </>
  );
}
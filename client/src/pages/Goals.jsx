import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectWallet, updateBucket } from '../store/walletSlice.js';
import { useSubmit } from '../hooks.js';
import { money, percent } from '../utils/format.js';
import { EmptyState, FormMessage, PageHeader } from '../components/Feedback.jsx';

function GoalRow({ bucket }) {
  const { submit, error, notice, busy } = useSubmit();
  const [target, setTarget] = useState(bucket.target ?? '');
  const pct = bucket.target ? percent(bucket.balance, bucket.target) : 0;
  const remaining = bucket.target ? Math.max(0, bucket.target - bucket.balance) : null;

  function save(e) {
    e.preventDefault();
    submit(updateBucket, { id: bucket.id, target }, target === '' ? 'Goal removed.' : 'Goal saved.');
  }

  return (
    <li className="goal-row">
      <div className="row-between">
        <h3><i className="dot" style={{ background: bucket.color }} /> {bucket.name}</h3>
        <span className="muted">{bucket.target ? `${Math.round(pct)}%` : 'No goal'}</span>
      </div>
      <div className="meter"><span style={{ width: `${pct}%`, background: bucket.color }} /></div>
      <p className="muted small">
        {bucket.target
          ? pct >= 100 ? `Goal reached with ${money(bucket.balance)}.` : `${money(bucket.balance)} saved, ${money(remaining)} to go.`
          : `${money(bucket.balance)} saved. Set a target to track progress.`}
      </p>
      <form className="inline-form" onSubmit={save}>
        <input type="number" min="1" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target amount" aria-label={`${bucket.name} goal`} />
        <button className="btn btn-small btn-primary" disabled={busy}>Save goal</button>
      </form>
      <FormMessage error={error} notice={notice} />
    </li>
  );
}

export default function Goals() {
  const data = useSelector(selectWallet);
  if (!data) return null;
  const personal = data.buckets.filter((b) => !b.shared);

  return (
    <>
      <PageHeader title="Saving goals">Set a target for each bucket and watch it fill.</PageHeader>
      {personal.length === 0 ? (
        <EmptyState title="No buckets to set goals on">Create a bucket first, then come back here.</EmptyState>
      ) : (
        <ul className="goal-list">
          {personal.map((b) => <GoalRow key={b.id} bucket={b} />)}
        </ul>
      )}
      <p className="muted small">Goals for shared buckets are set when you create them, on the Shared goals page.</p>
    </>
  );
}
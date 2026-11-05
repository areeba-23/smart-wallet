import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { addIncome, saveRules, selectWallet } from '../store/walletSlice.js';
import { useSubmit } from '../hooks.js';
import { money } from '../utils/format.js';
import { FormMessage, PageHeader } from '../components/Feedback.jsx';

export default function Income() {
  const data = useSelector(selectWallet);
  const income = useSubmit();
  const rulesForm = useSubmit();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [percents, setPercents] = useState({});

  const personal = useMemo(() => (data ? data.buckets.filter((b) => !b.shared) : []), [data]);

  useEffect(() => {
    if (!data) return;
    const next = {};
    data.rules.forEach((r) => {
      next[r.bucketId] = String(r.percent);
    });
    setPercents(next);
  }, [data]);

  if (!data) return null;

  const totalPercent = personal.reduce((s, b) => s + (Number(percents[b.id]) || 0), 0);
  const value = Number(amount) || 0;
  const preview = personal
    .map((b) => ({ bucket: b, share: Math.round(value * (Number(percents[b.id]) || 0)) / 100 }))
    .filter((p) => p.share > 0);
  const previewRest = value - preview.reduce((s, p) => s + p.share, 0);

  async function onAddIncome(e) {
    e.preventDefault();
    const ok = await income.submit(addIncome, { amount, note }, `${money(value)} added.`);
    if (ok) {
      setAmount('');
      setNote('');
    }
  }

  function onSaveRules(e) {
    e.preventDefault();
    const rules = personal.map((b) => ({ bucketId: b.id, percent: Number(percents[b.id]) || 0 }));
    rulesForm.submit(saveRules, { rules }, 'Auto-split saved. It applies to income you add from now on.');
  }

  return (
    <>
      <PageHeader title="Add income">
        New income is divided by your auto-split rules. Whatever is not assigned stays unallocated.
      </PageHeader>

      <div className="two-col">
        <form className="panel" onSubmit={onAddIncome}>
          <h2 className="section-title">New income</h2>
          <label>
            Amount (Rs)
            <input type="number" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>
            Note (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allowance, salary, freelance" />
          </label>

          {value > 0 && (
            <div className="preview">
              <p className="label-text">This income will be split like this</p>
              <ul>
                {preview.map((p) => (
                  <li key={p.bucket.id}><span>{p.bucket.name}</span><b>{money(p.share)}</b></li>
                ))}
                <li><span>Unallocated</span><b>{money(Math.round(previewRest * 100) / 100)}</b></li>
              </ul>
            </div>
          )}

          <FormMessage error={income.error} notice={income.notice} />
          <button className="btn btn-primary" disabled={income.busy}>Add income</button>
        </form>

        <form className="panel" onSubmit={onSaveRules}>
          <h2 className="section-title">Auto-split rules</h2>
          {personal.length === 0 ? (
            <p className="muted">You need a bucket first. <Link to="/buckets">Create a bucket</Link></p>
          ) : (
            <>
              <ul className="rule-list">
                {personal.map((b) => (
                  <li key={b.id}>
                    <label>
                      <span><i className="dot" style={{ background: b.color }} /> {b.name}</span>
                      <span className="pct-input">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={percents[b.id] ?? ''}
                          onChange={(e) => setPercents({ ...percents, [b.id]: e.target.value })}
                          aria-label={`${b.name} percentage`}
                        />
                        %
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className={totalPercent > 100 ? 'msg msg-error' : 'muted'}>
                {totalPercent > 100
                  ? `Total is ${totalPercent}%. Bring it down to 100% or less.`
                  : `${totalPercent}% assigned, ${Math.round((100 - totalPercent) * 100) / 100}% stays unallocated.`}
              </p>
              <FormMessage error={rulesForm.error} notice={rulesForm.notice} />
              <button className="btn btn-primary" disabled={rulesForm.busy || totalPercent > 100}>Save auto-split</button>
            </>
          )}
        </form>
      </div>
    </>
  );
}
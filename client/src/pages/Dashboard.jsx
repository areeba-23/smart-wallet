import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectTotals, selectWallet } from '../store/walletSlice.js';
import { money, percent, shortDate } from '../utils/format.js';
import BucketVessel from '../components/BucketVessel.jsx';
import { EmptyState, PageHeader } from '../components/Feedback.jsx';
import { txLabel, txAmountClass, txSign } from '../utils/tx.js';

export default function Dashboard() {
  const data = useSelector(selectWallet);
  const totals = useSelector(selectTotals);
  const user = useSelector((s) => s.auth.user);
  if (!data || !totals) return null;

  const { buckets, loans, transactions } = data;
  const openLoans = loans.filter((l) => l.status === 'open');
  const goals = buckets.filter((b) => b.target);
  const segments = [
    ...buckets.map((b) => ({ key: b.id, label: b.name, color: b.color, value: b.shared ? b.contributions.find((c) => c.isMe)?.total || 0 : b.balance })),
    { key: 'wallet', label: 'Unallocated', color: '#C5CED8', value: totals.unallocated },
  ].filter((s) => s.value > 0);

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`}>
        You have {money(totals.total)} across {buckets.length} {buckets.length === 1 ? 'bucket' : 'buckets'}.
      </PageHeader>

      <section className="panel">
        <div className="split-bar" role="img" aria-label="How your balance is divided">
          {segments.length === 0 ? (
            <span className="split-empty" />
          ) : (
            segments.map((s) => (
              <span key={s.key} style={{ width: `${percent(s.value, totals.total)}%`, background: s.color }} title={`${s.label}: ${money(s.value)}`} />
            ))
          )}
        </div>
        <ul className="legend">
          {segments.map((s) => (
            <li key={s.key}>
              <i style={{ background: s.color }} /> {s.label} <b>{money(s.value)}</b>
            </li>
          ))}
        </ul>
        <p className="muted small">
          Unallocated {money(totals.unallocated)} is money not yet placed in a bucket.
          {totals.sharedMine > 0 && ` Your contributions to shared goals: ${money(totals.sharedMine)}.`}
        </p>
      </section>

      <h2 className="section-title">Buckets</h2>
      {buckets.length === 0 ? (
        <EmptyState title="No buckets yet">
          <Link to="/buckets">Create your first bucket</Link> to start dividing your money.
        </EmptyState>
      ) : (
        <div className="vessel-grid">
          {buckets.map((b) => (
            <BucketVessel key={b.id} bucket={b} total={totals.total} />
          ))}
        </div>
      )}

      <div className="two-col">
        <section className="panel">
          <h2 className="section-title">Saving progress</h2>
          {goals.length === 0 ? (
            <p className="muted">Set a goal on a bucket to track it here. <Link to="/goals">Set a goal</Link></p>
          ) : (
            <ul className="progress-list">
              {goals.map((b) => (
                <li key={b.id}>
                  <div className="row-between">
                    <span>{b.name}</span>
                    <span className="muted">{money(b.balance)} of {money(b.target)}</span>
                  </div>
                  <div className="meter"><span style={{ width: `${percent(b.balance, b.target)}%`, background: b.color }} /></div>
                </li>
              ))}
            </ul>
          )}
          {openLoans.length > 0 && (
            <p className="note">
              {openLoans.length} open {openLoans.length === 1 ? 'loan' : 'loans'} between buckets, {money(openLoans.reduce((s, l) => s + l.amount, 0))} to return. <Link to="/move">Review</Link>
            </p>
          )}
        </section>

        <section className="panel">
          <h2 className="section-title">Recent activity</h2>
          {transactions.length === 0 ? (
            <p className="muted">Nothing yet. <Link to="/income">Add your first income</Link>.</p>
          ) : (
            <ul className="tx-list">
              {transactions.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <div>
                    <b>{txLabel(t, user.id)}</b>
                    <span className="muted small">{shortDate(t.date)}</span>
                  </div>
                  <span className={txAmountClass(t, user.id)}>{txSign(t, user.id)}{money(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

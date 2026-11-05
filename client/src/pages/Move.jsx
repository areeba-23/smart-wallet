import { useState } from 'react';
import { useSelector } from 'react-redux';
import { returnLoan, selectWallet, transfer } from '../store/walletSlice.js';
import { useSubmit } from '../hooks.js';
import { money, shortDate } from '../utils/format.js';
import { EmptyState, FormMessage, PageHeader } from '../components/Feedback.jsx';

export default function Move() {
  const data = useSelector(selectWallet);
  const move = useSubmit();
  const loanAction = useSubmit();
  const [form, setForm] = useState({ fromId: '', toId: '', amount: '', asLoan: false, note: '' });
  if (!data) return null;

  const personal = data.buckets.filter((b) => !b.shared);
  const places = [{ id: 'wallet', name: 'Unallocated', balance: data.unallocated }, ...personal];
  const openLoans = data.loans.filter((l) => l.status === 'open');
  const closedLoans = data.loans.filter((l) => l.status !== 'open');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const ok = await move.submit(
      transfer,
      form,
      form.asLoan ? `Borrowed ${money(form.amount)}. It is listed below until you return it.` : `Moved ${money(form.amount)}.`
    );
    if (ok) setForm({ ...form, amount: '', note: '' });
  }

  return (
    <>
      <PageHeader title="Move & borrow">
        Move money between buckets. Mark it as borrowed and the app tracks what you still need to return.
      </PageHeader>

      <div className="two-col">
        <form className="panel" onSubmit={onSubmit}>
          <h2 className="section-title">Move money</h2>
          <label>
            From
            <select value={form.fromId} onChange={set('fromId')} required>
              <option value="" disabled>Choose a source</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name} ({money(p.balance)})</option>)}
            </select>
          </label>
          <label>
            To
            <select value={form.toId} onChange={set('toId')} required>
              <option value="" disabled>Choose a destination</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name} ({money(p.balance)})</option>)}
            </select>
          </label>
          <label>
            Amount (Rs)
            <input type="number" min="1" step="any" value={form.amount} onChange={set('amount')} required />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.asLoan} onChange={set('asLoan')} />
            <span>Borrow: I will return this later</span>
          </label>
          <label>
            Note (optional)
            <input value={form.note} onChange={set('note')} />
          </label>
          <FormMessage error={move.error} notice={move.notice} />
          <button className="btn btn-primary" disabled={move.busy}>{form.asLoan ? 'Borrow' : 'Move money'}</button>
        </form>

        <section className="panel">
          <h2 className="section-title">To return</h2>
          {openLoans.length === 0 ? (
            <EmptyState title="Nothing to return">Borrowed money you still owe a bucket appears here.</EmptyState>
          ) : (
            <ul className="tx-list">
              {openLoans.map((l) => (
                <li key={l.id}>
                  <div>
                    <b>{money(l.amount)}</b>
                    <span className="muted small">{l.toName} owes {l.fromName} · {shortDate(l.date)}</span>
                  </div>
                  <button className="btn btn-small btn-primary" disabled={loanAction.busy} onClick={() => loanAction.submit(returnLoan, { loanId: l.id }, 'Returned.')}>
                    Return
                  </button>
                </li>
              ))}
            </ul>
          )}
          <FormMessage error={loanAction.error} notice={loanAction.notice} />
          {closedLoans.length > 0 && (
            <>
              <h3 className="subhead">Closed</h3>
              <ul className="tx-list quiet">
                {closedLoans.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <div>
                      <b>{money(l.amount)}</b>
                      <span className="muted small">{l.fromName} and {l.toName} · {l.status === 'returned' ? 'returned' : 'cancelled'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { addExpense, selectWallet } from '../store/walletSlice.js';
import { useSubmit } from '../hooks.js';
import { money, shortDate } from '../utils/format.js';
import { EmptyState, FormMessage, PageHeader } from '../components/Feedback.jsx';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Education', 'Health', 'Entertainment', 'Other'];

export default function Expenses() {
  const data = useSelector(selectWallet);
  const { submit, error, notice, busy } = useSubmit();
  const [form, setForm] = useState({ amount: '', bucketId: '', category: CATEGORIES[0], note: '' });
  if (!data) return null;

  const personal = data.buckets.filter((b) => !b.shared);
  const expenses = data.transactions.filter((t) => t.type === 'expense');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const ok = await submit(addExpense, form, `${money(form.amount)} recorded.`);
    if (ok) setForm({ ...form, amount: '', note: '' });
  }

  return (
    <>
      <PageHeader title="Expenses">Record what you spent and which bucket it came out of.</PageHeader>

      <div className="two-col">
        <form className="panel" onSubmit={onSubmit}>
          <h2 className="section-title">New expense</h2>
          <label>
            Amount (Rs)
            <input type="number" min="1" step="any" value={form.amount} onChange={set('amount')} required />
          </label>
          <label>
            Paid from
            <select value={form.bucketId} onChange={set('bucketId')}>
              <option value="">Unallocated ({money(data.unallocated)})</option>
              {personal.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({money(b.balance)})</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Note (optional)
            <input value={form.note} onChange={set('note')} />
          </label>
          <FormMessage error={error} notice={notice} />
          <button className="btn btn-primary" disabled={busy}>Record expense</button>
        </form>

        <section className="panel">
          <h2 className="section-title">Recent expenses</h2>
          {expenses.length === 0 ? (
            <EmptyState title="No expenses yet">Your spending will show up here.</EmptyState>
          ) : (
            <ul className="tx-list">
              {expenses.slice(0, 10).map((t) => (
                <li key={t.id}>
                  <div>
                    <b>{t.category}</b>
                    <span className="muted small">{t.bucketName} · {shortDate(t.date)}{t.note ? ` · ${t.note}` : ''}</span>
                  </div>
                  <span className="amt amt-out">-{money(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
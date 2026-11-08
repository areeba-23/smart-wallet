import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectWallet } from '../store/walletSlice.js';
import { money, shortDate } from '../utils/format.js';
import { EmptyState, PageHeader } from '../components/Feedback.jsx';
import { TYPE_NAMES, txAmountClass, txLabel, txSign } from '../utils/tx.js';

export default function History() {
  const data = useSelector(selectWallet);
  const me = useSelector((s) => s.auth.user);
  const [filter, setFilter] = useState('all');
  if (!data) return null;

  const rows = data.transactions.filter((t) => filter === 'all' || t.type === filter);

  return (
    <>
      <PageHeader title="Transaction history">Income, expenses, transfers, loans and shared contributions.</PageHeader>

      <div className="filters" role="group" aria-label="Filter by type">
        {['all', ...Object.keys(TYPE_NAMES)].map((key) => (
          <button key={key} className={filter === key ? 'chip active' : 'chip'} onClick={() => setFilter(key)}>
            {key === 'all' ? 'All' : TYPE_NAMES[key]}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nothing here">No transactions match this filter yet.</EmptyState>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th>Details</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{shortDate(t.date)}</td>
                  <td>{TYPE_NAMES[t.type]}</td>
                  <td>
                    {txLabel(t, me.id)}
                    {t.type === 'income' && t.splits?.length > 0 && (
                      <span className="muted small block">
                        Split: {t.splits.map((s) => `${s.bucketName} ${money(s.amount)}`).join(', ')}
                        {t.remainder > 0 ? `, unallocated ${money(t.remainder)}` : ''}
                      </span>
                    )}
                  </td>
                  <td className={`num ${txAmountClass(t, me.id)}`}>{txSign(t, me.id)}{money(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

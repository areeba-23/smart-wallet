import { useState } from 'react';
import { useSelector } from 'react-redux';
import { createBucket, deleteBucket, selectTotals, selectWallet, updateBucket } from '../store/walletSlice.js';
import { useSubmit } from '../hooks.js';
import { BUCKET_COLORS, money } from '../utils/format.js';
import BucketVessel from '../components/BucketVessel.jsx';
import { EmptyState, FormMessage, PageHeader } from '../components/Feedback.jsx';

function ColorPicker({ value, onChange }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Bucket colour">
      {BUCKET_COLORS.map((c) => (
        <button
          type="button"
          key={c}
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          className={value === c ? 'swatch selected' : 'swatch'}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

function BucketRow({ bucket, total }) {
  const { submit, error, busy } = useSubmit();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bucket.name);

  async function save(e) {
    e.preventDefault();
    if (await submit(updateBucket, { id: bucket.id, name })) setEditing(false);
  }

  async function remove() {
    const note = bucket.balance > 0 && !bucket.shared ? ` Its ${money(bucket.balance)} will move back to your unallocated balance.` : '';
    if (window.confirm(`Delete "${bucket.name}"?${note}`)) {
      submit(deleteBucket, { id: bucket.id });
    }
  }

  return (
    <BucketVessel bucket={bucket} total={total}>
      {editing ? (
        <form className="inline-form" onSubmit={save}>
          <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Bucket name" required />
          <button className="btn btn-small btn-primary" disabled={busy}>Save</button>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => { setEditing(false); setName(bucket.name); }}>Cancel</button>
        </form>
      ) : (
        <div className="row-actions">
          <button className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>Rename</button>
          <button className="btn btn-small btn-danger" onClick={remove}>Delete</button>
        </div>
      )}
      <FormMessage error={error} />
    </BucketVessel>
  );
}

export default function Buckets() {
  const data = useSelector(selectWallet);
  const totals = useSelector(selectTotals);
  const { submit, error, notice, busy } = useSubmit();
  const [form, setForm] = useState({ name: '', target: '', color: BUCKET_COLORS[0] });
  if (!data) return null;

  const mine = data.buckets.filter((b) => !b.shared);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const ok = await submit(createBucket, form, `"${form.name.trim()}" is ready.`);
    if (ok) setForm({ name: '', target: '', color: BUCKET_COLORS[(mine.length + 1) % BUCKET_COLORS.length] });
  }

  return (
    <>
      <PageHeader title="Buckets">
        Split your money by purpose: Travel, Emergency, Bills, or anything else.
      </PageHeader>

      <form className="panel form-grid" onSubmit={onSubmit}>
        <label>
          Bucket name
          <input value={form.name} onChange={set('name')} placeholder="Travel" required />
        </label>
        <label>
          Goal amount (optional)
          <input type="number" min="1" step="any" value={form.target} onChange={set('target')} placeholder="50000" />
        </label>
        <div className="full">
          <span className="label-text">Colour</span>
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </div>
        <div className="full">
          <FormMessage error={error} notice={notice} />
          <button className="btn btn-primary" disabled={busy}>Create bucket</button>
        </div>
      </form>

      {mine.length === 0 ? (
        <EmptyState title="No buckets yet">Create one above. Money you add goes into buckets through the auto-split rules.</EmptyState>
      ) : (
        <div className="vessel-grid">
          {mine.map((b) => (
            <BucketRow key={b.id} bucket={b} total={totals.total} />
          ))}
        </div>
      )}
    </>
  );
}

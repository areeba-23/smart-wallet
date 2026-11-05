import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubmit } from '../hooks.js';
import { register } from '../store/authSlice.js';
import { FormMessage } from '../components/Feedback.jsx';

export default function Register() {
  const { submit, error, busy } = useSubmit();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function onSubmit(e) {
    e.preventDefault();
    submit(register, form);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create your wallet</h1>
        <label>
          Name
          <input value={form.name} onChange={set('name')} autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={6} required />
          <span className="hint">At least 6 characters.</span>
        </label>
        <FormMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

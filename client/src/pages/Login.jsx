import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubmit } from '../hooks.js';
import { login } from '../store/authSlice.js';
import { FormMessage } from '../components/Feedback.jsx';

export default function Login() {
  const { submit, error, busy } = useSubmit();
  const [form, setForm] = useState({ email: '', password: '' });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function onSubmit(e) {
    e.preventDefault();
    submit(login, form);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Log in to Smart Wallet</h1>
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={set('password')} autoComplete="current-password" required />
        </label>
        <FormMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

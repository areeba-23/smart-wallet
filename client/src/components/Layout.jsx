import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { loadWallet } from '../store/walletSlice.js';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/buckets', label: 'Buckets' },
  { to: '/income', label: 'Add income' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/move', label: 'Move & borrow' },
  { to: '/shared', label: 'Shared goals' },
  { to: '/goals', label: 'Saving goals' },
  { to: '/history', label: 'History' },
];

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const loading = useSelector((s) => s.wallet.loading);

  useEffect(() => {
    dispatch(loadWallet());
  }, [dispatch]);

  async function handleLogout() {
    await dispatch(logout());
    navigate('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Smart Wallet</div>
        <nav aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p className="muted small">{user?.name}</p>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        {loading ? <p className="muted">Loading your wallet...</p> : <Outlet />}
      </main>
    </div>
  );
}

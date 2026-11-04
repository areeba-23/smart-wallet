export function FormMessage({ error, notice }) {
  if (error) return <p className="msg msg-error" role="alert">{error}</p>;
  if (notice) return <p className="msg msg-ok" role="status">{notice}</p>;
  return null;
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function PageHeader({ title, children }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      {children && <p className="page-sub">{children}</p>}
    </header>
  );
}

export const BUCKET_COLORS = [
  '#0E7C7B', '#4F46E5', '#D97706', '#BE185D',
  '#3F8F3A', '#0284C7', '#7C3AED', '#475569',
];

export function money(n) {
  const value = Number(n) || 0;
  return 'Rs ' + value.toLocaleString('en-PK', { maximumFractionDigits: 2 });
}

export function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function percent(part, whole) {
  if (!whole || whole <= 0) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

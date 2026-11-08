import { money, percent } from '../utils/format.js';

/* A bucket drawn as a tank. The fill level shows progress toward its goal, or its share of the total when no goal is set. */
export default function BucketVessel({ bucket, total, children }) {
  const hasGoal = bucket.target && bucket.target > 0;
  const fill = hasGoal ? percent(bucket.balance, bucket.target) : percent(bucket.balance, total);
  return (
    <article className="vessel-card">
      <div
        className="vessel"
        role="img"
        aria-label={`${bucket.name} is ${Math.round(fill)}% ${hasGoal ? 'of its goal' : 'of your total balance'}`}
      >
        <div className="vessel-fill" style={{ height: `${fill}%`, background: bucket.color }} />
      </div>
      <div className="vessel-body">
        <h3>
          {bucket.name}
          {bucket.shared && <span className="tag">Shared</span>}
        </h3>
        <p className="vessel-amount">{money(bucket.balance)}</p>
        <p className="muted">
          {hasGoal
            ? `${Math.round(fill)}% of ${money(bucket.target)} goal`
            : `${Math.round(fill)}% of your total`}
        </p>
        {children}
      </div>
    </article>
  );
}

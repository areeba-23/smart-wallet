/* Display helpers shared by the dashboard and the history page. */
export const TYPE_NAMES = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  borrow: 'Borrow',
  return: 'Loan return',
  contribution: 'Shared contribution',
};

const byPartner = (t, meId) => t.type === 'contribution' && meId && t.userId !== meId;

export function txLabel(t, meId) {
  switch (t.type) {
    case 'income':
      return t.note ? `Income: ${t.note}` : 'Income added';
    case 'expense':
      return `${t.category} from ${t.bucketName}`;
    case 'transfer':
    case 'borrow':
    case 'return':
      return `${TYPE_NAMES[t.type]}: ${t.fromName} to ${t.toName}`;
    case 'contribution':
      return byPartner(t, meId)
        ? `${t.userName || 'Your partner'} contributed to ${t.bucketName}`
        : `You contributed to ${t.bucketName}`;
    default:
      return t.type;
  }
}

export function txSign(t, meId) {
  if (t.type === 'income') return '+';
  if (t.type === 'expense') return '-';
  if (t.type === 'contribution') return byPartner(t, meId) ? '' : '-';
  return '';
}

export function txAmountClass(t, meId) {
  if (t.type === 'income') return 'amt amt-in';
  if (t.type === 'expense') return 'amt amt-out';
  if (t.type === 'contribution' && !byPartner(t, meId)) return 'amt amt-out';
  return 'amt';
}

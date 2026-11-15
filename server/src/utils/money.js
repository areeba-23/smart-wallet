import { HttpError } from './HttpError.js';

export const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/* Validates an amount from the request body and returns it rounded to 2 decimals. */
export function positive(amount) {
  const value = round(amount);
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new HttpError(400, 'Enter an amount greater than zero.');
  }
  return value;
}

export const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-PK');

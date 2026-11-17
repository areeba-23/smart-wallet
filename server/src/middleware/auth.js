import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/* Reads "Authorization: Bearer <token>", loads the user and puts it on req.user. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in first.');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Your account no longer exists.');
  req.user = user;
  next();
});

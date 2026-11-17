import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../utils/HttpError.js';
import { publicUser } from '../utils/serialize.js';

// POST /api/auth/register
export async function register(req, res) {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!name) throw new HttpError(400, 'Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (password.length < 6) throw new HttpError(400, 'Use a password with at least 6 characters.');
  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

// POST /api/auth/login
export async function login(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  const ok = user && (await bcrypt.compare(req.body.password || '', user.passwordHash));
  if (!ok) throw new HttpError(401, 'Email or password is incorrect.');
  res.json({ token: signToken(user), user: publicUser(user) });
}

// GET /api/auth/me
export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

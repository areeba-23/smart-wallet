import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and set it.');
  process.exit(1);
}

const port = process.env.PORT || 5000;

connectDb(process.env.MONGO_URI)
  .then(() => {
    createApp().listen(port, () => console.log(`Smart Wallet API running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Could not start the server:', err.message);
    process.exit(1);
  });

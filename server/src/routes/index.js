import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import * as auth from '../controllers/authController.js';
import * as wallet from '../controllers/walletController.js';
import * as bucket from '../controllers/bucketController.js';
import * as tx from '../controllers/transactionController.js';
import * as shared from '../controllers/sharedController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// auth (public)
router.post('/auth/register', h(auth.register));
router.post('/auth/login', h(auth.login));

// everything below needs a valid token
router.use(requireAuth);
router.get('/auth/me', h(auth.me));
router.get('/wallet', h(wallet.getWallet));

router.post('/buckets', h(bucket.createBucket));
router.patch('/buckets/:id', h(bucket.updateBucket));
router.delete('/buckets/:id', h(bucket.deleteBucket));

router.post('/transactions/income', h(tx.addIncome));
router.post('/transactions/expense', h(tx.addExpense));
router.post('/transactions/transfer', h(tx.transfer));
router.put('/rules', h(tx.saveRules));
router.post('/loans/:id/return', h(tx.returnLoan));

router.post('/shared-buckets', h(shared.createSharedBucket));
router.post('/shared-buckets/:id/contribute', h(shared.contribute));

export default router;

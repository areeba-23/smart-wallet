import mongoose from 'mongoose';
import User from '../models/User.js';
import Bucket from '../models/Bucket.js';
import { HttpError } from '../utils/HttpError.js';
import { rs } from '../utils/money.js';

/*
 * An "account" is either the user's unallocated pool ('wallet') or one of their
 * personal buckets. debit() is atomic: the balance check and the subtraction
 * happen in one database operation, so two requests can never overspend.
 */
export async function getAccount(userId, id) {
  if (id === 'wallet') {
    return {
      id: 'wallet',
      name: 'Unallocated',
      async balance() {
        return (await User.findById(userId).select('unallocated')).unallocated;
      },
      async debit(n) {
        const ok = await User.findOneAndUpdate(
          { _id: userId, unallocated: { $gte: n } },
          { $inc: { unallocated: -n } }
        );
        if (!ok) throw new HttpError(400, `Not enough in Unallocated. It has ${rs(await this.balance())}.`);
      },
      async credit(n) {
        await User.updateOne({ _id: userId }, { $inc: { unallocated: n } });
      },
    };
  }

  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'That bucket no longer exists.');
  const bucket = await Bucket.findOne({ _id: id, ownerId: userId, shared: false });
  if (!bucket) throw new HttpError(404, 'That bucket no longer exists.');
  return {
    id: String(bucket._id),
    name: bucket.name,
    async balance() {
      return (await Bucket.findById(bucket._id).select('balance')).balance;
    },
    async debit(n) {
      const ok = await Bucket.findOneAndUpdate(
        { _id: bucket._id, balance: { $gte: n } },
        { $inc: { balance: -n } }
      );
      if (!ok) throw new HttpError(400, `Not enough in ${bucket.name}. It has ${rs(await this.balance())}.`);
    },
    async credit(n) {
      await Bucket.updateOne({ _id: bucket._id }, { $inc: { balance: n } });
    },
  };
}

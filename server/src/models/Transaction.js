import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer', 'borrow', 'return', 'contribution'],
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    visibleTo: { type: [mongoose.Schema.Types.ObjectId], index: true },
    amount: { type: Number, required: true },
    note: { type: String, default: '' },
    // expense and contribution
    bucketId: String,
    bucketName: String,
    category: String,
    // transfer, borrow, return
    fromName: String,
    toName: String,
    loanId: String,
    // income
    splits: [{ _id: false, bucketId: String, bucketName: String, amount: Number }],
    remainder: Number,
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);

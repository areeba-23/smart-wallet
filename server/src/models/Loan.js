import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromId: { type: String, required: true },
    toId: { type: String, required: true },
    fromName: String,
    toName: String,
    amount: { type: Number, required: true },
    status: { type: String, enum: ['open', 'returned', 'cancelled'], default: 'open' },
    returnedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Loan', loanSchema);

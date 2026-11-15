import mongoose from 'mongoose';

const bucketSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], index: true },
    shared: { type: Boolean, default: false },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#0E7C7B' },
    balance: { type: Number, default: 0 },
    target: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Bucket', bucketSchema);

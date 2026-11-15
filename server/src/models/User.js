import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    bucketId: { type: mongoose.Schema.Types.ObjectId, required: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    unallocated: { type: Number, default: 0 },
    rules: { type: [ruleSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

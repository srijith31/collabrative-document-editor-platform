import mongoose from 'mongoose';

const recentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  lastOpened: {
    type: Date,
    default: Date.now,
    required: true,
  }
}, {
  timestamps: true,
});

// Compound unique index to update lastOpened instead of duplicate entries
recentSchema.index({ userId: 1, documentId: 1 }, { unique: true });

const Recent = mongoose.model('Recent', recentSchema);
export default Recent;

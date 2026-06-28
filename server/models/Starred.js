import mongoose from 'mongoose';

const starredSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  }
}, {
  timestamps: true,
});

// Compound unique index to prevent duplicate stars
starredSchema.index({ userId: 1, documentId: 1 }, { unique: true });

const Starred = mongoose.model('Starred', starredSchema);
export default Starred;

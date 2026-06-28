import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  name: {
    type: String,
    trim: true,
    default: () => `Version ${new Date().toLocaleString()}`,
  },
  content: {
    type: Object,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

const Version = mongoose.model('Version', versionSchema);
export default Version;

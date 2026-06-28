import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actionType: {
    type: String,
    enum: ['CREATE', 'EDIT', 'COMMENT', 'SUGGESTION', 'SHARE', 'VERSION_RESTORE'],
    required: true,
  },
  details: {
    type: String,
  }
}, {
  timestamps: true,
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;

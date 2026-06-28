import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['INVITE', 'COMMENT', 'SUGGESTION', 'SHARE'],
    required: true,
  },
  token: {
    type: String,
    required: false,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

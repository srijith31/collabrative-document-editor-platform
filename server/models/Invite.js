import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['EDITOR', 'COMMENTER', 'VIEWER'],
    default: 'VIEWER',
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
    default: 'PENDING',
  },
  expiresAt: {
    type: Date,
    required: true,
  }
}, {
  timestamps: true,
});

const Invite = mongoose.model('Invite', inviteSchema);
export default Invite;

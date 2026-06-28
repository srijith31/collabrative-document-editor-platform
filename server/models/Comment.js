import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  }
}, {
  timestamps: true,
});

const commentSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  range: {
    index: { type: Number },
    length: { type: Number }
  },
  section: {
    type: String,
  },
  sectionId: {
    type: String,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  replies: [replySchema]
}, {
  timestamps: true,
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;

import mongoose from 'mongoose';

const collaboratorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'],
    default: 'VIEWER',
  }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Document',
    trim: true,
  },
  content: {
    type: Object,
    default: { ops: [] }, // Quill Delta format
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collaborators: [collaboratorSchema],
  isPublic: {
    type: Boolean,
    default: false,
  },
  publicRole: {
    type: String,
    enum: ['EDITOR', 'COMMENTER', 'VIEWER'],
    default: 'VIEWER',
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['DOCUMENT', 'RESUME', 'PROPOSAL', 'COLLEGE_REPORT'],
    default: 'DOCUMENT',
  },
  resumeData: {
    type: Object,
  },
  proposalData: {
    type: Object,
  },
  collegeReportData: {
    type: Object,
  }
}, {
  timestamps: true,
});

const Document = mongoose.model('Document', documentSchema);
export default Document;

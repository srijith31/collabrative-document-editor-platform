import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  fieldName: {
    type: String,
  },
  originalText: {
    type: String,
    required: true,
  },
  suggestedText: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
});

const Suggestion = mongoose.model('Suggestion', suggestionSchema);
export default Suggestion;

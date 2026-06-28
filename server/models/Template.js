import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  coverPage: {
    title: { type: String, default: '' },
    department: { type: String, default: '' },
    college: { type: String, default: '' },
    students: { type: [String], default: [] },
    guide: { type: String, default: '' },
    year: { type: String, default: '' }
  },
  sections: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      content: { type: String, default: '' },
      pageNumber: { type: Number, default: 1 }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const Template = mongoose.model('Template', templateSchema);
export default Template;

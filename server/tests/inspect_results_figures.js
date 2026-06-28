import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Document from '../models/Document.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const doc = await Document.findById('6a36b70c4492f28c234a932a');
    if (!doc) {
      console.log('Document not found.');
    } else {
      console.log('Document Title:', doc.title);
      const resultsSection = doc.collegeReportData?.sectionsList?.find(s => s.id === 'resultsAndDiscussion');
      if (resultsSection) {
        console.log('Results Section Figures:', JSON.stringify(resultsSection.figures, null, 2));
      } else {
        console.log('Results and discussion section not found.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();

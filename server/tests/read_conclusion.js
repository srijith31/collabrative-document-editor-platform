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
      const conclusion = doc.collegeReportData?.sectionsList?.find(s => s.id === 'conclusion');
      if (conclusion) {
        console.log('Conclusion Section keys:', Object.keys(conclusion));
        const text = conclusion.content || '';
        console.log('Conclusion text length:', text.length);
        console.log('Conclusion text newlines count:', (text.match(/\n/g) || []).length);
        console.log('First 500 characters:\n', text.substring(0, 500));
        console.log('Last 500 characters:\n', text.substring(text.length - 500));
      } else {
        console.log('Conclusion section not found.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();

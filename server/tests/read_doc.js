import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Document from '../models/Document.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const doc = await Document.findOne({ type: 'COLLEGE_REPORT' }).sort({ updatedAt: -1 });
    if (!doc) {
      console.log('No college report document found.');
    } else {
      console.log('Document ID:', doc._id);
      console.log('Document Title:', doc.title);
      console.log('Document Type:', doc.type);
      console.log('collegeReportData keys:', Object.keys(doc.collegeReportData || {}));
      console.log('Submitted By:', doc.collegeReportData?.submittedBy);
      console.log('sectionsList length:', doc.collegeReportData?.sectionsList?.length);
      console.log('First Section:', doc.collegeReportData?.sectionsList?.[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();

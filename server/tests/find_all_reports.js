import mongoose from 'mongoose';
import Document from '../models/Document.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    await mongoose.connect(uri);
    const docs = await Document.find({ type: 'COLLEGE_REPORT' });
    console.log(`Found ${docs.length} college report documents:`);
    for (const doc of docs) {
      console.log(`- ID: ${doc._id}, Title: ${doc.title}`);
      const sec = doc.collegeReportData?.sectionsList?.find(s => s.id === 'resultsAndDiscussion');
      if (sec) {
        console.log('  Figures:', JSON.stringify(sec.figures, null, 2));
      }
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

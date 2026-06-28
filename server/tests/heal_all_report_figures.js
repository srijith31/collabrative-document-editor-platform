import mongoose from 'mongoose';
import Document from '../models/Document.js';
import dotenv from 'dotenv';

dotenv.config();

const isUrl = (str) => {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:');
};

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    await mongoose.connect(uri);
    console.log('MongoDB Connected.');

    const docs = await Document.find({ type: 'COLLEGE_REPORT' });
    console.log(`Found ${docs.length} college report documents. Starting heal...`);

    let healedCount = 0;

    for (const doc of docs) {
      if (!doc.collegeReportData) continue;
      let docModified = false;
      const reportData = doc.collegeReportData;

      // 1. Check sectionsList
      if (Array.isArray(reportData.sectionsList)) {
        for (const sec of reportData.sectionsList) {
          // Check common section image
          if (isUrl(sec.imageCaption) && !isUrl(sec.imageUrl)) {
            console.log(`[Heal] Document ID: ${doc._id}, Section: ${sec.id} - Swapping imageCaption and imageUrl`);
            const temp = sec.imageUrl;
            sec.imageUrl = sec.imageCaption;
            sec.imageCaption = temp;
            docModified = true;
          }

          // Check figures array in resultsAndDiscussion
          if (sec.id === 'resultsAndDiscussion' && Array.isArray(sec.figures)) {
            for (let i = 0; i < sec.figures.length; i++) {
              const fig = sec.figures[i];
              if (isUrl(fig.caption) && !isUrl(fig.imageUrl)) {
                console.log(`[Heal] Document ID: ${doc._id}, Figure ${i + 1} - Swapping caption and imageUrl`);
                const temp = fig.imageUrl;
                fig.imageUrl = fig.caption;
                fig.caption = temp;
                docModified = true;
              }
            }
          }
        }
      }

      // 2. Check abstract image
      if (isUrl(reportData.abstractImageCaption) && !isUrl(reportData.abstractImageUrl)) {
        console.log(`[Heal] Document ID: ${doc._id}, Abstract Image - Swapping abstractImageCaption and abstractImageUrl`);
        const temp = reportData.abstractImageUrl;
        reportData.abstractImageUrl = reportData.abstractImageCaption;
        reportData.abstractImageCaption = temp;
        docModified = true;
      }

      if (docModified) {
        doc.markModified('collegeReportData');
        await doc.save();
        console.log(`[Heal] Saved document ${doc._id}`);
        healedCount++;
      }
    }

    console.log(`Heal complete. Healed ${healedCount} documents.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during heal:', err);
  }
};

run();

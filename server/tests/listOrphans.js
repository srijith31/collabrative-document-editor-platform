import mongoose from 'mongoose';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Comment from '../models/Comment.js';
import Suggestion from '../models/Suggestion.js';
import Activity from '../models/Activity.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    await mongoose.connect(uri);
    
    console.log('--- Comments ---');
    const comments = await Comment.find({});
    for (const c of comments) {
      const doc = await Document.findById(c.documentId);
      const user = await User.findById(c.createdBy);
      console.log(`Comment ID: ${c._id}, Text: "${c.text}", DocumentExists: ${!!doc}, UserExists: ${!!user}`);
    }

    console.log('\n--- Suggestions ---');
    const suggestions = await Suggestion.find({});
    for (const s of suggestions) {
      const doc = await Document.findById(s.documentId);
      const user = await User.findById(s.createdBy);
      console.log(`Suggestion ID: ${s._id}, OriginalText: "${s.originalText}", DocumentExists: ${!!doc}, UserExists: ${!!user}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

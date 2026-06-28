import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor');
    console.log('MongoDB Connected.');

    const doc = await Document.findById('6a33ec01a64221b58f88bc45');
    if (!doc) {
      console.log('No document found with ID 6a33ec01a64221b58f88bc45');
    } else {
      console.log('Document Owner ID:', doc.owner);
      const owner = await User.findById(doc.owner);
      console.log('Owner username:', owner?.username);
      console.log('Owner email:', owner?.email);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();

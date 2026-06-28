import mongoose from 'mongoose';
import User from '../models/User.js';
import Document from '../models/Document.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    await mongoose.connect(uri);
    const docs = await Document.find({}).populate('owner', 'username');
    console.log('--- Current Documents in Database ---');
    console.log(JSON.stringify(docs, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

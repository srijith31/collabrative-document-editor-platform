import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    console.log(`Connecting to: ${uri}`);
    await mongoose.connect(uri);
    const users = await User.find({}).select('+password');
    console.log('--- Current Users in Database ---');
    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

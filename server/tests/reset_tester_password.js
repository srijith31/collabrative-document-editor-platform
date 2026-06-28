import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor');
    console.log('MongoDB Connected.');

    const user = await User.findOne({ email: 'tester515014@example.com' });
    if (!user) {
      console.log('No user found with email tester515014@example.com');
    } else {
      user.password = 'password123';
      await user.save();
      console.log('Password reset successfully to "password123" for user:', user.email);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();

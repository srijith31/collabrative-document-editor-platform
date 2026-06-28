import mongoose from 'mongoose';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Comment from '../models/Comment.js';
import Suggestion from '../models/Suggestion.js';
import Activity from '../models/Activity.js';
import Version from '../models/Version.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    console.log(`Connecting to: ${uri}`);
    await mongoose.connect(uri);
    
    console.log('Users count:', await User.countDocuments());
    console.log('Documents count:', await Document.countDocuments());
    console.log('Comments count:', await Comment.countDocuments());
    console.log('Suggestions count:', await Suggestion.countDocuments());
    console.log('Activities count:', await Activity.countDocuments());
    console.log('Versions count:', await Version.countDocuments());
    
    console.log('\n--- Documents ---');
    const docs = await Document.find({});
    console.log(JSON.stringify(docs, null, 2));

    console.log('\n--- Activities ---');
    const activities = await Activity.find({}).populate('user', 'username').populate('documentId', 'title');
    console.log(JSON.stringify(activities, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

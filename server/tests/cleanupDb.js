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
    
    // Find all valid document and user IDs
    const docs = await Document.find({}).select('_id');
    const docIds = docs.map(d => d._id.toString());

    const users = await User.find({}).select('_id');
    const userIds = users.map(u => u._id.toString());

    console.log('Valid Documents count:', docIds.length);
    console.log('Valid Users count:', userIds.length);

    // 1. Comments cleanup
    const comments = await Comment.find({});
    let commentsDeleted = 0;
    for (const c of comments) {
      if (!c.documentId || !docIds.includes(c.documentId.toString())) {
        await Comment.deleteOne({ _id: c._id });
        commentsDeleted++;
      }
    }
    console.log(`Deleted ${commentsDeleted} orphaned comments.`);

    // 2. Suggestions cleanup
    const suggestions = await Suggestion.find({});
    let suggestionsDeleted = 0;
    for (const s of suggestions) {
      if (!s.documentId || !docIds.includes(s.documentId.toString())) {
        await Suggestion.deleteOne({ _id: s._id });
        suggestionsDeleted++;
      }
    }
    console.log(`Deleted ${suggestionsDeleted} orphaned suggestions.`);

    // 3. Activities cleanup
    const activities = await Activity.find({});
    let activitiesDeleted = 0;
    for (const a of activities) {
      const docInvalid = !a.documentId || !docIds.includes(a.documentId.toString());
      const userInvalid = !a.user || !userIds.includes(a.user.toString());
      if (docInvalid || userInvalid) {
        await Activity.deleteOne({ _id: a._id });
        activitiesDeleted++;
      }
    }
    console.log(`Deleted ${activitiesDeleted} orphaned activities.`);

    await mongoose.disconnect();
    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

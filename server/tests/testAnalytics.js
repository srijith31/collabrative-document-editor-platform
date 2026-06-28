import mongoose from 'mongoose';
import { getDocumentsCreatedPerMonth, getDashboardStats, getUserProductivity } from '../services/analyticsService.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    await mongoose.connect(uri);
    
    const stats = await getDashboardStats();
    console.log('Stats:', stats);
    
    const monthly = await getDocumentsCreatedPerMonth();
    console.log('Monthly:', monthly);
    
    const productivity = await getUserProductivity();
    console.log('Productivity:', productivity);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

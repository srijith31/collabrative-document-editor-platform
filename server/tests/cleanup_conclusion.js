import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Document from '../models/Document.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const doc = await Document.findById('6a36b70c4492f28c234a932a');
    if (!doc) {
      console.log('Document not found.');
    } else {
      console.log('Document Title:', doc.title);
      
      const sections = doc.collegeReportData?.sectionsList || [];
      const conclIdx = sections.findIndex(s => s.id === 'conclusion');
      
      if (conclIdx !== -1) {
        const cleanText = 'This project successfully demonstrates the deployment and management of containerized applications using modern DevOps technologies. By utilizing Docker for containerization and Kubernetes for orchestration, the system ensures consistent application performance across different environments. The implementation highlights key features such as automated deployment, load balancing, auto-scaling, and self-healing, which significantly improve system reliability, scalability, and availability. It also reduces manual effort in managing applications and optimizes resource utilization. Overall, the project provides a practical and industry-relevant solution for efficient application deployment, aligning with current trends in cloud computing and DevOps practices.';
        
        sections[conclIdx].content = cleanText;
        doc.collegeReportData.sectionsList = sections;
        doc.markModified('collegeReportData');
        
        await doc.save();
        console.log('Conclusion cleaned up successfully!');
        console.log('New Conclusion text:', doc.collegeReportData.sectionsList[conclIdx].content);
      } else {
        console.log('Conclusion section not found inside sectionsList.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();

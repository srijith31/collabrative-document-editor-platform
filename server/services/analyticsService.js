import Document from '../models/Document.js';
import Comment from '../models/Comment.js';
import Suggestion from '../models/Suggestion.js';
import Activity from '../models/Activity.js';
import Version from '../models/Version.js';
import { activePresence } from '../sockets/socketService.js';

export const getDashboardStats = async (userId) => {
  const docs = await Document.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
    ],
  }).select('_id');
  const docIds = docs.map((d) => d._id);

  const totalDocuments = docIds.length;
  const totalComments = await Comment.countDocuments({ documentId: { $in: docIds } });
  const totalSuggestions = await Suggestion.countDocuments({ documentId: { $in: docIds } });

  // Calculate unique active presence users across user's document rooms
  const uniqueUsers = new Set();
  activePresence.forEach((docPresence, docIdStr) => {
    if (docIds.some(id => id.toString() === docIdStr)) {
      if (docPresence instanceof Map) {
        docPresence.forEach((session) => {
          if (session.userId) {
            uniqueUsers.add(session.userId.toString());
          }
        });
      }
    }
  });

  const activeUsers = uniqueUsers.size;

  return {
    totalDocuments,
    totalComments,
    totalSuggestions,
    activeUsers,
  };
};

export const getRecentActivity = async (userId) => {
  // Fetch only activities for documents accessible by the user
  const docs = await Document.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
    ],
  }).select('_id');

  const docIds = docs.map((d) => d._id);

  return await Activity.find({ documentId: { $in: docIds } })
    .populate('user', 'username email avatarColor')
    .populate('documentId', 'title')
    .sort({ createdAt: -1 })
    .limit(20);
};

export const getDocumentsCreatedPerMonth = async (userId) => {
  const docs = await Document.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
    ],
  }).select('_id');
  const docIds = docs.map((d) => d._id);

  const monthlyStats = await Document.aggregate([
    {
      $match: {
        _id: { $in: docIds }
      }
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames.map((name, index) => {
    const match = monthlyStats.find((item) => item._id && item._id.month === index + 1);
    return {
      name,
      count: match ? match.count : 0,
    };
  });
};

export const getDocumentStats = async (userId) => {
  const docs = await Document.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
    ],
  });

  return await Promise.all(
    docs.map(async (doc) => {
      const commentsCount = await Comment.countDocuments({ documentId: doc._id });
      const suggestionsCount = await Suggestion.countDocuments({ documentId: doc._id });
      const versionsCount = await Version.countDocuments({ documentId: doc._id });
      return {
        _id: doc._id,
        title: doc.title,
        editors: doc.collaborators.length + 1, // Include owner
        comments: commentsCount,
        suggestions: suggestionsCount,
        versions: versionsCount,
      };
    })
  );
};

export const getUserProductivity = async (userId) => {
  const docs = await Document.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
    ],
  }).select('_id');
  const docIds = docs.map((d) => d._id);

  return await Activity.aggregate([
    { 
      $match: { 
        actionType: 'EDIT',
        documentId: { $in: docIds }
      } 
    },
    { $group: { _id: '$user', edits: { $sum: 1 } } },
    { $sort: { edits: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userData',
      },
    },
    { $unwind: '$userData' },
    {
      $project: {
        _id: 1,
        edits: 1,
        user: {
          _id: '$userData._id',
          username: '$userData.username',
          email: '$userData.email',
          avatarColor: '$userData.avatarColor',
        },
      },
    },
  ]);
};

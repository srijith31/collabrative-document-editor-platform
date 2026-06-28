import Activity from '../models/Activity.js';

export const getActivityLog = async (req, res) => {
  try {
    const activities = await Activity.find({ documentId: req.document._id })
      .populate('user', 'username email avatarColor')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

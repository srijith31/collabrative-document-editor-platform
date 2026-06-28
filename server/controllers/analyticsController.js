import * as analyticsService from '../services/analyticsService.js';

export const getStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentActivityLog = async (req, res) => {
  try {
    const activities = await analyticsService.getRecentActivity(req.user._id);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyCreationStats = async (req, res) => {
  try {
    const data = await analyticsService.getDocumentsCreatedPerMonth(req.user._id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDocumentCollaborationStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDocumentStats(req.user._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProductivityStats = async (req, res) => {
  try {
    const productivity = await analyticsService.getUserProductivity(req.user._id);
    res.json(productivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Suggestion from '../models/Suggestion.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

export const getSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ documentId: req.document._id })
      .populate('createdBy', 'username email avatarColor')
      .populate('resolvedBy', 'username email avatarColor')
      .sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSuggestion = async (req, res) => {
  try {
    const { range, originalText, suggestedText, section, sectionId, fieldName } = req.body;
    if (!originalText || !suggestedText) {
      return res.status(400).json({ message: 'originalText and suggestedText are required' });
    }
    if (!section && (!range || range.index === undefined || range.length === undefined)) {
      return res.status(400).json({ message: 'Either range (index, length) or section details are required' });
    }

    const suggestion = await Suggestion.create({
      documentId: req.document._id,
      createdBy: req.user._id,
      range: range || undefined,
      originalText,
      suggestedText,
      section: section || undefined,
      sectionId: sectionId || undefined,
      fieldName: fieldName || undefined,
    });

    await Activity.create({
      documentId: req.document._id,
      user: req.user._id,
      actionType: 'SUGGESTION',
      details: 'Created a suggestion',
    });

    if (req.document.owner.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: req.document.owner,
        sender: req.user._id,
        type: 'SUGGESTION',
        documentId: req.document._id,
        message: `${req.user.username} suggested an edit on "${req.document.title}"`,
      });
    }

    await suggestion.populate('createdBy', 'username email avatarColor');
    res.status(201).json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { documentContent } = req.body;
    const suggestion = await Suggestion.findById(suggestionId);

    if (!suggestion || suggestion.documentId.toString() !== req.document._id.toString()) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    suggestion.status = 'ACCEPTED';
    suggestion.resolvedBy = req.user._id;
    await suggestion.save();

    if (req.document.type === 'RESUME' && suggestion.section) {
      const { section, sectionId, fieldName } = suggestion;
      if (section === 'summary') {
        req.document.resumeData = {
          ...req.document.resumeData,
          summary: suggestion.suggestedText
        };
      } else if (section === 'personalInfo') {
        req.document.resumeData = {
          ...req.document.resumeData,
          personalInfo: {
            ...req.document.resumeData.personalInfo,
            [fieldName]: suggestion.suggestedText
          }
        };
      } else {
        const list = req.document.resumeData[section] || [];
        const updatedList = list.map(item => {
          if (item.id === sectionId || item._id?.toString() === sectionId) {
            if (section === 'achievements') {
              return { ...item, text: suggestion.suggestedText };
            }
            return { ...item, [fieldName]: suggestion.suggestedText };
          }
          return item;
        });
        req.document.resumeData = {
          ...req.document.resumeData,
          [section]: updatedList
        };
      }
      req.document.markModified('resumeData');
      await req.document.save();
    } else if (documentContent) {
      req.document.content = documentContent;
      await req.document.save();
    }

    await Activity.create({
      documentId: req.document._id,
      user: req.user._id,
      actionType: 'SUGGESTION',
      details: 'Accepted suggestion',
    });

    if (suggestion.createdBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: suggestion.createdBy,
        sender: req.user._id,
        type: 'SUGGESTION',
        documentId: req.document._id,
        message: `Your suggestion on "${req.document.title}" was accepted`,
      });
    }

    await suggestion.populate([
      { path: 'createdBy', select: 'username email avatarColor' },
      { path: 'resolvedBy', select: 'username email avatarColor' }
    ]);

    res.json({ suggestion, document: req.document });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const suggestion = await Suggestion.findById(suggestionId);

    if (!suggestion || suggestion.documentId.toString() !== req.document._id.toString()) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    suggestion.status = 'REJECTED';
    suggestion.resolvedBy = req.user._id;
    await suggestion.save();

    await Activity.create({
      documentId: req.document._id,
      user: req.user._id,
      actionType: 'SUGGESTION',
      details: 'Rejected suggestion',
    });

    if (suggestion.createdBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: suggestion.createdBy,
        sender: req.user._id,
        type: 'SUGGESTION',
        documentId: req.document._id,
        message: `Your suggestion on "${req.document.title}" was rejected`,
      });
    }

    await suggestion.populate([
      { path: 'createdBy', select: 'username email avatarColor' },
      { path: 'resolvedBy', select: 'username email avatarColor' }
    ]);

    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

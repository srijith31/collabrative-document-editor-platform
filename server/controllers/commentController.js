import Comment from '../models/Comment.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ documentId: req.document._id })
      .populate('author', 'username email avatarColor')
      .populate('replies.author', 'username email avatarColor')
      .populate('resolvedBy', 'username email avatarColor');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const { text, range, section, sectionId } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    if (!section && (!range || range.index === undefined || range.length === undefined)) {
      return res.status(400).json({ message: 'Either range (index, length) or section details are required' });
    }

    const comment = await Comment.create({
      documentId: req.document._id,
      author: req.user._id,
      text,
      range: range || undefined,
      section: section || undefined,
      sectionId: sectionId || undefined,
    });

    await Activity.create({
      documentId: req.document._id,
      user: req.user._id,
      actionType: 'COMMENT',
      details: 'Added a comment',
    });

    if (req.document.owner.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: req.document.owner,
        sender: req.user._id,
        type: 'COMMENT',
        documentId: req.document._id,
        message: `${ req.user.username } commented on your document "${req.document.title}"`,
      });
    }

    await comment.populate('author', 'username email avatarColor');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replyComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { commentId } = req.params;

    if (!text) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.documentId.toString() !== req.document._id.toString()) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({
      author: req.user._id,
      text,
    });

    await comment.save();

    if (comment.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: comment.author,
        sender: req.user._id,
        type: 'COMMENT',
        documentId: req.document._id,
        message: `${ req.user.username } replied to your comment on "${req.document.title}"`,
      });
    }

    await comment.populate([
      { path: 'author', select: 'username email avatarColor' },
      { path: 'replies.author', select: 'username email avatarColor' }
    ]);

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment || comment.documentId.toString() !== req.document._id.toString()) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isOwnerOrEditor = ['OWNER', 'EDITOR'].includes(req.userRole);
    const isAuthor = comment.author.toString() === req.user._id.toString();

    if (!isOwnerOrEditor && !isAuthor) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to resolve this comment' });
    }

    comment.resolved = true;
    comment.resolvedBy = req.user._id;
    await comment.save();

    await comment.populate([
      { path: 'author', select: 'username email avatarColor' },
      { path: 'replies.author', select: 'username email avatarColor' },
      { path: 'resolvedBy', select: 'username email avatarColor' }
    ]);

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

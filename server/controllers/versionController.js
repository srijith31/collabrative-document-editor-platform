import Version from '../models/Version.js';
import Document from '../models/Document.js';
import Activity from '../models/Activity.js';

export const getVersions = async (req, res) => {
  try {
    const versions = await Version.find({ documentId: req.document._id })
      .populate('createdBy', 'username email avatarColor')
      .sort({ createdAt: -1 });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVersion = async (req, res) => {
  try {
    const { name } = req.body;
    const version = await Version.create({
      documentId: req.document._id,
      name: name || undefined,
      content: req.document.type === 'RESUME' ? req.document.resumeData : req.document.content,
      createdBy: req.user._id,
    });

    await Activity.create({
      documentId: req.document._id,
      user: req.user._id,
      actionType: 'VERSION_RESTORE',
      details: `Created version snapshot: ${version.name}`,
    });

    await version.populate('createdBy', 'username email avatarColor');
    res.status(201).json(version);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = await Version.findById(versionId);

    if (!version || version.documentId.toString() !== req.document._id.toString()) {
      return res.status(404).json({ message: 'Version snapshot not found' });
    }

    // Create a backup snapshot of current content first
    await Version.create({
      documentId: req.document._id,
      name: `Pre-restore Backup (${new Date().toLocaleString()})`,
      content: req.document.type === 'RESUME' ? req.document.resumeData : req.document.content,
      createdBy: req.user._id,
    });

    if (req.document.type === 'RESUME') {
      req.document.resumeData = version.content;
      req.document.markModified('resumeData');
    } else {
      req.document.content = version.content;
    }
    await req.document.save();

    await Activity.create({
      documentId: req.document._id,
      user: req.user._id,
      actionType: 'VERSION_RESTORE',
      details: `Restored document to version: ${version.name}`,
    });

    res.json({ message: 'Document restored successfully', content: version.content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

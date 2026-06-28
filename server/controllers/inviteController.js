import crypto from 'crypto';
import Invite from '../models/Invite.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

export const createInvite = async (req, res) => {
  try {
    const { email, role, documentId } = req.body;

    if (!email || !role || !documentId) {
      return res.status(400).json({ message: 'Email, role and documentId are required' });
    }

    if (!['EDITOR', 'COMMENTER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the document owner can invite users' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const invite = await Invite.create({
      documentId,
      email: email.toLowerCase(),
      role,
      invitedBy: req.user._id,
      token,
      expiresAt,
    });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await Notification.create({
        recipient: existingUser._id,
        sender: req.user._id,
        type: 'INVITE',
        documentId,
        token,
        message: `${req.user.username} invited you to collaborate on "${doc.title}" as ${role}`,
      });
    }

    res.status(201).json({
      message: 'Invite token generated successfully',
      inviteLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/accept/${token}`,
      invite
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invite.findOne({ token });

    if (!invite) {
      return res.status(404).json({ message: 'Invalid token' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ message: `Invite has already been ${invite.status.toLowerCase()}` });
    }

    if (new Date() > invite.expiresAt) {
      invite.status = 'DECLINED';
      await invite.save();
      return res.status(400).json({ message: 'Invite has expired' });
    }

    if (req.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invite was not sent to your logged-in email address' });
    }

    const doc = await Document.findById(invite.documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document associated with invite was not found' });
    }

    const existingCollab = doc.collaborators.find(
      (c) => c.user.toString() === req.user._id.toString()
    );

    if (existingCollab) {
      existingCollab.role = invite.role;
    } else {
      doc.collaborators.push({
        user: req.user._id,
        role: invite.role,
      });
    }

    await doc.save();

    invite.status = 'ACCEPTED';
    await invite.save();

    // Delete the invitation notification from recipient's notifications list
    await Notification.deleteMany({ token, recipient: req.user._id });

    await Activity.create({
      documentId: doc._id,
      user: req.user._id,
      actionType: 'SHARE',
      details: `Accepted invite to collaborate as ${invite.role}`,
    });

    res.json({ message: 'Successfully joined document collaboration', documentId: doc._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

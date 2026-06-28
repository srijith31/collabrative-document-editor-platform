import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Invite from '../models/Invite.js';
import crypto from 'crypto';

dotenv.config();

// We need to fetch and run detectMentions. Since detectMentions is not exported from documentController, we can either:
// 1. Fetch it by simulating updateDocument controller via supertest or mock request, OR
// 2. Export detectMentions from documentController.js and call it directly.
// Let's check if we can export detectMentions from documentController.js to test it cleanly.
// Wait! Let's export it from documentController.js. First, let's write this test script assuming it's exported or we simulate it.
// Actually, let's export detectMentions from documentController.js to make it unit testable!
// Let's check if detectMentions is exported. Currently it is "const detectMentions = ...". We can change it to "export const detectMentions = ...".
// Let's import it:
import { detectMentions } from '../controllers/documentController.js';

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_doc_editor';
    console.log(`Connecting to: ${uri}`);
    await mongoose.connect(uri);

    // 1. Find users
    const owner = await User.findOne({ username: 'srijith' });
    const targetUser = await User.findOne({ username: 'testuser' });

    if (!owner || !targetUser) {
      throw new Error('Test users "srijith" and/or "testuser" not found in the database. Run seed script or check DB.');
    }

    console.log(`Owner: ${owner.username} (${owner._id}), Target User: ${targetUser.username} (${targetUser._id})`);

    // Clean up any old test items
    await Document.deleteMany({ title: { $in: ['Test Product Meeting Notes', 'Test Shopping List'] } });
    await Notification.deleteMany({ recipient: targetUser._id, message: /Test/ });
    await Invite.deleteMany({ email: targetUser.email });

    // 2. Test Meeting Notes document (direct collaboration)
    console.log('\n--- Test Case 1: Document titled "Test Product Meeting Notes" ---');
    const meetingDoc = await Document.create({
      title: 'Test Product Meeting Notes',
      content: { ops: [{ insert: `Hi @testuser, please check this.\n` }] },
      owner: owner._id,
      collaborators: []
    });

    console.log('Running detectMentions on Meeting Notes doc...');
    await detectMentions(meetingDoc, owner);
    await meetingDoc.save();

    // Reload document
    const updatedMeetingDoc = await Document.findById(meetingDoc._id);
    console.log('Collaborators in DB:', updatedMeetingDoc.collaborators);
    const hasCollaborator = updatedMeetingDoc.collaborators.some(
      c => c.user.toString() === targetUser._id.toString() && c.role === 'EDITOR'
    );

    if (hasCollaborator) {
      console.log('✓ Success: testuser was automatically added as EDITOR.');
    } else {
      throw new Error('FAIL: testuser was not added to collaborators.');
    }

    // Check notification
    const shareNotif = await Notification.findOne({
      recipient: targetUser._id,
      documentId: meetingDoc._id,
      type: 'SHARE'
    });

    if (shareNotif) {
      console.log('✓ Success: SHARE notification created.');
      console.log('Notification message:', shareNotif.message);
    } else {
      throw new Error('FAIL: SHARE notification was not created.');
    }

    // 3. Test non-meeting notes document (standard invite flow)
    console.log('\n--- Test Case 2: Document titled "Test Shopping List" ---');
    const regularDoc = await Document.create({
      title: 'Test Shopping List',
      content: { ops: [{ insert: `Buy milk and tag @testuser\n` }] },
      owner: owner._id,
      collaborators: []
    });

    console.log('Running detectMentions on regular doc...');
    await detectMentions(regularDoc, owner);
    await regularDoc.save();

    // Reload document
    const updatedRegularDoc = await Document.findById(regularDoc._id);
    console.log('Collaborators in DB:', updatedRegularDoc.collaborators);
    const hasRegCollaborator = updatedRegularDoc.collaborators.some(
      c => c.user.toString() === targetUser._id.toString()
    );

    if (!hasRegCollaborator) {
      console.log('✓ Success: testuser was NOT directly collaborated.');
    } else {
      throw new Error('FAIL: testuser was directly collaborated on a regular document.');
    }

    // Check notification and invite
    const invite = await Invite.findOne({
      documentId: regularDoc._id,
      email: targetUser.email
    });

    if (invite) {
      console.log('✓ Success: Invite record created.');
    } else {
      throw new Error('FAIL: Invite record was not created.');
    }

    const inviteNotif = await Notification.findOne({
      recipient: targetUser._id,
      documentId: regularDoc._id,
      type: 'INVITE'
    });

    if (inviteNotif) {
      console.log('✓ Success: INVITE notification created.');
      console.log('Notification message:', inviteNotif.message);
    } else {
      throw new Error('FAIL: INVITE notification was not created.');
    }

    // Clean up
    await Document.deleteMany({ title: { $in: ['Test Product Meeting Notes', 'Test Shopping List'] } });
    await Notification.deleteMany({ recipient: targetUser._id, message: /Test/ });
    await Invite.deleteMany({ email: targetUser.email });
    console.log('\nAll test cases passed successfully!');

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();

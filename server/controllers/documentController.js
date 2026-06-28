import Document from '../models/Document.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Starred from '../models/Starred.js';
import Recent from '../models/Recent.js';
import crypto from 'crypto';
import Invite from '../models/Invite.js';
import Notification from '../models/Notification.js';

export const createDocument = async (req, res) => {
  try {
    const { templateId, type: reqType, title: reqTitle, resumeData: reqResumeData, proposalData: reqProposalData, collegeReportData: reqCollegeReportData } = req.body || {};
    let title = reqTitle || 'Untitled Document';
    let content = { ops: [] };
    let type = reqType || 'DOCUMENT';
    let resumeData = reqResumeData;
    let proposalData = reqProposalData;
    let collegeReportData = reqCollegeReportData;

    if (templateId) {
      const template = await Document.findOne({ _id: templateId, isTemplate: true });
      if (template) {
        title = reqTitle || template.title;
        content = template.content;
        type = template.type || 'DOCUMENT';
        resumeData = template.resumeData;
        proposalData = template.proposalData;
        collegeReportData = template.collegeReportData;
      }
    }

    const doc = await Document.create({
      title,
      content,
      type,
      resumeData: resumeData || (type === 'RESUME' ? {
        personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
        summary: '',
        education: [],
        skills: { languages: [], frontend: [], backend: [], database: [], cloud: [], tools: [] },
        experience: [],
        projects: [],
        certifications: [],
        achievements: [],
        templateType: 'Professional ATS'
      } : undefined),
      proposalData: proposalData || (type === 'PROPOSAL' ? {
        projectTitle: 'Project Proposal',
        sectionsList: [
          { id: 'outline', label: 'Outline / Agenda', content: '', imageUrl: '' },
          { id: 'introduction', label: 'Introduction', content: '', imageUrl: '' },
          { id: 'existingVsProposed', label: 'Existing System vs Proposed System', content: '', imageUrl: '' },
          { id: 'researchGaps', label: 'Research Gaps', content: '', imageUrl: '' },
          { id: 'problemStatement', label: 'Problem Statement', content: '', imageUrl: '' },
          { id: 'objectives', label: 'Proposed Project Objectives', content: '', imageUrl: '' },
          { id: 'outcomes', label: 'Proposed Project Outcomes', content: '', imageUrl: '' },
          { id: 'requirements', label: 'Technical Stack & Requirements', content: '', imageUrl: '' },
          { id: 'architecture', label: 'System Architecture Diagram', content: '', imageUrl: '' },
          { id: 'methodology', label: 'Methodology / Implementation Details', content: '', imageUrl: '' },
          { id: 'results', label: 'Results', content: '', imageUrl: '' },
          { id: 'paperAcceptance', label: 'Research Paper / Acceptance Proof', content: '', imageUrl: '' },
          { id: 'conclusion', label: 'Conclusion', content: '', imageUrl: '' },
          { id: 'references', label: 'References & Thank You', content: '', imageUrl: '' }
        ],
        notes: [
          { type: 'idea', text: 'Provide drag and drop LaTeX elements block builder.' },
          { type: 'suggestion', text: 'Add pdf.js to extract margins and sections from uploaded records.' },
          { type: 'risk', text: 'Puppeteer heavy CPU rendering under parallel export requests.' }
        ]
      } : undefined),
      collegeReportData: collegeReportData || (type === 'COLLEGE_REPORT' ? {
        collegeName: 'Vardhaman College of Engineering',
        projectTitle: 'Smart Home Automation using Internet of Things',
        courseCodeName: 'A6543 - Internet of Things Laboratory',
        submittedBy: [
          { name: 'Student Name 1', roll: '22881A0501' },
          { name: 'Student Name 2', roll: '22881A0502' },
          { name: 'Student Name 3', roll: '22881A0503' }
        ],
        courseFacilitator: 'Dr. A. K. Smith',
        courseFacilitatorDesignation: 'Assistant Professor',
        hodName: 'Dr. Department Head',
        hodDesignation: 'HOD, CSE',
        departmentName: 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING',
        academicYear: '2025--26',
        monthYear: 'May 2026',
        abstract: 'With the rapid advancement in technology, smart home automation systems have gained significant attention. This project proposes an Internet of Things (IoT) based smart home automation system that allows users to monitor and control household appliances remotely. The system uses a microcontroller connected to various sensors (temperature, humidity, motion) and actuators (relays, smart plugs). A mobile application interface is developed to display sensor data in real-time and provide remote override buttons. The proposed system is verified to improve energy efficiency, enhance home security, and provide convenient access for elderly and disabled individuals. Experimental results demonstrate a response latency of less than 200ms under standard network conditions.',
        keywords: 'Internet of Things, Smart Home, Home Automation, Sensors, Actuators, Microcontrollers, Remote Control',
        sectionsList: [
          {
            id: 'introduction',
            label: 'Introduction',
            content: 'The Internet of Things (IoT) describes the network of physical objects embedded with sensors, software, and other technologies for the purpose of connecting and exchanging data with other devices and systems over the internet. In recent years, home automation has transitioned from a luxury feature to a key utility. Traditional homes consume significant energy due to unmonitored devices and manual switching. This project introduces a smart home automation architecture designed to address these challenges by providing real-time data monitoring and automation rules. The introduction outlines the motivation, problem statement, objectives, and organizational structure of the report.'
          },
          {
            id: 'proposedMethodology',
            label: 'Proposed Methodology',
            content: 'The proposed home automation system architecture is comprised of three main layers: the hardware perception layer, the cloud communication layer, and the user application layer. In the perception layer, sensors gather environmental data (e.g., room temperature) and transmit it to the central controller. The controller processes the data and determines if relay states need to change based on predefined thresholds. The cloud communication layer uses MQTT/HTTP protocols to synchronize the device states with the online database. Finally, the user application layer enables the end-user to visualize parameters and issue direct commands.'
          },
          {
            id: 'objectives',
            label: 'Objectives',
            content: '',
            listItems: [
              'To design and build an IoT-based home automation prototype using affordable hardware.',
              'To implement real-time sensor data reading and visualization.',
              'To support remote control of household appliances through a web/mobile interface.',
              'To implement automated rules for energy saving and device protection.',
              'To analyze response latency and system reliability under varying network loads.'
            ]
          },
          {
            id: 'implementation',
            label: 'Implementation',
            content: '',
            blockDiagramItems: [
              'Sensors Layer: Captures physical parameters (temperature, humidity, motion).',
              'Microcontroller (NodeMCU/ESP32): Processes sensor inputs and triggers relays.',
              'Relay Modules: Switch high-voltage AC home appliances.',
              'Cloud Server (Firebase/MQTT Broker): Synchronizes device states and stores logs.',
              'User Interface Dashboard: Allows visualization and control.'
            ],
            workingPrinciple: 'The working principle is based on a feedback control loop. Sensors continuously read environmental state parameters. If motion is detected or temperature exceeds a threshold, the microcontroller triggers the respective relay automatically. Additionally, commands sent from the user dashboard are published to the MQTT broker, which the microcontroller subscribes to and executes immediately.',
            softwareTools: [
              'Arduino IDE: For writing microcontroller firmware.',
              'C++ / JavaScript: Implementation programming languages.',
              'Adafruit IO / Firebase: Cloud database and MQTT broker services.',
              'React / React Native: Dashboard frontend implementation.'
            ]
          },
          {
            id: 'resultsAndDiscussion',
            label: 'Results and Discussion',
            content: 'The home automation prototype was successfully constructed and verified. It demonstrated reliable automation triggers and fast response times. The mobile dashboard displayed accurate readings, matching physical conditions. The subsequent subsections discuss the parameter tuning and experimental results.',
            resultsIntro: 'The experimental setup consists of a simulated living room environment equipped with temperature and motion sensors. The system output is displayed on the IoT control dashboard, verifying successful data transmission and command reception. The sensor readings are logged periodically in a table, showing temperature variations. The dashboard also displays graph histories of energy consumption, showing a 15% reduction in overall energy usage when automation rules are enabled.',
            figures: [
              { caption: 'IoT Dashboard showing real-time sensor visualization and active relays', imageUrl: 'op1.png' },
              { caption: 'Temperature history and automated state transition graph', imageUrl: 'op2.png' }
            ],
            discussionContent: 'The system performance was evaluated based on latency and reliability. Command execution latency (the time between pressing a button on the dashboard and the relay switching) averaged 150ms. The automated rules succeeded in switching off lights when no motion was detected for 5 minutes, confirming energy conservation. Some latency spikes were observed under weak Wi-Fi signals, indicating a requirement for offline fallback mechanisms.'
          },
          {
            id: 'poMapping',
            label: 'Program Outcomes (POs) Mapping',
            poRows: [
              { poNo: 'PO1', outcome: 'Engineering Knowledge', relevance: 'The project applies principles of computer networks, electronics, and software design.' },
              { poNo: 'PO2', outcome: 'Problem Analysis', relevance: 'Energy wastage and remote control challenges are identified and analyzed.' },
              { poNo: 'PO3', outcome: 'Design/Development of Solutions', relevance: 'An IoT system solution is designed and constructed within realistic constraints.' },
              { poNo: 'PO5', outcome: 'Engineering Tool Usage', relevance: 'Modern software tools like Arduino IDE, Firebase, and React are used.' }
            ],
            sdgRows: [
              { sdgNo: 'SDG 7', goal: 'Affordable and Clean Energy', relevance: 'The project promotes energy conservation by turning off idle appliances.' },
              { sdgNo: 'SDG 9', goal: 'Industry, Innovation and Infrastructure', relevance: 'It fosters innovation in smart infrastructure and IoT systems.' }
            ]
          },
          {
            id: 'conclusion',
            label: 'Conclusion',
            content: 'This project successfully designed and implemented an IoT-based smart home automation system. By combining hardware nodes with a cloud database and responsive user interface, the system achieves reliable monitoring and control. The integration of automation rules proved effective in lowering energy consumption. Future work will involve implementing voice control integrations and machine learning algorithms to predict user preferences.'
          },
          {
            id: 'bibliography',
            label: 'Bibliography',
            content: '',
            bibItems: [
              'J. Doe, "Introduction to IoT Systems," Journal of Smart Grid, 2024.',
              'A. Smith, "Design Patterns in Home Automation," IEEE Transactions on Consumer Electronics, 2025.',
              'Firebase Documentation, "Real-time Database Reference Guide," Google Developer Center, 2026.'
            ]
          }
        ]
      } : undefined),
      owner: req.user._id,
      collaborators: [],
    });

    await Activity.create({
      documentId: doc._id,
      user: req.user._id,
      actionType: 'CREATE',
      details: templateId ? `Created ${type.toLowerCase()} from template: ${title}` : `Created ${type.toLowerCase()}`,
    });

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, sort, tab } = req.query;

    let sortOption = { updatedAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'alphabetical') {
      sortOption = { title: 1 };
    }

    let docs = [];

    if (tab === 'starred') {
      const starred = await Starred.find({ userId });
      const docIds = starred.map((s) => s.documentId);
      const query = { _id: { $in: docIds }, isTemplate: { $ne: true } };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      docs = await Document.find(query)
        .populate('owner', 'username email avatarColor')
        .populate('collaborators.user', 'username email avatarColor')
        .sort(sortOption);
    } else if (tab === 'recent') {
      const recent = await Recent.find({ userId })
        .sort({ lastOpened: -1 })
        .populate({
          path: 'documentId',
          populate: [
            { path: 'owner', select: 'username email avatarColor' },
            { path: 'collaborators.user', select: 'username email avatarColor' }
          ]
        });
      let populatedDocs = recent.filter((r) => r.documentId).map((r) => r.documentId);
      if (search) {
        const regex = new RegExp(search, 'i');
        populatedDocs = populatedDocs.filter((d) => regex.test(d.title));
      }
      docs = populatedDocs;
    } else if (tab === 'shared') {
      const query = {
        owner: { $ne: userId },
        'collaborators.user': userId,
        isTemplate: { $ne: true }
      };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      docs = await Document.find(query)
        .populate('owner', 'username email avatarColor')
        .populate('collaborators.user', 'username email avatarColor')
        .sort(sortOption);
    } else if (tab === 'templates') {
      const query = { isTemplate: true };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      docs = await Document.find(query)
        .populate('owner', 'username email avatarColor')
        .populate('collaborators.user', 'username email avatarColor')
        .sort(sortOption);
    } else if (tab === 'documents') {
      const query = {
        $or: [
          { owner: userId },
          { 'collaborators.user': userId },
        ],
        type: 'DOCUMENT',
        isTemplate: { $ne: true }
      };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      docs = await Document.find(query)
        .populate('owner', 'username email avatarColor')
        .populate('collaborators.user', 'username email avatarColor')
        .sort(sortOption);
    } else if (tab === 'reports') {
      const query = {
        $or: [
          { owner: userId },
          { 'collaborators.user': userId },
        ],
        type: 'COLLEGE_REPORT',
        isTemplate: { $ne: true }
      };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      docs = await Document.find(query)
        .populate('owner', 'username email avatarColor')
        .populate('collaborators.user', 'username email avatarColor')
        .sort(sortOption);
    } else if (tab === 'resumes') {
      const query = {
        $or: [
          { owner: userId },
          { 'collaborators.user': userId },
        ],
        type: 'RESUME',
        isTemplate: { $ne: true }
      };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      docs = await Document.find(query)
        .populate('owner', 'username email avatarColor')
        .populate('collaborators.user', 'username email avatarColor')
        .sort(sortOption);
    } else {
      // Default: All owned or shared documents (excluding templates)
      const query = {
        $or: [
          { owner: userId },
          { 'collaborators.user': userId },
        ],
        isTemplate: { $ne: true }
      };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      docs = await Document.find(query)
        .populate('owner', 'username email avatarColor')
        .populate('collaborators.user', 'username email avatarColor')
        .sort(sortOption);
    }

    // Append isStarred flag
    const userStarred = await Starred.find({ userId });
    const starredIds = new Set(userStarred.map((s) => s.documentId.toString()));

    const docsWithStarred = docs.map((doc) => {
      const docObj = doc.toObject ? doc.toObject() : doc;
      return {
        ...docObj,
        isStarred: starredIds.has(docObj._id.toString())
      };
    });

    res.json(docsWithStarred);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    await req.document.populate([
      { path: 'owner', select: 'username email avatarColor' },
      { path: 'collaborators.user', select: 'username email avatarColor' }
    ]);

    // Record this document as recently opened by the user (if it is not a template)
    if (req.document && !req.document.isTemplate) {
      await Recent.findOneAndUpdate(
        { userId: req.user._id, documentId: req.document._id },
        { lastOpened: new Date() },
        { upsert: true, new: true }
      );
    }

    res.json({
      document: req.document,
      userRole: req.userRole
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { title, content, resumeData, proposalData, collegeReportData, isPublic, publicRole } = req.body;
    const doc = req.document;

    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;
    if (resumeData !== undefined) {
      doc.resumeData = resumeData;
      doc.markModified('resumeData');
    }
    if (proposalData !== undefined) {
      doc.proposalData = proposalData;
      doc.markModified('proposalData');
    }
    if (collegeReportData !== undefined) {
      doc.collegeReportData = collegeReportData;
      doc.markModified('collegeReportData');
    }
    if (isPublic !== undefined) doc.isPublic = isPublic;
    if (publicRole !== undefined) doc.publicRole = publicRole;

    if (content !== undefined) {
      try {
        await detectMentions(doc, req.user);
      } catch (err) {
        console.error('Mention detection error:', err);
      }
    }

    await doc.save();

    await Activity.create({
      documentId: doc._id,
      user: req.user._id,
      actionType: 'EDIT',
      details: doc.type === 'RESUME' ? 'Updated resume data' : doc.type === 'COLLEGE_REPORT' ? 'Updated college report data' : 'Updated document details/content',
    });

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    if (req.userRole === 'OWNER') {
      const docId = req.document._id;
      await req.document.deleteOne();
      // Clean up all related Recent, Starred, Activity, and Invitation entries
      await Recent.deleteMany({ documentId: docId });
      await Starred.deleteMany({ documentId: docId });
      await Activity.deleteMany({ documentId: docId });
      await Invite.deleteMany({ documentId: docId });
      res.json({ message: 'Document deleted successfully' });
    } else {
      // User is a collaborator. Remove them from the collaborators list.
      const doc = req.document;
      doc.collaborators = doc.collaborators.filter(
        (c) => c.user.toString() !== userId.toString()
      );
      await doc.save();
      // Clean up Recent and Starred entries for this user for this document
      await Recent.deleteMany({ documentId: doc._id, userId });
      await Starred.deleteMany({ documentId: doc._id, userId });
      
      // Log activity
      await Activity.create({
        documentId: doc._id,
        user: userId,
        actionType: 'SHARE',
        details: `Left document: ${doc.title}`
      });

      res.json({ message: 'Removed from document successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const shareDocument = async (req, res) => {
  try {
    const { email, role, action } = req.body;
    const doc = req.document;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    if (targetUser._id.toString() === doc.owner.toString()) {
      return res.status(400).json({ message: 'Cannot modify owner permissions' });
    }

    if (action === 'remove') {
      doc.collaborators = doc.collaborators.filter(
        (c) => c.user.toString() !== targetUser._id.toString()
      );
    } else {
      if (!role || !['EDITOR', 'COMMENTER', 'VIEWER'].includes(role)) {
        return res.status(400).json({ message: 'Valid role is required (EDITOR, COMMENTER, VIEWER)' });
      }

      const existingCollab = doc.collaborators.find(
        (c) => c.user.toString() === targetUser._id.toString()
      );

      if (existingCollab) {
        existingCollab.role = role;
      } else {
        doc.collaborators.push({ user: targetUser._id, role });
      }
    }

    await doc.save();

    await Activity.create({
      documentId: doc._id,
      user: req.user._id,
      actionType: 'SHARE',
      details: action === 'remove' 
        ? `Removed collaborator ${targetUser.username}` 
        : `Shared with ${targetUser.username} as ${role}`,
    });

    await doc.populate([
      { path: 'owner', select: 'username email avatarColor' },
      { path: 'collaborators.user', select: 'username email avatarColor' }
    ]);

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleStar = async (req, res) => {
  try {
    const userId = req.user._id;
    const documentId = req.params.id;

    const existing = await Starred.findOne({ userId, documentId });
    if (existing) {
      await Starred.deleteOne({ _id: existing._id });
      res.json({ isStarred: false, message: 'Document unstarred successfully' });
    } else {
      await Starred.create({ userId, documentId });
      res.json({ isStarred: true, message: 'Document starred successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlainTextFromDelta = (content) => {
  if (!content || !Array.isArray(content.ops)) return '';
  return content.ops
    .map(op => typeof op.insert === 'string' ? op.insert : '')
    .join('');
};

export const detectMentions = async (doc, editorUser) => {
  const plainText = getPlainTextFromDelta(doc.content);
  if (!plainText.includes('@')) return;

  const allUsers = await User.find({});
  
  // Find matches of form @something
  const regex = /@([^\n\r\t.,!?;:()]+)/g;
  let match;
  const mentionedUsers = [];

  while ((match = regex.exec(plainText)) !== null) {
    const candidateText = match[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!candidateText) continue;

    // Find if any user matches this cleaned text
    const matchedUser = allUsers.find(u => {
      const cleanedUsername = u.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanedUsername === candidateText || (candidateText.length >= 3 && cleanedUsername.startsWith(candidateText));
    });

    if (matchedUser && matchedUser._id.toString() !== editorUser._id.toString()) {
      if (!mentionedUsers.some(u => u._id.toString() === matchedUser._id.toString())) {
        mentionedUsers.push(matchedUser);
      }
    }
  }

  const isMeetingNotes = doc.title && (
    doc.title.toLowerCase().includes('meeting') ||
    doc.title.toLowerCase().includes('notes')
  );

  // Invite/notify them
  for (const user of mentionedUsers) {
    const isOwner = doc.owner.toString() === user._id.toString();
    const isCollaborator = doc.collaborators.some(c => c.user.toString() === user._id.toString());

    if (!isOwner && !isCollaborator) {
      if (isMeetingNotes) {
        // Direct collaboration for meeting notes
        const existingNotification = await Notification.findOne({
          recipient: user._id,
          documentId: doc._id,
          type: 'SHARE'
        });

        if (!existingNotification) {
          doc.collaborators.push({ user: user._id, role: 'EDITOR' });

          await Notification.create({
            recipient: user._id,
            sender: editorUser._id,
            type: 'SHARE',
            documentId: doc._id,
            message: `${editorUser.username} mentioned and collaborated you in "${doc.title}" as EDITOR.`,
          });

          console.log(`Mention-Collaboration created for: ${user.username}`);
        }
      } else {
        // Check if already notified via INVITE
        const existingNotification = await Notification.findOne({
          recipient: user._id,
          documentId: doc._id,
          type: 'INVITE'
        });

        if (!existingNotification) {
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          await Invite.create({
            documentId: doc._id,
            email: user.email,
            role: 'EDITOR',
            invitedBy: editorUser._id,
            token,
            expiresAt,
          });

          await Notification.create({
            recipient: user._id,
            sender: editorUser._id,
            type: 'INVITE',
            documentId: doc._id,
            message: `${editorUser.username} mentioned you in "${doc.title}". Click Accept to collaborate as EDITOR.`,
          });

          console.log(`Mention-Invite notification created for: ${user.username}`);
        }
      }
    }
  }
};


import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// In-memory active presence storage
// Structure: documentId -> { socketId -> { userId, username, avatarColor, range } }
export const activePresence = new Map();

export const initSocketService = (io) => {
  // Authentication middleware for Sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dev_key_12345');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id} (User: ${socket.user.username})`);

    const joinedDocuments = new Set();

    socket.on('join-document', ({ documentId }) => {
      const roomName = `document-${documentId}`;
      socket.join(roomName);
      joinedDocuments.add(documentId);

      if (!activePresence.has(documentId)) {
        activePresence.set(documentId, new Map());
      }

      const docPresence = activePresence.get(documentId);
      docPresence.set(socket.id, {
        userId: socket.user._id,
        username: socket.user.username,
        avatarColor: socket.user.avatarColor,
        range: null,
      });

      const presenceArray = Array.from(docPresence.entries()).map(([sid, data]) => ({
        socketId: sid,
        ...data,
      }));
      io.to(roomName).emit('presence-update', presenceArray);
      console.log(`User ${socket.user.username} joined document ${documentId}`);
    });

    socket.on('send-changes', ({ documentId, delta }) => {
      const roomName = `document-${documentId}`;
      socket.to(roomName).emit('receive-changes', delta);
    });

    socket.on('send-resume-changes', ({ documentId, resumeData, changedField }) => {
      const roomName = `document-${documentId}`;
      socket.to(roomName).emit('receive-resume-changes', { resumeData, changedField });
    });

    socket.on('send-proposal-changes', ({ documentId, proposalData, collegeReportData }) => {
      const roomName = `document-${documentId}`;
      socket.to(roomName).emit('receive-proposal-changes', { proposalData, collegeReportData });
    });

    socket.on('send-academic-report-changes', ({ documentId, academicReportData }) => {
      const roomName = `document-${documentId}`;
      socket.to(roomName).emit('receive-academic-report-changes', { academicReportData });
    });

    socket.on('cursor-move', ({ documentId, range }) => {
      const roomName = `document-${documentId}`;
      const docPresence = activePresence.get(documentId);
      if (docPresence && docPresence.has(socket.id)) {
        const userData = docPresence.get(socket.id);
        userData.range = range;
        docPresence.set(socket.id, userData);

        socket.to(roomName).emit('cursor-update', {
          socketId: socket.id,
          userId: socket.user._id,
          username: socket.user.username,
          avatarColor: socket.user.avatarColor,
          range,
        });
      }
    });

    socket.on('leave-document', ({ documentId }) => {
      const roomName = `document-${documentId}`;
      socket.leave(roomName);
      joinedDocuments.delete(documentId);

      const docPresence = activePresence.get(documentId);
      if (docPresence) {
        docPresence.delete(socket.id);
        if (docPresence.size === 0) {
          activePresence.delete(documentId);
        } else {
          const presenceArray = Array.from(docPresence.entries()).map(([sid, data]) => ({
            socketId: sid,
            ...data,
          }));
          io.to(roomName).emit('presence-update', presenceArray);
        }
      }
      console.log(`User ${socket.user.username} left document ${documentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
      
      joinedDocuments.forEach((documentId) => {
        const roomName = `document-${documentId}`;
        const docPresence = activePresence.get(documentId);
        if (docPresence) {
          docPresence.delete(socket.id);
          if (docPresence.size === 0) {
            activePresence.delete(documentId);
          } else {
            const presenceArray = Array.from(docPresence.entries()).map(([sid, data]) => ({
              socketId: sid,
              ...data,
            }));
            io.to(roomName).emit('presence-update', presenceArray);
          }
        }
      });
    });
  });
};

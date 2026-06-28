import Document from '../models/Document.js';

const ROLE_VALUES = {
  'OWNER': 3,
  'EDITOR': 2,
  'COMMENTER': 1,
  'VIEWER': 0
};

export const requireDocumentRole = (minRole) => {
  return async (req, res, next) => {
    try {
      const docId = req.params.id || req.params.documentId;
      if (!docId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }

      const doc = await Document.findById(docId);
      if (!doc) {
        return res.status(404).json({ message: 'Document not found' });
      }

      let userRole = null;

      // 1. Check if user is the owner
      if (req.user && doc.owner.toString() === req.user._id.toString()) {
        userRole = 'OWNER';
      }

      // 2. Check if user is an explicit collaborator
      if (!userRole && req.user) {
        const collaborator = doc.collaborators.find(
          (c) => c.user.toString() === req.user._id.toString()
        );
        if (collaborator) {
          userRole = collaborator.role;
        }
      }

      // 3. Check if document is public
      if (!userRole && doc.isPublic) {
        userRole = doc.publicRole || 'VIEWER';
      }

      // 4. Validate role requirements
      if (!userRole) {
        return res.status(403).json({ message: 'Access denied: You do not have permission to view this document' });
      }

      const userRoleValue = ROLE_VALUES[userRole] ?? -1;
      const minRoleValue = ROLE_VALUES[minRole] ?? 999;

      if (userRoleValue < minRoleValue) {
        return res.status(403).json({ message: `Access denied: Minimum role of ${minRole} required` });
      }

      // Attach document and user role to the request context
      req.document = doc;
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('RBAC validation error:', error.message);
      return res.status(500).json({ message: 'Internal server error during role validation' });
    }
  };
};

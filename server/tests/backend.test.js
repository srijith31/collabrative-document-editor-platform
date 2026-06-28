import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index.js';
import User from '../models/User.js';
import Document from '../models/Document.js';

describe('Collaborative Document Editor API Tests', () => {
  let userToken;
  let otherUserToken;
  let documentId;

  beforeAll(async () => {
    // Set test env variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_999';
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/collab_doc_editor_test';

    // Connect to test MongoDB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    
    // Clear databases
    await User.deleteMany({});
    await Document.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Auth API', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      userToken = res.body.token;
    });

    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should update user profile successfully', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'updatedusername',
          avatarColor: '#ff9800'
        });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('updatedusername');
      expect(res.body.avatarColor).toBe('#ff9800');
    });

    it('should retrieve updated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('updatedusername');
      expect(res.body.avatarColor).toBe('#ff9800');
    });

    it('should create another user for sharing tests', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'otheruser@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(201);
      otherUserToken = res.body.token;
    });
  });

  describe('Document API', () => {
    it('should create a document for authenticated user', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      documentId = res.body._id;
    });

    it('should allow owner to read the document', async () => {
      const res = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.document).toHaveProperty('title');
      expect(res.body.userRole).toBe('OWNER');
    });

    it('should deny unauthorized user from reading the document', async () => {
      const res = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow owner to share document with other user', async () => {
      const res = await request(app)
        .put(`/api/documents/${documentId}/share`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'otheruser@example.com',
          role: 'EDITOR',
          action: 'add'
        });

      expect(res.status).toBe(200);
      expect(res.body.collaborators.length).toBe(1);
    });

    it('should now allow other user to read the shared document as EDITOR', async () => {
      const res = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.userRole).toBe('EDITOR');
    });
  });

  describe('Comments, Suggestions and Versions API', () => {
    let commentId;
    let suggestionId;

    it('should allow commenter/editor to add a comment', async () => {
      const res = await request(app)
        .post(`/api/comments/${documentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          text: 'This is a test comment',
          range: { index: 5, length: 10 }
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      commentId = res.body._id;
    });

    it('should allow commenter/editor to reply to a comment', async () => {
      const res = await request(app)
        .post(`/api/comments/${documentId}/${commentId}/reply`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          text: 'This is a reply'
        });

      expect(res.status).toBe(200);
      expect(res.body.replies.length).toBe(1);
      expect(res.body.replies[0].text).toBe('This is a reply');
    });

    it('should allow editor to resolve a comment', async () => {
      const res = await request(app)
        .put(`/api/comments/${documentId}/${commentId}/resolve`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.resolved).toBe(true);
    });

    it('should allow commenter/editor to submit a suggestion', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${documentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          originalText: 'original',
          suggestedText: 'suggested',
          range: { index: 15, length: 8 }
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      suggestionId = res.body._id;
    });

    it('should allow editor to reject a suggestion', async () => {
      const res = await request(app)
        .put(`/api/suggestions/${documentId}/${suggestionId}/reject`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('REJECTED');
    });

    it('should allow editor to create a version snapshot', async () => {
      const res = await request(app)
        .post(`/api/versions/${documentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'v1.0'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('v1.0');
    });
  });

  describe('Analytics API', () => {
    it('should retrieve dashboard stats successfully', async () => {
      const res = await request(app)
        .get('/api/analytics/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalDocuments');
      expect(res.body).toHaveProperty('totalComments');
      expect(res.body).toHaveProperty('totalSuggestions');
      expect(res.body).toHaveProperty('activeUsers');
    });

    it('should retrieve recent activity log successfully', async () => {
      const res = await request(app)
        .get('/api/analytics/recent-activity')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should retrieve monthly document creation stats successfully', async () => {
      const res = await request(app)
        .get('/api/analytics/monthly-creation')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(12);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('count');
    });

    it('should retrieve document stats successfully', async () => {
      const res = await request(app)
        .get('/api/analytics/document-stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('editors');
      expect(res.body[0]).toHaveProperty('comments');
      expect(res.body[0]).toHaveProperty('suggestions');
      expect(res.body[0]).toHaveProperty('versions');
    });

    it('should retrieve user productivity stats successfully', async () => {
      const res = await request(app)
        .get('/api/analytics/productivity')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('ROI Features API', () => {
    let templateId;

    it('should create a template document and allow copying it', async () => {
      const template = await Document.create({
        title: 'Test Template Note',
        content: { ops: [{ insert: 'Template Content\n' }] },
        owner: new mongoose.Types.ObjectId(),
        isTemplate: true
      });
      templateId = template._id;

      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ templateId });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Template Note');
      expect(res.body.content.ops[0].insert).toBe('Template Content\n');
    });

    it('should toggle star on a document successfully', async () => {
      const res1 = await request(app)
        .put(`/api/documents/${documentId}/star`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.isStarred).toBe(true);

      const res2 = await request(app)
        .get('/api/documents?tab=starred')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res2.status).toBe(200);
      const starredDoc = res2.body.find(d => d._id === documentId);
      expect(starredDoc).toBeDefined();
      expect(starredDoc.isStarred).toBe(true);

      const res3 = await request(app)
        .put(`/api/documents/${documentId}/star`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res3.status).toBe(200);
      expect(res3.body.isStarred).toBe(false);
    });

    it('should track recent documents on getById', async () => {
      const res1 = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .get('/api/documents?tab=recent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res2.status).toBe(200);
      const recentDoc = res2.body.find(d => d._id === documentId);
      expect(recentDoc).toBeDefined();
    });
  });
});


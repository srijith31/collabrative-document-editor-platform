# ⚡ CollabDoc

### Real-Time Collaborative Document Editor & Publishing Platform

> **Write. Collaborate. Review. Publish. — Together, in real time.**

CollabDoc is a full-stack collaborative document platform that combines **Google Docs-style real-time collaboration** with a **Microsoft Word-inspired editing experience**, advanced review workflows, document versioning, analytics, and specialized document builders.

Built with **React 19, Node.js, Express 5, Socket.IO, MongoDB, TipTap, and Material UI**.

<p align="center">

<a href="https://collabrative-document-editor-platfo.vercel.app/">
  <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-Visit%20CollabDoc-blue?style=for-the-badge" alt="Live Demo"/>
</a>

<a href="https://github.com/srijith31/collabrative-document-editor-platform">
  <img src="https://img.shields.io/badge/💻%20GITHUB-Repository-black?style=for-the-badge&logo=github" alt="GitHub"/>
</a>

</p>

<p align="center">

![License](https://img.shields.io/badge/License-ISC-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![Material UI](https://img.shields.io/badge/MUI-v9-007FFF?logo=mui&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209.7-47A248?logo=mongodb&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

</p>

---

# 🚀 Live Demo

## 👉 [Open CollabDoc](https://collabrative-document-editor-platfo.vercel.app/)

Experience the deployed application:

- ⚡ Real-time collaborative editing
- 👥 Multi-user presence
- 🖱️ Remote cursor tracking
- 📝 Rich-text document editing
- 💬 Comments and discussions
- ✏️ Suggestions / Track Changes
- 🕐 Version history
- 📄 Resume Builder
- 📊 Project Proposal Builder
- 🎓 Academic Report Builder
- 📈 Workspace Analytics
- 📤 PDF / DOCX export
- 🌙 Dark / Light mode

---

# 📖 Overview

**CollabDoc** is a full-stack, real-time collaborative document authoring and publishing platform.

It combines the collaborative experience of tools like **Google Docs** with a desktop-style editing experience inspired by **Microsoft Word**, while adding structured document builders, review workflows, analytics, and access control.

### 🎯 Core Workflow

```text
Create
   ↓
Collaborate
   ↓
Review
   ↓
Version
   ↓
Publish
```

---

# ✨ Key Features

## ⚡ 1. Real-Time Collaboration

Powered by **Socket.IO** for low-latency communication between collaborators.

* Live concurrent editing
* Real-time document synchronization
* Remote cursor tracking
* Selection highlighting
* Active collaborator presence
* Online / idle indicators
* Document-specific collaboration rooms
* Real-time structured builder synchronization

```text
                    ┌──────────────┐
                    │    User A    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Socket.IO  │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │    User B    │      │    User C    │
        └──────────────┘      └──────────────┘
```

---

# 📝 2. Desktop-Grade Rich Text Editor

CollabDoc provides a professional document editing experience.

### Ribbon Interface

* Home
* Insert
* Layout
* Review
* View

### Formatting

* Typography controls
* Font sizes
* Headings
* Lists
* Tables
* Callouts
* Inline code
* Code blocks
* Rich-text formatting

### Productivity Tools

* Find & Replace
* Regex / match highlighting
* Batch replacement
* Dark mode
* Light mode

---

# 📄 3. Specialized Document Builders

CollabDoc goes beyond traditional document editing.

## 📑 Resume Builder

Create professional resumes with:

* Personal information
* Professional summary
* Experience
* Education
* Projects
* Skills
* Multi-page preview
* Automatic pagination
* Page-break continuation
* PDF export

---

## 📊 Project Proposal Builder

Create structured project proposals containing:

* Problem Statement
* Proposed Architecture
* Project Timeline
* Milestones
* Budget
* Team Members
* Executive Summary

---

## 🎓 Academic Report Builder

Generate structured academic and engineering reports.

Supported sections include:

```text
Title Page
    ↓
Certificate
    ↓
Acknowledgement
    ↓
Abstract
    ↓
Table of Contents
    ↓
Chapters
    ↓
Figures
    ↓
Results
    ↓
Conclusion
```

---

# 💬 4. Review & Collaboration Workflow

CollabDoc provides a complete document review system.

### 💬 Threaded Comments

* Inline comments
* Replies
* Collaborator tagging
* Resolve / reopen discussions

### ✏️ Suggestions Mode

Users can propose document changes before they are applied.

```text
Author
   ↓
Edit Proposal
   ↓
Suggestion
   ↓
Reviewer
   ├── Accept
   └── Reject
```

### 🕐 Version History

* Timestamped snapshots
* Previous version browsing
* One-click restore
* Document rollback

### 📋 Activity Feed

Track:

* Document edits
* Comments
* Invitations
* Permission changes
* Collaboration activity

---

# 🔐 5. Security & Access Control

CollabDoc uses role-based access control.

| Role         | Permissions           |
| ------------ | --------------------- |
| 👑 OWNER     | Full document control |
| ✏️ EDITOR    | Edit document         |
| 💬 COMMENTER | Comment and review    |
| 👁️ VIEWER   | Read-only access      |

### Security Features

* JWT authentication
* BCrypt password hashing
* Helmet security middleware
* CORS origin validation
* Express rate limiting
* Protected API endpoints
* Expiring invitation links
* Targeted document invitations

---

# 📤 6. Import & Export

## Export Formats

```text
Document
   │
   ├── PDF
   ├── DOCX
   └── HTML
```

### Supported Technologies

* jsPDF
* html2pdf.js
* html2canvas
* pdfjs-dist
* docx

### PDF Import

Upload PDF documents and extract their text directly into the editor workspace.

---

# 📈 7. Workspace Analytics

Track workspace productivity and collaboration.

Analytics include:

* Contributor activity
* Monthly document creation
* Productivity trends
* Team contribution
* Contributor leaderboard
* Workspace activity

Powered by **Recharts**.

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │       React 19       │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                         REST API + Socket.IO
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Express 5 API    │
                         │      Node.js         │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
          Authentication     Collaboration       Documents
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       MongoDB        │
                         │      Mongoose 9      │
                         └──────────────────────┘
```

---

# 📁 Project Structure

```text
collabrative-document-editor-platform/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── package.json
│   └── vite.config.js
│
└── server/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── services/
    ├── sockets/
    ├── tests/
    └── package.json
```

---

# 🧰 Technology Stack

| Layer               | Technologies                     |
| ------------------- | -------------------------------- |
| 🎨 Frontend         | React 19, Vite 8                 |
| 🧭 Routing          | React Router DOM v7              |
| 🎨 UI               | Material UI v9, Emotion, CSS     |
| 📝 Rich Text        | TipTap, Quill 2                  |
| ⚡ Real-Time         | Socket.IO 4.8                    |
| 📊 Analytics        | Recharts 3.8                     |
| 🖥️ Backend         | Node.js, Express 5               |
| 🗄️ Database        | MongoDB                          |
| 🔗 ODM              | Mongoose 9.7                     |
| 🔐 Authentication   | JWT, BCrypt.js                   |
| 🛡️ Security        | Helmet, Express Rate Limit, CORS |
| 📄 PDF              | jsPDF, html2pdf, html2canvas     |
| 📃 DOCX             | docx                             |
| 🧪 Backend Testing  | Jest, Supertest                  |
| 🧪 Frontend Testing | Vitest                           |
| ☁️ Deployment       | Vercel + Node-compatible hosting |

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Node.js `18+` — `20+` recommended
* npm `9+`
* MongoDB local instance **or** MongoDB Atlas

---

# 1️⃣ Clone the Repository

```bash
git clone https://github.com/srijith31/collabrative-document-editor-platform.git

cd collabrative-document-editor-platform
```

---

# 2️⃣ Backend Setup

```bash
cd server

npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure:

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/collab_doc_editor

JWT_SECRET=your_super_secret_jwt_key

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

Or:

```bash
npm start
```

---

# 3️⃣ Frontend Setup

Open another terminal:

```bash
cd client

npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🔌 Socket.IO Events

| Event                   | Direction       | Purpose                   |
| ----------------------- | --------------- | ------------------------- |
| `join-document`         | Client → Server | Join document room        |
| `leave-document`        | Client → Server | Leave document room       |
| `send-changes`          | Client → Server | Send document changes     |
| `receive-changes`       | Server → Client | Receive remote changes    |
| `cursor-move`           | Client → Server | Broadcast cursor position |
| `cursor-update`         | Server → Client | Update remote cursors     |
| `presence-update`       | Server → Client | Update active users       |
| `send-resume-changes`   | Client → Server | Sync resume data          |
| `send-proposal-changes` | Client → Server | Sync proposal/report data |

---

# 📡 REST API

All protected routes require:

```http
Authorization: Bearer <token>
```

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

## Documents

```text
GET      /api/documents
POST     /api/documents
GET      /api/documents/:id
PUT      /api/documents/:id
DELETE   /api/documents/:id
```

## Comments

```text
GET      /api/comments/:documentId
POST     /api/comments/:documentId
PATCH    /api/comments/:commentId/resolve
```

## Suggestions

```text
GET      /api/suggestions/:documentId
POST     /api/suggestions/:documentId
PATCH    /api/suggestions/:suggestionId
```

## Versions

```text
GET      /api/versions/:documentId
POST     /api/versions/:documentId/restore
```

## Workspace

```text
POST     /api/invites/:documentId
GET      /api/notifications
GET      /api/activity
GET      /api/analytics
GET      /api/templates
```

---

# 🧪 Testing

## Backend

```bash
cd server

npm test
```

Socket.IO smoke tests:

```bash
npm run test:socket
```

## Frontend

```bash
cd client

npm test
```

Lint:

```bash
npm run lint
```

---

# 🌐 Deployment

## Frontend — Vercel

Configure:

```text
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Environment variable:

```env
VITE_API_URL=https://your-backend-url.com
```

### 🚀 Production Frontend

```text
https://collabrative-document-editor-platfo.vercel.app/
```

Or simply:

### 👉 [Open Live Demo](https://collabrative-document-editor-platfo.vercel.app/)

---

# 🗄️ MongoDB Atlas

For production deployment, use MongoDB Atlas.

Set:

```env
MONGO_URI=<your-mongodb-atlas-connection-string>
```

Never commit your `.env` file or database credentials to GitHub.

---

# 🔄 Application Workflow

```text
                    ┌───────────────┐
                    │     Login     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Dashboard   │
                    └───────┬───────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
           Documents    Templates   Analytics
                │           │
                ▼           ▼
          Rich Editor    Builders
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
     Comments  Review  Collaboration
        │       │        │
        └───────┼────────┘
                ▼
         Version History
                │
                ▼
          Export / Publish
```

---

# 🗺️ Roadmap

* [ ] AI-assisted document editing
* [ ] AI writing suggestions
* [ ] Advanced document search
* [ ] Offline editing
* [ ] Conflict-free collaborative editing
* [ ] Additional resume templates
* [ ] Google Drive integration
* [ ] Microsoft OneDrive integration
* [ ] Email notifications
* [ ] Organization / workspace management
* [ ] Advanced permission policies
* [ ] Document activity heatmaps

---

# 🤝 Contributing

Contributions are welcome!

### 1. Fork the repository

```bash
git checkout -b feature/AmazingFeature
```

### 2. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

### 3. Push your branch

```bash
git push origin feature/AmazingFeature
```

### 4. Open a Pull Request

---

# 📄 License

This project is licensed under the **ISC License**.

See [`LICENSE`](LICENSE) for details.

---

# 👨‍💻 Author

## Srijith

**Full-Stack Developer | AI/ML Enthusiast | Problem Solver**

Built with ❤️ using:

**React • Node.js • Express • Socket.IO • MongoDB**

<p align="center">

<a href="https://collabrative-document-editor-platfo.vercel.app/">
  <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-Open%20CollabDoc-blue?style=for-the-badge" alt="Live Demo"/>
</a>

<a href="https://github.com/srijith31/collabrative-document-editor-platform">
  <img src="https://img.shields.io/badge/⭐%20STAR%20ON%20GITHUB-Repository-black?style=for-the-badge&logo=github" alt="GitHub"/>
</a>

</p>

---

<p align="center">

### ⚡ CollabDoc

**Collaborate. Create. Review. Publish.**

⭐ Star the repository if you find it useful!

</p>

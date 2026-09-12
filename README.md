# CollabDoc ⚡

> A modern, real-time collaborative document authoring and publication platform built with **React 19**, **Node.js (Express 5)**, **Socket.IO**, and **MongoDB**.

![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite&logoColor=white)
![Material UI](https://img.shields.io/badge/MUI-v9-007fff?logo=mui&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209.7-47A248?logo=mongodb&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

## 📖 Overview

**CollabDoc** is a full-stack, enterprise-grade collaborative document editing and publishing suite. It combines Google Docs-style real-time multi-user editing with a Microsoft Word-inspired Ribbon toolbar, automated version snapshotting, threaded inline comments, and track-changes suggestions.

In addition to traditional free-form rich-text editing, CollabDoc provides specialized schema-driven builders:
- 📄 **Interactive Resume Builder & Multi-Page Preview** with automated pagination and page-break continuation.
- 📊 **Project Proposal Suite** for structured milestones, budgets, and executive summaries.
- 🎓 **Academic & Engineering Report Builder** (customizable for collegiate formats like the Vardhaman College Report standard).
- 📈 **Workspace Analytics & Contributor Leaderboard** for team productivity tracking.

---

## ✨ Key Features

### 1. Real-Time Collaboration & Synchronization
- **Live Concurrent Editing:** Seamless multi-user document syncing powered by WebSockets (`Socket.IO`) and delta updates.
- **Visual Cursor Tracking:** Color-coded remote cursor positions and selection highlights with user labels.
- **Active Presence Engine:** Real-time online/idle indicators displaying avatars and active contributors.
- **Room-Based Document Isolation:** Scalable socket namespaces and document-specific rooms.

### 2. Desktop-Grade Rich-Text Authoring
- **Word-Style Ribbon Toolbar:** Familiar tabbed interface (`Home`, `Insert`, `Layout`, `Review`, `View`) with quick-access actions.
- **Comprehensive Formatting:** Typography controls, font sizes, heading hierarchies, lists, callouts, tables, inline code, and code blocks.
- **Find & Replace:** Built-in search toolbar supporting search-in-doc, regex/match highlighting, and batch replacement.
- **Dark & Light Mode UI:** Custom-tailored dark glassmorphic design system using Material UI (MUI v9) and CSS custom tokens.

### 3. Specialized Builders & Templates
- **Dynamic Resume Builder:**
  - Dedicated sections for Personal Info, Summary, Experience, Education, Projects, and Skills.
  - Live multi-page preview with automatic page-break computation and dynamic continuation.
  - Instant PDF download and export.
- **Project Proposal Editor:**
  - Structured templates for Problem Statement, Proposed Architecture, Timeline Milestones, Budget, and Team Rosters.
- **Academic Project Report Generator:**
  - Pre-structured university chapters (Title Page, Certificates, Acknowledgements, Abstract, Table of Contents, Chapters, Figures, Results, and Conclusions).
- **Pre-Seeded Template Library:** Blank Document, Meeting Notes, Project Proposal, Research Notes, Resume Builder, and College Report.

### 4. Review Workflow & Audit Trail
- **Threaded Inline Comments:** Comment on document sections, tag collaborators, post replies, and mark queries as resolved.
- **Suggestions Mode (Track Changes):** Propose inline edits that document owners can accept or reject with a single click.
- **Version History & Restore:** Automated timestamped snapshots with one-click rollback to prior versions.
- **Activity Feed & Audit Log:** Granular event logging (edits, comments, permissions, invitations) with user attribution.

### 5. Access Control & Security
- **Role-Based Access Control (RBAC):** Granular permission tiers (`OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`).
- **Secure Document Sharing:** Generate single-use or target-email invitation links with expiration control.
- **Enterprise Security Middleware:** HTTP protection via **Helmet**, **CORS origin whitelisting**, **JWT authentication**, and **Express rate limiting**.

### 6. Document Import, Export & Analytics
- **Multi-Format Export:** Export documents to **PDF** (via jsPDF & html2pdf), **Microsoft Word (.docx)**, or formatted HTML.
- **PDF Ingestion & Text Parsing:** Extract text directly from uploaded PDFs into the editor workspace.
- **Workspace Analytics:** Contributor activity graphs, monthly creation charts, and team leaderboards powered by **Recharts**.

---

## 🏗️ Architecture & Tech Stack

```
collabrative-document-editor-platform/
├── client/                     # React 19 Single Page Application
│   ├── src/
│   │   ├── assets/             # Branding assets, icons, logos
│   │   ├── components/         # Editor, Ribbon, Comments, Presence, Analytics
│   │   ├── contexts/           # AuthContext, SocketContext
│   │   ├── pages/              # Landing, Login, Register, Dashboard, DocumentPage
│   │   ├── services/           # Axios HTTP API services
│   │   └── utils/              # Export helpers (PDF/DOCX), date formatters
│   ├── package.json
│   └── vite.config.js
└── server/                     # Node.js + Express 5 Backend
    ├── config/                 # MongoDB database connector & seed data
    ├── controllers/            # Route controllers & business logic
    ├── middleware/             # JWT auth, error handlers, rate-limiting & Helmet
    ├── models/                 # Mongoose schemas (Document, User, Version, etc.)
    ├── routes/                 # Express API routes
    ├── services/               # Document and activity services
    ├── sockets/                # Socket.IO connection & event handlers
    ├── tests/                  # Integration, Jest, and socket smoke tests
    └── package.json
```

### Technology Breakdown

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, React Router DOM v7, Vite 8 |
| **UI Components & Styling** | Material UI (MUI v9), Emotion, Custom Vanilla CSS |
| **Rich Text Engines** | TipTap (`@tiptap/react`, `@tiptap/pm`), Quill 2 |
| **Real-Time Networking** | Socket.IO Client v4.8 |
| **Data Visualization** | Recharts v3.8 |
| **Document Generation** | `docx`, `jspdf`, `html2canvas`, `html2pdf.js`, `pdfjs-dist` |
| **Backend Framework** | Node.js (ES Modules), Express 5 |
| **Database & ODM** | MongoDB, Mongoose 9.7 |
| **Security & Authentication** | JSON Web Tokens (JWT), BCrypt.js, Helmet, Express Rate Limit |
| **Testing** | Jest 30, Supertest, Vitest |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** `v18.x` or higher (v20+ recommended)
- **npm:** `v9.x` or higher
- **MongoDB:** A local MongoDB instance (`mongodb://localhost:27017`) or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.

---

### 1. Clone the Repository

```bash
git clone https://github.com/srijith31/collabrative-document-editor-platform.git
cd collabrative-document-editor-platform
```

---

### 2. Backend Setup (`server`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `server` directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

   Configure your variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/collab_doc_editor
   JWT_SECRET=your_super_secret_jwt_key_here
   CLIENT_URL=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   # Development mode with Nodemon
   npm run dev

   # Or standard production mode
   npm start
   ```
   > **Note:** On the first launch, the server automatically connects to MongoDB and seeds default document templates (Meeting Notes, Resume Builder, Proposal, Academic Report).

---

### 3. Frontend Setup (`client`)

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `client` directory:
   ```bash
   cp .env.example .env
   ```

   Set the backend API endpoint:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser and visit:
   ```
   http://localhost:5173
   ```

---

## 🔌 Socket.IO Real-Time Events

The real-time collaboration engine operates on the following core events:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join-document` | Client ➔ Server | `{ documentId }` | Subscribes socket to the document room and broadcasts active presence |
| `leave-document` | Client ➔ Server | `{ documentId }` | Unsubscribes socket and updates presence for remaining users |
| `send-changes` | Client ➔ Server | `{ documentId, delta }` | Broadcasts rich-text delta edits to all other room collaborators |
| `receive-changes` | Server ➔ Client | `delta` | Receives delta operations from remote collaborators and applies them |
| `cursor-move` | Client ➔ Server | `{ documentId, range }` | Emits current caret index and selection range |
| `cursor-update` | Server ➔ Client | `{ socketId, userId, username, avatarColor, range }` | Renders remote collaborator carets in real-time |
| `presence-update` | Server ➔ Client | `Array<{ socketId, userId, username, avatarColor }>` | Updates the active collaborators avatar bar |
| `send-resume-changes` | Client ➔ Server | `{ documentId, resumeData, changedField }` | Synchronizes structured resume fields across peers |
| `send-proposal-changes`| Client ➔ Server | `{ documentId, proposalData, collegeReportData }` | Synchronizes project proposal and academic report structures |

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate user & receive JWT token.
- `GET /api/auth/me` - Retrieve current authenticated user profile.

### Documents (`/api/documents`)
- `GET /api/documents` - Fetch all documents accessible to the user (owned or shared).
- `POST /api/documents` - Create a new blank or template-based document.
- `GET /api/documents/:id` - Fetch document details, content, and user permissions.
- `PUT /api/documents/:id` - Update document title, content, or metadata.
- `DELETE /api/documents/:id` - Delete document (owner only).

### Collaboration & Review
- `GET /api/comments/:documentId` - Fetch all comments and threads for a document.
- `POST /api/comments/:documentId` - Add an inline comment or reply.
- `PATCH /api/comments/:commentId/resolve` - Toggle comment resolution status.
- `GET /api/suggestions/:documentId` - Retrieve suggested edits.
- `POST /api/suggestions/:documentId` - Propose a new suggestion (track changes).
- `PATCH /api/suggestions/:suggestionId` - Accept or reject a proposed edit.
- `GET /api/versions/:documentId` - List saved version history snapshots.
- `POST /api/versions/:documentId/restore` - Restore document to a prior snapshot.

### Sharing & Workspace
- `POST /api/invites/:documentId` - Generate a shareable invitation link or send an invite.
- `GET /api/notifications` - Retrieve in-app notifications.
- `GET /api/activity` - Fetch workspace activity feed and contributor audit logs.
- `GET /api/analytics` - Fetch workspace productivity metrics and charts.
- `GET /api/templates` - Fetch pre-configured document templates.

---

## 🧪 Testing & Validation

The platform includes unit, integration, and socket smoke tests:

### Running Backend Tests
```bash
cd server

# Run unit and integration tests with Jest
npm test

# Run real-time Socket.IO smoke tests
npm run test:socket
```

### Running Frontend Tests
```bash
cd client

# Run Vitest test suite
npm test

# Run ESLint validation
npm run lint
```

---

## 🌐 Deployment Guide

### Deploying the Frontend (Vercel)
1. Link the repository to [Vercel](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Configure the environment variable:
   - `VITE_API_URL`: URL of your deployed backend (e.g., `https://api.collabdoc.yourdomain.com`).
5. Deploy. SPA routing is already configured in `client/vercel.json`.

### Deploying the Backend (Render / Railway / AWS / VPS)
1. Deploy the `server` directory as a Node service.
2. Set the **Start Command** to `npm start`.
3. Configure environment variables in your hosting dashboard:
   - `PORT`: `5000` (or assigned port)
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure, random secret key
   - `CLIENT_URL`: URL of your deployed frontend (e.g., `https://collabdoc.vercel.app`)
4. Ensure your hosting provider supports persistent WebSocket connections (WebSockets are enabled by default on Render and Railway).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. **Fork** the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m "Add AmazingFeature"`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/srijith31">Srijith</a> and Contributors.
</p>

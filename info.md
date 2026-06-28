# Collaborative Document Editor - Project Architecture & Implementation Guide

Welcome to the **Collaborative Document Editor** documentation. This file provides a comprehensive guide detailing how the application works, a complete file-by-file description, and the recent enhancements and bug fixes implemented.

---

## 1. Application Overview

This application is a real-time, collaborative rich text editor. Users can:
- **Register and Log In**: Accounts are secured using `bcryptjs` and authenticated via JSON Web Tokens (JWT).
- **Create and Manage Documents**: Create, delete, and list text documents.
- **Collaborate in Real-Time**: Edit documents concurrently with live cursors showing where collaborators are typing, powered by Websockets (Socket.io).
- **Share Documents**: Share documents with others by generating invitation links with specific roles (Editor, Commenter, Viewer).
- **Comments & Suggestions**: Reviewers can post comments or suggest replacements directly on selected text, which editors can accept or reject.
- **Version Snapshots**: Save document versions and restore the editor to any past version.
- **Workspace Insights**: A dashboard showcasing creation trends, document statistics, active collaborators, and contribution leaderboards.

---

## 2. Technical Stack

- **Backend (Server)**:
  - **Node.js & Express**: API framework handling routing, security, and controllers.
  - **MongoDB & Mongoose**: Object Data Modeling (ODM) library for connecting to database schemas.
  - **Socket.io**: Real-time bidirectional event engine for synchronizing document delta edits and cursor presence.
- **Frontend (Client)**:
  - **React & Vite**: Fast SPA framework bundling JavaScript and JSX.
  - **Material UI (MUI)**: Design component system providing polished dark aesthetics.
  - **Quill**: Robust rich text editor core representing document content in Delta operations.
  - **Recharts**: Charting library rendering monthly creation curves.

---

## 3. File-by-File Breakdown

### Root Directory
- [index.html](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/index.html): HTML entry point mounting the React application root.
- [render.yaml](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/render.yaml): Render deployment configuration file.
- [README.md](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/README.md): Quickstart instructions and overview.
- [RUN_INSTRUCTIONS.md](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/RUN_INSTRUCTIONS.md): Step-by-step local setup and common troubleshooting (port 5000 AirPlay collisions, MongoDB community setup).

---

### Backend Server (`server/`)

#### Configuration & Main Entry
- [index.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/index.js): App initialization file. Configures security middlewares (Helmet, CORS), parses request bodies, attaches API routers, initializes socket servers, and launches the HTTP listener on port `5001`.
- [config/db.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/config/db.js): Handles database connection via Mongoose using the `MONGO_URI` environment string.
- [sockets/socketService.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/sockets/socketService.js): Manages websocket connections, room management (`join-document` / `leave-document`), presence maps, document changes (`send-changes` broadcast), and cursor positioning (`cursor-move`).

#### Database Models (`server/models/`)
- [User.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/User.js): Holds username, email, hashed password, and randomized avatar color. Pre-save hook handles hashing passwords using bcrypt.
- [Document.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/Document.js): Holds document title, content (Quill Delta object), owner reference, isPublic flags, and collaborators array.
- [Comment.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/Comment.js): Holds comments, replies, resolved statuses, and range coordinates linked to documents.
- [Suggestion.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/Suggestion.js): Holds proposed edit replacements, ranges, and status enum (PENDING, ACCEPTED, REJECTED).
- [Activity.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/Activity.js): Logs events (CREATE, EDIT, COMMENT, SHARE, VERSION_RESTORE) mapping user and document references.
- [Version.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/Version.js): Stores frozen document snapshots for historical restoration.
- [Invite.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/Invite.js): Manages secure email-specific token codes for joining documents.
- [Notification.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/models/Notification.js): Stores user alert items.

#### Controllers (`server/controllers/`)
- [authController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/authController.js): Coordinates login, user registration, token generation, and profile management.
- [analyticsController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/analyticsController.js): Maps requests to the analytics services, passing `req.user._id` for correct scoping.
- [documentController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/documentController.js): Handles document CRUD operations and public access routing.
- [inviteController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/inviteController.js): Manages generating secure invite links and redeeming tokens to append collaborators.
- [commentController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/commentController.js): Adds, replies to, and resolves document comments.
- [suggestionController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/suggestionController.js): Coordinates accepting suggestions (applying change deltas to documents) or rejecting suggestions.
- [versionController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/versionController.js): Handles snapshot version creations and content restorations.
- [activityController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/activityController.js): Fetches history logs for a document.
- [notificationController.js](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/server/controllers/notificationController.js): Retreives and updates notification read state.

#### Routes (`server/routes/`)
- Express route maps matching REST verbs to their respective controllers (`authRoutes.js`, `analyticsRoutes.js`, `documentRoutes.js`, `inviteRoutes.js`, `commentRoutes.js`, `suggestionRoutes.js`, `versionRoutes.js`, `activityRoutes.js`, `notificationRoutes.js`).

---

### Frontend Client (`client/`)

#### React Core & Setup
- [App.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/App.jsx): App component defining routes (Login, Register, Dashboard, Analytics, DocumentPage) nested inside Theme, Auth, and Socket Providers.
- [main.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/main.jsx): React index mounting core.
- [index.css](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/index.css): Core design systems, CSS variables (dark theme colors, glass-panels, scrollbars).

#### Application Contexts (`client/src/contexts/`)
- [AuthContext.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/contexts/AuthContext.jsx): Stores local session data, token values, login / register functions, and updates active user profile contexts.
- [SocketContext.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/contexts/SocketContext.jsx): Initializes socket.io connection with auth tokens and exports hooks to share sockets across components.

#### API Services (`client/src/services/`)
- Axios-wrapped service classes for network mapping (`api.js`, `authService.js`, `documentService.js`, `commentService.js`, `analyticsService.js`).

#### Pages (`client/src/pages/`)
- [Login.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/pages/Login.jsx) & [Register.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/pages/Register.jsx): Secure sign-in forms.
- [Dashboard.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/pages/Dashboard.jsx): Main hub for creating, sorting, searching documents, redeeming invite codes, and updating profile settings.
- [DocumentPage.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/pages/DocumentPage.jsx): The workspace editor viewport. Integrates the MenuBar, FindReplaceBar, Quill Editor, side-panels (Comments, Suggestions, Versions, Logs), and registers keybind event listeners.
- [analytics/Analytics.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/pages/analytics/Analytics.jsx): The insights dashboard rendering scoped analytics metrics.

#### Components (`client/src/components/`)
- [DocumentEditor.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/components/DocumentEditor.jsx): Initialized Quill JS. Sends text change deltas to websockets and renders floating peer cursors dynamically using selection bounds.
- [MenuBar.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/components/MenuBar.jsx): Renders dropdown menus (File, Edit, Format, Help) with shortcut helper labels.
- [FindReplaceBar.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/components/FindReplaceBar.jsx): Sliding panel that handles finding, navigating matching ranges, replacing single keywords, or updating all occurrences.
- Side panels: `CommentsPanel.jsx`, `SuggestionsPanel.jsx`, `VersionHistory.jsx`, `ActivityFeed.jsx`.
- [NotificationBell.jsx](file:///Users/srijithsharma/Desktop/projects/Collaborative%20Document%20Editor/client/src/components/NotificationBell.jsx): Shows notifications (like document invitations) inside the header bar.

---

## 4. Updates & Modifications Implemented

Here is a list of the exact enhancements we made to improve database consistency, security scoping, and user formatting utilities:

### 1. Port Conflict Fixes
- Checked port availability and cleaned up conflicting/orphaned Node server processes on ports `5001` (backend) and `5173` (client frontend) before restarting.

### 2. Database Cleanup
- Ran a clean-up script to locate and safely remove orphaned database items created during previous test suites:
  - Deleted **1** comment without an existing document.
  - Deleted **1** suggestion without an existing document.
  - Deleted **42** activity logs pointing to deleted documents or users.

### 3. Secured Workspace Insights Scoping
- Updated backend analytics services and controllers to scope data query filters by `userId`:
  - **Metrics Cards**: Count Documents, Comments, and Suggestions only within documents the logged-in user owns or collaborates on, preventing access leaks.
  - **Charts**: Filters monthly document creations to the user's accessible documents.
  - **Leaderboard**: Displays contribution statistics strictly mapped to the user's workspace documents.

### 4. Rich Text Format & File Menus (Menu Bar)
- Added the dropdown **MenuBar** at the top of the editor:
  - **File**: Handles creating, opening, saving, clone/save-as, and printing documents.
  - **Edit**: Undoes, redoes, selects all, and triggers search.
  - **Format**: Adds styles, headings, list formats, hyperlinks, and clears styling.
  - **Help**: Displays a popup detailing all formatting, editing, and navigation hotkeys.

### 5. Keyboard Shortcuts
- Configured keyboard listeners in `DocumentPage` mapping combinations:
  - Intercepts default browser actions (e.g. `Ctrl/Cmd + S` or `P`) to run document-specific logic (Manual Save, Save As, and Print).
  - Handles key commands like `Ctrl/Cmd + F` for finding words and list creations inside the Quill workspace.

### 6. Find & Replace
- Integrated **FindReplaceBar** component:
  - Supports navigation through matches with a highlight and selection cursor.
  - Allows replacing occurrences individually or updating all.

### 7. SaaS-Grade ROI Features
- **Document Templates**: Seeded standard templates (Blank, Meeting Notes, Project Proposal, Sprint Planning, Resume) in `seedTemplates.js` and built a grid template header gallery on the dashboard.
- **Starred Documents**: Created `Starred.js` model and toggling routes allowing users to favorite documents and list them inside the Starred tab.
- **Recent Documents**: Created `Recent.js` model updating document `lastOpened` timestamps on page opens, showing sorted documents in the Recent tab.
- **Export to PDF**: Integrated `jspdf` and `html2canvas` inside `MenuBar` to generate multi-page, print-friendly white-background PDFs of document content.
- **Presence Panel**: Implemented `CollaboratorsPanel.jsx` in the editor right-panel, updating online collaborator lists and tracking active/idle statuses (🟢/🟡) alongside real-time cursor indices.

### 8. Premium SaaS Landing Page
- Added a sticky-navbar Landing Page at `/` featuring anchor menus, primary action buttons, detailed feature grids, horizontal step-by-step guides, technology lists, and interactive editor mockups animating real-time user typing and sidebar reviews.
- Configured routes so that logged-in users bypass the landing page directly into `/dashboard`.

---

## 5. Strategic Enhancements Roadmap & Spacing Fixes

### A. Completed Spacing Enhancements
We resolved vertical layout crowding in the Project Proposal view and PDF exports:
* **Section Separation**: Introduced a clean `32px` vertical margin-top gap between consecutive sections.
* **Typography Hierarchy**: Implemented a professional spacing scale: Section Heading $\rightarrow$ 12px $\rightarrow$ Section Content $\rightarrow$ 32px $\rightarrow$ Next Section Heading.
* **Layout Stability**: Standardized margins and paddings to prevent collapse across page breaks during PDF compilation.

### B. Suggested Next Improvements (Technical Roadmap)
1. **Orphan Heading Prevention**: Automatically detect if the remaining vertical space on a page is too small to render a section heading along with at least its first paragraph. If the height is insufficient, the system forces a page break to move the entire section to the next page.
2. **List Block Integrity**: Grouped list elements are treated as single block chunks, moving together or maintaining a minimum count on page shifts to avoid breaking lists across pages awkwardly.
3. **Page Header/Footer System**: Support page-layout rules based on document section classes, rendering Roman numerals (`i, ii, iii...`) for front matter and resetting to Arabic (`1, 2, 3...`) for chapters.
4. **Dynamic Table of Contents**: Generate a visual index (with dot leaders) that updates page numbers automatically as sections are added.
5. **Auto-Numbered Captions**: Figure and table counters auto-increment based on the active chapter index.
6. **Widow and Orphan Protection**: Prevent leaving a single trailing line of a paragraph at the top of a page (widow) or a single starting line at the bottom of a page (orphan).
7. **Page-Aware Image Scaling**: Images scale down automatically to fit the remaining vertical viewport height, moving to the next page alongside their caption as a single unit if space is insufficient.
8. **Code Block Engine**: Render syntax-highlighted code blocks with dark/light themes, line numbers, and page-break support.
9. **Long-Term Compiler Pipeline**:
   $$\text{Form Components} \rightarrow \text{Structured Data} \rightarrow \text{Layout Compiler} \rightarrow \text{Typography Engine} \rightarrow \text{Spacing Engine} \rightarrow \text{Pagination Engine} \rightarrow \text{Widow/Orphan Controller} \rightarrow \text{Header/Footer Injector} \rightarrow \text{A4 Renderer} \rightarrow \text{PDF/DOCX Export}$$


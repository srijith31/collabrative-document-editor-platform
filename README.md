# Collaborative Document Editor

A production-ready real-time collaborative document editor built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

## Features

- **Real-time Collaboration**: Synchronized document editing powered by Socket.io and Quill Delta.
- **Rich User Presence**: Live cursor tracking, highlight sync, and active user indicators.
- **Document Management**: Create, search, sort, delete, and manage document permissions (OWNER, EDITOR, COMMENTER, VIEWER).
- **Comments & Suggestion Mode**: Add, resolve, and reply to comments, or suggest modifications that owners/editors can accept or reject.
- **Version History**: Save snapshots of documents and restore them when needed.
- **Dynamic UI**: Built with React 19, Vite, and Material UI, featuring sleek animations, a polished dark mode, and responsive layout.

## Project Structure

This repository is structured as a monorepo containing two main packages:

```text
├── client/          # Vite + React 19 frontend
└── server/          # Node.js + Express + Socket.io backend
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local instance or MongoDB Atlas URI)

### Installation

1. Clone the repository.
2. Install dependencies for the client:
   ```bash
   cd client
   npm install
   ```
3. Install dependencies for the server:
   ```bash
   cd server
   npm install
   ```

### Running the Application

1. **Start the Backend Server**:
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:5000` (or the configured PORT).

2. **Start the Frontend Client**:
   ```bash
   cd client
   npm run dev
   ```
   The client will run on `http://localhost:5173`.

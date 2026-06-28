# Collaborative Document Editor API Documentation

Base URL for all REST endpoints: `http://localhost:5001/api`

---

## 1. REST API

### Authentication API (`/auth`)

* **POST `/auth/register`**
  - **Description**: Registers a new user.
  - **Payload**: `{ "username": "JohnDoe", "email": "john@example.com", "password": "password123" }`
  - **Response (201)**: `{ "_id": "...", "username": "JohnDoe", "email": "...", "avatarColor": "#...", "token": "JWT_TOKEN" }`

* **POST `/auth/login`**
  - **Description**: Authenticates user and returns JWT.
  - **Payload**: `{ "email": "john@example.com", "password": "password123" }`
  - **Response (200)**: `{ "_id": "...", "username": "JohnDoe", "email": "...", "avatarColor": "#...", "token": "JWT_TOKEN" }`

* **GET `/auth/profile`** (Requires Token)
  - **Description**: Retrieves current user profile.
  - **Response (200)**: `{ "_id": "...", "username": "JohnDoe", "email": "john@example.com", "avatarColor": "#..." }`

* **PUT `/auth/profile`** (Requires Token)
  - **Description**: Updates user details (username, avatarColor, or password).
  - **Payload**: `{ "username": "NewName", "avatarColor": "#ff5722", "password": "newpassword123" }`
  - **Response (200)**: `{ "_id": "...", "username": "NewName", "email": "...", "avatarColor": "#ff5722" }`

---

### Documents API (`/documents`)

* **GET `/documents`** (Requires Token)
  - **Description**: Lists all documents owned by or shared with the user.
  - **Query Params**:
    - `search` (Optional string query to filter titles)
    - `sort` (Optional: `newest`, `oldest`, `alphabetical`)
  - **Response (200)**: Array of Document objects.

* **POST `/documents`** (Requires Token)
  - **Description**: Creates a new blank document.
  - **Response (201)**: Document object.

* **GET `/documents/:id`** (Requires Token)
  - **Description**: Retrieves detailed document object and user's role.
  - **Response (200)**: `{ "document": { ... }, "userRole": "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER" }`

* **PUT `/documents/:id`** (Requires Token, Editor/Owner role)
  - **Description**: Updates document details or content.
  - **Payload**: `{ "title": "New Title", "content": { "ops": [...] }, "isPublic": true, "publicRole": "VIEWER" }`
  - **Response (200)**: Updated Document object.

* **DELETE `/documents/:id`** (Requires Token, Owner role only)
  - **Description**: Permanently deletes a document.
  - **Response (200)**: `{ "message": "Document deleted successfully" }`

* **PUT `/documents/:id/share`** (Requires Token, Owner role only)
  - **Description**: Direct-shares a document with another user or revokes permission.
  - **Payload**: `{ "email": "collaborator@example.com", "role": "EDITOR" | "COMMENTER" | "VIEWER", "action": "add" | "remove" }`
  - **Response (200)**: Updated Document object.

---

### Comments API (`/comments`)

* **GET `/comments/:documentId`** (Requires Token)
  - **Description**: Lists all comments (and nested replies) for a document.
  - **Response (200)**: Array of Comment objects.

* **POST `/comments/:documentId`** (Requires Token, Commenter role minimum)
  - **Description**: Adds an inline comment thread.
  - **Payload**: `{ "text": "This text needs improvement", "range": { "index": 12, "length": 5 } }`
  - **Response (201)**: Created Comment object.

* **POST `/comments/:documentId/:commentId/reply`** (Requires Token, Commenter role minimum)
  - **Description**: Appends a reply to a comment thread.
  - **Payload**: `{ "text": "I agree!" }`
  - **Response (200)**: Updated Comment object with replies.

* **PUT `/comments/:documentId/:commentId/resolve`** (Requires Token, Viewer role minimum. Only accessible by comment author or Owner/Editor)
  - **Description**: Marks a comment thread as resolved.
  - **Response (200)**: Updated resolved Comment object.

---

### Suggestions API (`/suggestions`)

* **GET `/suggestions/:documentId`** (Requires Token)
  - **Description**: Lists all edits proposed by commenters.
  - **Response (200)**: Array of Suggestion objects.

* **POST `/suggestions/:documentId`** (Requires Token, Commenter role minimum)
  - **Description**: Submits an inline text edit replacement suggestion.
  - **Payload**: `{ "originalText": "old", "suggestedText": "new", "range": { "index": 20, "length": 3 } }`
  - **Response (201)**: Suggestion object.

* **PUT `/suggestions/:documentId/:suggestionId/accept`** (Requires Token, Editor role minimum)
  - **Description**: Merges a suggestion, modifying the document Quill Delta structure.
  - **Payload**: `{ "documentContent": { "ops": [...] } }`
  - **Response (200)**: `{ "suggestion": { ... status: "ACCEPTED" }, "document": { ... } }`

* **PUT `/suggestions/:documentId/:suggestionId/reject`** (Requires Token, Editor role minimum)
  - **Description**: Rejects and closes a suggestion without merging.
  - **Response (200)**: Suggestion object (`status: "REJECTED"`).

---

### Version Snapshots API (`/versions`)

* **GET `/versions/:documentId`** (Requires Token, Editor role minimum)
  - **Description**: Lists historical backups for the document.
  - **Response (200)**: Array of Version objects.

* **POST `/versions/:documentId`** (Requires Token, Editor role minimum)
  - **Description**: Creates a manually named version snapshot.
  - **Payload**: `{ "name": "Milestone v1" }`
  - **Response (201)**: Version snapshot object.

* **POST `/versions/:documentId/:versionId/restore`** (Requires Token, Editor role minimum)
  - **Description**: Restores the document contents to this snapshot.
  - **Response (200)**: `{ "message": "Version restored successfully", "content": { "ops": [...] } }`

---

### Sharing/Invites API (`/invites`)

* **POST `/invites`** (Requires Token, Owner/Editor role minimum)
  - **Description**: Creates a sharing invite link token.
  - **Payload**: `{ "documentId": "...", "email": "user@example.com", "role": "EDITOR" }`
  - **Response (200)**: `{ "invite": { ... }, "inviteLink": "http://localhost:5173/dashboard?invite=TOKEN" }`

* **POST `/invites/accept/:token`** (Requires Token)
  - **Description**: Redeems invite token, granting document access role to redeemer.
  - **Response (200)**: `{ "message": "Invitation accepted", "documentId": "..." }`

---

### Notifications API (`/notifications`)

* **GET `/notifications`** (Requires Token)
  - **Description**: Fetches recent real-time user notification logs.
  - **Response (200)**: Array of Notification objects.

* **PUT `/notifications/:id/read`** (Requires Token)
  - **Description**: Marks a notification as read.
  - **Response (200)**: Notification object.

---

### Activity Log API (`/activity`)

* **GET `/activity/:documentId`** (Requires Token)
  - **Description**: Retrieves audit activity log streams for a document.
  - **Response (200)**: Array of Activity objects.

---

## 2. SOCKET.IO EVENTS

Handshake requires setting a valid `token` in the `auth` socket configuration structure.

### Client-to-Server (Emit)
* **`join-document`**: Payload `{ "documentId": "..." }`. Registers socket to document room.
* **`leave-document`**: Payload `{ "documentId": "..." }`. Deregisters socket from room.
* **`send-changes`**: Payload `{ "documentId": "...", "delta": { ... } }`. Broadcasts document Quill Delta edits.
* **`cursor-move`**: Payload `{ "documentId": "...", "range": { "index": 0, "length": 0 } }`. Broadcasts user selection coordinates.

### Server-to-Client (Listen)
* **`presence-update`**: Broadcasts the updated array of active users in the room (`socketId`, `userId`, `username`, `avatarColor`, `range`).
* **`receive-changes`**: Broadcasts the emitted Quill Delta edits.
* **`cursor-update`**: Broadcasts the updated peer cursor parameters (`socketId`, `username`, `avatarColor`, `range`).

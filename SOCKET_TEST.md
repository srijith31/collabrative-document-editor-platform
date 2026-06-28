# Socket.io Smoke Test Instructions

This directory contains an automated smoke test script `server/tests/socketSmokeTest.js` to verify Socket.io websocket connection, authentication, room joining, presence updates, and edit channel broadcasts.

## Prerequisites

1. Ensure MongoDB is running locally.
2. Spin up the backend Express development server on port 5001:
   ```bash
   cd server
   npm run dev
   ```

## Running the Smoke Test

1. Open a new terminal session.
2. Execute the smoke test script:
   ```bash
   cd server
   npm run test:socket
   ```
   *Alternatively, run it directly via Node:*
   ```bash
   node tests/socketSmokeTest.js
   ```

## Test Flow

The automated script performs the following sequential actions:
1. Registers a new temporary test user via the REST API (`POST /api/auth/register`).
2. Creates a new document via the REST API (`POST /api/documents`).
3. Connects a `socket.io-client` instance with JWT authorization token payload.
4. Joins the dedicated document room (`join-document` event).
5. Asserts the server broadcasts the user's presence coordinates (`presence-update` event).
6. Emits a mock Quill Delta text change (`send-changes` event) to confirm websocket channels are active.
7. Gracefully disconnects client and exits.

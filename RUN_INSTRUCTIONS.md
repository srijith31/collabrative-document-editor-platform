# Local Run Instructions & Troubleshooting Guide

This manual covers the step-by-step instructions to run the Collaborative Document Editor locally and solve common developer issues.

---

## 1. Quickstart Run Instructions

### Prerequisites
- **NodeJS** (v18 or higher recommended).
- **MongoDB** (local server running on default port `27017` or a remote Atlas connection string).

---

### Step 1: Backend Server Setup
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Create a local `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Verify the `.env` settings. The default configuration uses **port `5001`** to prevent collisions with macOS AirPlay:
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/collab_doc_editor
   JWT_SECRET=super_secret_dev_key_12345
   CLIENT_URL=http://localhost:5173
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server is active when console logs print `Server running on port 5001` and `MongoDB Connected`.*

---

### Step 2: Frontend Client Setup
1. Open a new terminal session and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install the client dependencies:
   ```bash
   npm install
   ```
3. Create a local `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Configure the environment variables to point to the backend server URL (port `5001`):
   ```env
   VITE_API_URL=http://localhost:5001
   ```
5. Start the frontend developer server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to: **[http://localhost:5173/](http://localhost:5173/)**

---

## 2. Troubleshooting common issues

### Issue 1: Port `5000` is already in use (`EADDRINUSE`)
* **Cause**: On macOS Monterey and newer, the Apple **AirPlay Receiver** system service runs on port `5000` by default.
* **Solution**: 
  - Our project is pre-configured to use **port `5001`** to avoid this issue.
  - If you must use port `5000`, turn off AirPlay Receiver in system settings:
    - Navigate to **System Settings** -> **General** -> **AirDrop & Handoff**.
    - Toggle off the **AirPlay Receiver** switch.

---

### Issue 2: MongoDB connection fails (`MongooseError: MongoNetworkError`)
* **Cause**: The local MongoDB service is not started, or the connection URI is incorrect.
* **Solution**:
  - **macOS (Homebrew)**: Start the service via:
    ```bash
    brew services start mongodb-community
    ```
  - **Windows**: Check that the MongoDB service is running in `services.msc`.
  - Check the `MONGO_URI` value in `server/.env`. Try swapping `localhost` with `127.0.0.1` (e.g. `mongodb://127.0.0.1:27017/collab_doc_editor`) to resolve IPv6 routing lookup errors.

---

### Issue 3: CORS Errors or Socket Connection Failures
* **Cause**: Mismatched handshake URLs. The server blocks clients not matching the registered `CLIENT_URL` header.
* **Solution**:
  - In `server/.env`, verify `CLIENT_URL` matches exactly the domain and port where the frontend runs (typically `http://localhost:5173`).
  - In `client/.env`, verify `VITE_API_URL` points directly to the server (typically `http://localhost:5001`).

---

### Issue 4: Compilation fails on TypeScript configs
* **Cause**: Leftover TypeScript configurations from a previous structure.
* **Solution**:
  - This project has been migrated to pure JavaScript and JSX. Delete any duplicate TypeScript config files if present in the directories:
    ```bash
    rm client/tsconfig.json client/tsconfig.app.json client/tsconfig.node.json client/vite.config.ts
    ```
  - Use `npm run build` inside `client/` to verify bundling runs using pure Vite.

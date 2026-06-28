# Deployment Guide

This guide details the step-by-step instructions to deploy the production-ready MERN + Socket.io Collaborative Document Editor using **MongoDB Atlas** (Database), **Render** (Backend), and **Vercel** (Frontend).

---

## 1. MongoDB Atlas Setup

MongoDB Atlas is the cloud host for our database.

1. **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register.
2. **Create a Cluster**: 
   - Deploy a free-tier shared cluster (e.g. Shared M0 Cluster).
   - Select your preferred cloud provider (AWS, Google Cloud, or Azure) and region close to your target users.
3. **Database Access User Setup**:
   - Navigate to **Security** -> **Database Access** -> **Add New Database User**.
   - Select **Read and write to any database** privilege.
   - Choose **Password** authentication type, generate a secure password, and save the credentials.
4. **Network Access Setup (IP Allowlisting)**:
   - Navigate to **Security** -> **Network Access** -> **Add IP Address**.
   - Since Render and Vercel services allocate dynamic outbound IPs, add **`0.0.0.0/0`** (Allow access from anywhere). 
   - *Note: For tighter security, you can configure Render's static outbound IP settings if using a paid tier.*
5. **Get Connection String**:
   - Go to the Cluster **Database** dashboard and click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy the provided connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials.

---

## 2. Backend Deployment on Render

Render will host the Node/Express server and the Socket.io real-time websocket server.

1. **Prepare GitHub Repository**: Push the entire workspace repository containing both `client/` and `server/` directories to GitHub.
2. **Create Render Web Service**:
   - Connect your Render account to GitHub.
   - Click **New +** -> **Web Service**.
   - Select your document editor repository.
3. **Configure Service Settings**:
   - **Name**: `collab-doc-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. **Add Environment Variables**:
   Under the service configuration panel, navigate to **Environment** and add:
   - `PORT`: `10000` (Render default port override, if required)
   - `MONGO_URI`: *[Your MongoDB Atlas connection string]*
   - `JWT_SECRET`: *[A secure random string for signing JSON Web Tokens]*
   - `CLIENT_URL`: *[Your Vercel frontend app URL, e.g. `https://your-app.vercel.app`]*
5. **Deploy**:
   - Save variables and trigger deploy.
   - Once successful, copy the live URL of your Web Service (e.g., `https://collab-doc-backend.onrender.com`).

---

## 3. Frontend Deployment on Vercel

Vercel will build and host the static React/Vite application.

1. **Create Vercel Project**:
   - Go to [Vercel](https://vercel.com/) and sign in.
   - Click **Add New...** -> **Project**.
   - Select your document editor GitHub repository.
2. **Configure Monorepo Settings**:
   - In the project setup, click edit next to **Root Directory** and select the **`client`** folder.
   - Click **Framework Preset** and select **Vite**.
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
3. **Configure SPA Routing (Client Rewrites)**:
   - The repository includes a `client/vercel.json` config. Vercel automatically reads this file to route browser requests to `/index.html` allowing `react-router-dom` to handle internal paths cleanly.
4. **Add Environment Variables**:
   Under **Environment Variables**, configure the API pointer variable:
   - **Key**: `VITE_API_URL`
   - **Value**: *[Your Render backend service URL copied in section 2, e.g. `https://collab-doc-backend.onrender.com`]*
5. **Deploy**:
   - Click **Deploy**. Vercel will install dependencies, build the assets, and publish your site.
   - Copy the live deployment URL and update the `CLIENT_URL` env variable on Render to match this address for CORS validation.

import { io } from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5001';

async function runSmokeTest() {
  console.log('--- Starting Socket.io Smoke Test ---');
  console.log(`Connecting to backend at ${BACKEND_URL}...`);

  try {
    // 1. Register a test user
    console.log('1. Registering test user...');
    const registerRes = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      username: `socketUser_${Date.now()}`,
      email: `socket_${Date.now()}@example.com`,
      password: 'password123'
    });
    const { token, _id } = registerRes.data;
    console.log(`User registered successfully. ID: ${_id}`);

    // 2. Create a document
    console.log('2. Creating document...');
    const createDocRes = await axios.post(`${BACKEND_URL}/api/documents`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const documentId = createDocRes.data._id;
    console.log(`Document created successfully. ID: ${documentId}`);

    // 3. Connect Socket.io client
    console.log('3. Connecting Socket.io client...');
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully! Handshake ID:', socket.id);

      // 4. Join document room
      console.log('4. Joining document room...');
      socket.emit('join-document', { documentId });
    });

    socket.on('presence-update', (presence) => {
      console.log('5. Received presence update from server:', presence);
      expectPresenceReceived(presence, socket, documentId);
    });

    let presenceTimeout = setTimeout(() => {
      console.error('FAIL: Timeout waiting for presence update.');
      socket.disconnect();
      process.exit(1);
    }, 5000);

    function expectPresenceReceived(presence, socket, documentId) {
      clearTimeout(presenceTimeout);
      if (presence && presence.length > 0) {
        console.log('SUCCESS: Websocket connection and room joining verified!');

        // 6. Test delta changes emit
        console.log('6. Emitting test changes...');
        socket.emit('send-changes', {
          documentId,
          delta: { ops: [{ insert: 'Hello websocket!' }] }
        });

        setTimeout(() => {
          console.log('7. Disconnecting socket...');
          socket.disconnect();
          console.log('--- Socket.io Smoke Test Passed successfully! ---');
          process.exit(0);
        }, 1000);
      } else {
        console.error('FAIL: Presence list is empty.');
        socket.disconnect();
        process.exit(1);
      }
    }

    socket.on('connect_error', (err) => {
      console.error('FAIL: Socket connection error:', err.message);
      process.exit(1);
    });

  } catch (err) {
    console.error('FAIL: REST step failed:', err.message);
    process.exit(1);
  }
}

runSmokeTest();

const app = require('./app');
const { port } = require('./config');
const { initializeSocket } = require('./socket/socket');
const http = require('http');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔌 WebSocket server ready`);
});
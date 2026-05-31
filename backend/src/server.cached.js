const app = require('./app.cached');
const { port } = require('./config');
const { initializeSocket } = require('./socket/socket');
const { cache } = require('./config/redis');
const http = require('http');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Cache monitoring function
const monitorCache = async () => {
  try {
    const info = await cache.info();
    if (info) {
      const lines = info.split('\n');
      const stats = {};
      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key.trim()] = value.trim();
        }
      });
      
      console.log('📊 Redis Cache Stats:');
      console.log(`  • Connected clients: ${stats.connected_clients || 'N/A'}`);
      console.log(`  • Used memory: ${stats.used_memory_human || 'N/A'}`);
      console.log(`  • Total commands processed: ${stats.total_commands_processed || 'N/A'}`);
      console.log(`  • Keyspace hits: ${stats.keyspace_hits || 'N/A'}`);
      console.log(`  • Keyspace misses: ${stats.keyspace_misses || 'N/A'}`);
      
      const hitRate = stats.keyspace_hits && stats.keyspace_misses 
        ? (parseInt(stats.keyspace_hits) / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses)) * 100).toFixed(2)
        : 'N/A';
      console.log(`  • Cache hit rate: ${hitRate}%`);
    }
  } catch (err) {
    console.error('❌ Cache monitoring error:', err.message);
  }
};

// Start cache monitoring interval (every 5 minutes)
setInterval(monitorCache, 5 * 60 * 1000);

// Initial cache monitoring
monitorCache();

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📊 Redis caching enabled for all modules`);
  console.log(`📈 Cache monitoring active (5 minute intervals)`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  console.log('📊 Final cache stats:');
  await monitorCache();
  process.exit(0);
});
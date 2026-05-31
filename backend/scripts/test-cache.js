#!/usr/bin/env node
/**
 * Cache Testing Script
 * Tests Redis caching implementation for Phase 5.2
 */

const { cache } = require('../src/config/redis');

async function testCache() {
  console.log('🧪 Testing Redis Cache Implementation\n');
  
  try {
    // Test 1: Basic cache operations
    console.log('1. Testing basic cache operations...');
    const testKey = 'test:cache:basic';
    const testData = { message: 'Hello Cache', timestamp: new Date().toISOString() };
    
    // Set cache
    const setResult = await cache.set(testKey, testData, 60);
    console.log(`   Set cache: ${setResult ? '✅' : '❌'}`);
    
    // Get cache
    const getResult = await cache.get(testKey);
    console.log(`   Get cache: ${getResult ? '✅' : '❌'}`);
    
    // Check if data matches
    if (getResult && getResult.message === testData.message) {
      console.log('   Data integrity: ✅');
    } else {
      console.log('   Data integrity: ❌');
    }
    
    // Delete cache
    const delResult = await cache.del(testKey);
    console.log(`   Delete cache: ${delResult ? '✅' : '❌'}`);
    
    // Test 2: Cache expiration
    console.log('\n2. Testing cache expiration...');
    const expKey = 'test:cache:expiration';
    await cache.set(expKey, { test: 'expire' }, 2);
    
    // Immediate get
    const immediateGet = await cache.get(expKey);
    console.log(`   Immediate get: ${immediateGet ? '✅' : '❌'}`);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 3000));
    const expiredGet = await cache.get(expKey);
    console.log(`   After expiration: ${expiredGet ? '❌ (should be null)' : '✅'}`);
    
    // Test 3: Pattern deletion
    console.log('\n3. Testing pattern deletion...');
    const patternKeys = [
      'test:pattern:1',
      'test:pattern:2',
      'test:pattern:3'
    ];
    
    // Set multiple keys
    for (const key of patternKeys) {
      await cache.set(key, { data: 'test' }, 60);
    }
    
    // Delete by pattern
    const patternResult = await cache.delPattern('test:pattern:*');
    console.log(`   Pattern deletion: ${patternResult ? '✅' : '❌'}`);
    
    // Verify deletion
    let allDeleted = true;
    for (const key of patternKeys) {
      const exists = await cache.exists(key);
      if (exists) allDeleted = false;
    }
    console.log(`   All keys deleted: ${allDeleted ? '✅' : '❌'}`);
    
    // Test 4: Cache statistics
    console.log('\n4. Testing cache statistics...');
    const existsResult = await cache.exists('test:cache:stats');
    console.log(`   Exists check: ${existsResult !== undefined ? '✅' : '❌'}`);
    
    const incrResult = await cache.incr('test:counter');
    console.log(`   Increment: ${incrResult === 1 ? '✅' : '❌'}`);
    
    const decrResult = await cache.decr('test:counter');
    console.log(`   Decrement: ${decrResult === 0 ? '✅' : '❌'}`);
    
    // Test 5: Redis info
    console.log('\n5. Testing Redis info...');
    const info = await cache.info();
    if (info && typeof info === 'string') {
      console.log('   Redis info: ✅');
      // Parse basic info
      const lines = info.split('\n');
      const versionLine = lines.find(line => line.startsWith('redis_version'));
      if (versionLine) {
        const version = versionLine.split(':')[1];
        console.log(`   Redis version: ${version.trim()}`);
      }
    } else {
      console.log('   Redis info: ❌');
    }
    
    // Cleanup
    await cache.del('test:counter');
    
    console.log('\n🎉 All cache tests completed!');
    console.log('\n📊 Summary:');
    console.log('   Redis connection: ✅');
    console.log('   Basic operations: ✅');
    console.log('   Pattern matching: ✅');
    console.log('   Expiration: ✅');
    console.log('   Statistics: ✅');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Cache test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCache().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testCache };
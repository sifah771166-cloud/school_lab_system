#!/usr/bin/env node
/**
 * API Performance Testing Script
 * Tests API endpoints with and without caching
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';
const TEST_ENDPOINTS = [
  '/departments',
  '/labs',
  '/items',
  '/schedules',
  '/attendance',
  '/loans',
  '/notifications',
  '/search',
  '/audit',
  '/analytics/overview'
];

async function makeRequest(endpoint, useCache = true) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    const startTime = Date.now();
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            duration,
            statusCode: res.statusCode,
            data: jsonData,
            endpoint
          });
        } catch (error) {
          resolve({
            success: false,
            duration,
            statusCode: res.statusCode,
            error: error.message,
            endpoint
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message,
        endpoint
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout',
        endpoint
      });
    });
  });
}

async function testEndpointPerformance(endpoint) {
  console.log(`\n🔍 Testing: ${endpoint}`);
  
  const results = {
    firstCall: null,
    secondCall: null,
    cachedCall: null
  };
  
  try {
    // First call (cold cache)
    console.log('  1. First call (cold cache)...');
    results.firstCall = await makeRequest(endpoint);
    console.log(`     Duration: ${results.firstCall.duration}ms`);
    
    // Second call (warm cache)
    console.log('  2. Second call (warm cache)...');
    results.secondCall = await makeRequest(endpoint);
    console.log(`     Duration: ${results.secondCall.duration}ms`);
    
    // Calculate improvement
    if (results.firstCall.success && results.secondCall.success) {
      const improvement = ((results.firstCall.duration - results.secondCall.duration) / results.firstCall.duration * 100).toFixed(2);
      console.log(`    Improvement: ${improvement}% faster`);
      
      if (parseFloat(improvement) > 50) {
        console.log('    ✅ Significant cache improvement detected');
      } else if (parseFloat(improvement) > 20) {
        console.log('    ⚠️ Moderate cache improvement');
      } else {
        console.log('    ❌ Minimal cache improvement');
      }
    }
    
    return results;
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.error || error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 API Cache Performance Testing\n');
  console.log('=' .repeat(50));
  
  const allResults = [];
  let totalImprovement = 0;
  let successfulTests = 0;
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpointPerformance(endpoint);
    
    if (result && result.firstCall && result.secondCall) {
      if (result.firstCall.success && result.secondCall.success) {
        const improvement = ((result.firstCall.duration - result.secondCall.duration) / result.firstCall.duration * 100);
        totalImprovement += improvement;
        successfulTests++;
        
        allResults.push({
          endpoint,
          firstCall: result.firstCall.duration,
          secondCall: result.secondCall.duration,
          improvement: improvement.toFixed(2) + '%',
          status: '✅'
        });
      } else {
        allResults.push({
          endpoint,
          firstCall: result.firstCall?.duration || 'N/A',
          secondCall: result.secondCall?.duration || 'N/A',
          improvement: 'N/A',
          status: '❌'
        });
      }
    } else {
      allResults.push({
        endpoint,
        firstCall: 'N/A',
        secondCall: 'N/A',
        improvement: 'N/A',
        status: '❌'
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  console.log('\nEndpoint Performance:');
  console.log('─'.repeat(80));
  console.log('Endpoint'.padEnd(25) + 'First Call'.padEnd(12) + 'Second Call'.padEnd(12) + 'Improvement'.padEnd(15) + 'Status');
  console.log('─'.repeat(80));
  
  allResults.forEach(result => {
    console.log(
      result.endpoint.padEnd(25) +
      (result.firstCall === 'N/A' ? 'N/A'.padEnd(12) : `${result.firstCall}ms`.padEnd(12)) +
      (result.secondCall === 'N/A' ? 'N/A'.padEnd(12) : `${result.secondCall}ms`.padEnd(12)) +
      result.improvement.padEnd(15) +
      result.status
    );
  });
  
  console.log('─'.repeat(80));
  
  if (successfulTests > 0) {
    const avgImprovement = (totalImprovement / successfulTests).toFixed(2);
    console.log(`\n📈 Average Improvement: ${avgImprovement}%`);
    console.log(`✅ Successful Tests: ${successfulTests}/${TEST_ENDPOINTS.length}`);
    
    if (parseFloat(avgImprovement) > 50) {
      console.log('🎉 Excellent cache performance!');
    } else if (parseFloat(avgImprovement) > 30) {
      console.log('👍 Good cache performance');
    } else {
      console.log('⚠️ Cache performance needs improvement');
    }
  } else {
    console.log('\n❌ No successful tests completed');
  }
  
  // Test cache status endpoint
  console.log('\n' + '=' .repeat(50));
  console.log('🔧 Cache Status Test');
  console.log('=' .repeat(50));
  
  try {
    const cacheStatus = await makeRequest('/cache/status');
    if (cacheStatus.success) {
      console.log('✅ Cache status endpoint working');
      console.log(`   Status: ${cacheStatus.data.status}`);
      console.log(`   Redis: ${cacheStatus.data.redis}`);
    } else {
      console.log('❌ Cache status endpoint failed');
    }
  } catch (error) {
    console.log('❌ Cache status endpoint unavailable');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Testing Complete');
  console.log('=' .repeat(50));
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Check if server is running
  console.log('⚠️ Note: Make sure the server is running before testing');
  console.log('   Run: npm run dev:cached\n');
  
  // Ask for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Is the server running? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await runAllTests();
    } else {
      console.log('Please start the server first: npm run dev:cached');
    }
    readline.close();
    process.exit(0);
  });
}

module.exports = { testEndpointPerformance, runAllTests };
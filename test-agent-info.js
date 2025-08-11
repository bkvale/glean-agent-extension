#!/usr/bin/env node

/**
 * Test script to check agent details and schemas
 */

const https = require('https');

const CONFIG = {
  GLEAN_INSTANCE: process.env.GLEAN_INSTANCE || 'trace3',
  GLEAN_BASE_URL: process.env.GLEAN_BASE_URL || `${process.env.GLEAN_INSTANCE || 'trace3'}-be.glean.com`,
  GLEAN_AGENT_ID: process.env.GLEAN_AGENT_ID || '5057a8a588c649d6b1231d648a9167c8',
  GLEAN_API_TOKEN: process.env.GLEAN_API_TOKEN || 'lGOIFZqCsxd6fEfW8Px+zQfcw08irSV8XDL1tIJLj/0='
};

console.log('🔍 Glean Agent Info Test');
console.log('========================');
console.log(`Instance: ${CONFIG.GLEAN_INSTANCE}`);
console.log(`Base URL: ${CONFIG.GLEAN_BASE_URL}`);
console.log(`Agent ID: ${CONFIG.GLEAN_AGENT_ID}`);
console.log(`Token: ${CONFIG.GLEAN_API_TOKEN.substring(0, 10)}...`);
console.log('');

// Test 1: Get agent details
async function getAgentDetails() {
  console.log('📋 Getting agent details...');
  
  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}`,
    method: 'GET',
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`📥 HTTP ${res.statusCode} received`);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(responseData);
            console.log('✅ Agent details retrieved');
            console.log(`📋 Agent name: ${data.name || 'Unknown'}`);
            console.log(`📋 Agent description: ${data.description || 'No description'}`);
            console.log(`📋 Agent status: ${data.status || 'Unknown'}`);
            resolve(data);
          } catch (error) {
            console.log('❌ Parse error:', error.message);
            reject(error);
          }
        } else {
          console.log(`❌ HTTP error: ${res.statusCode}`);
          console.log(`📝 Response: ${responseData.substring(0, 200)}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test 2: Get agent schemas
async function getAgentSchemas() {
  console.log('\n📋 Getting agent schemas...');
  
  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/schemas`,
    method: 'GET',
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`📥 HTTP ${res.statusCode} received`);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(responseData);
            console.log('✅ Agent schemas retrieved');
            console.log(`📋 Input schema:`, JSON.stringify(data.inputSchema || {}, null, 2));
            console.log(`📋 Output schema:`, JSON.stringify(data.outputSchema || {}, null, 2));
            resolve(data);
          } catch (error) {
            console.log('❌ Parse error:', error.message);
            reject(error);
          }
        } else {
          console.log(`❌ HTTP error: ${res.statusCode}`);
          console.log(`📝 Response: ${responseData.substring(0, 200)}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Main execution
async function main() {
  try {
    // Test agent details
    const agentDetails = await getAgentDetails();
    
    // Test agent schemas
    const agentSchemas = await getAgentSchemas();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('Agent is valid and accessible.');
    
  } catch (error) {
    console.log('\n💥 Test failed!');
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 
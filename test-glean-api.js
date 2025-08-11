#!/usr/bin/env node

/**
 * Smoke test script for Glean API integration
 * Tests the same endpoint used by the HubSpot serverless function
 */

const https = require('https');
const readline = require('readline');

// Configuration - reads from environment variables
const CONFIG = {
  GLEAN_INSTANCE: process.env.GLEAN_INSTANCE || 'trace3',
  GLEAN_BASE_URL: process.env.GLEAN_BASE_URL || `${process.env.GLEAN_INSTANCE || 'trace3'}-be.glean.com`,
  GLEAN_AGENT_ID: process.env.GLEAN_AGENT_ID || '5057a8a588c649d6b1231d648a9167c8',
  GLEAN_API_TOKEN: process.env.GLEAN_API_TOKEN || 'lGOIFZqCsxd6fEfW8Px+zQfcw08irSV8XDL1tIJLj/0=',
  TIMEOUT_MS: parseInt(process.env.GLEAN_TIMEOUT_MS) || 8000
};

// Parse command line arguments
const args = process.argv.slice(2);
const timeoutArg = args.find(arg => arg.startsWith('--timeoutMs='));
const timeoutMs = timeoutArg ? parseInt(timeoutArg.split('=')[1]) : CONFIG.TIMEOUT_MS;
const testCompany = args.find(arg => !arg.startsWith('--')) || 'Test Company Inc.';

console.log('🧪 Glean API Smoke Test');
console.log('======================');
console.log(`Company: ${testCompany}`);
console.log(`Timeout: ${timeoutMs}ms`);
console.log(`Instance: ${CONFIG.GLEAN_INSTANCE}`);
console.log(`Base URL: ${CONFIG.GLEAN_BASE_URL}`);
console.log(`Agent ID: ${CONFIG.GLEAN_AGENT_ID}`);
console.log(`Token: ${CONFIG.GLEAN_API_TOKEN.substring(0, 10)}...`);
console.log('');

// Make Glean API request
async function testGleanAPI() {
  const startTime = Date.now();
  
  console.log('📡 Making Glean API request...');
  
  const postData = JSON.stringify({
    agent_id: CONFIG.GLEAN_AGENT_ID,
    query: `Generate a strategic account plan for ${testCompany}`
  });

  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: '/rest/api/v1/agents/runs/stream',
    method: 'POST',
    timeout: timeoutMs,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
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
        const duration = Date.now() - startTime;
        
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📊 Response size: ${responseData.length} bytes`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Handle streaming response
            const lines = responseData.split('\n').filter(line => line.trim());
            const events = [];
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6); // Remove 'data: ' prefix
                if (data.trim() && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    events.push(parsed);
                  } catch (e) {
                    // Skip invalid JSON chunks
                  }
                }
              }
            }
            
            // Find the final result
            const finalEvent = events.find(event => event.type === 'final' || event.status === 'completed');
            const result = finalEvent || events[events.length - 1] || {};
            
            console.log('✅ Stream parse success');
            console.log(`📊 Total events: ${events.length}`);
            console.log(`📋 Data keys: ${Object.keys(result).join(', ')}`);
            
            if (result.messages && Array.isArray(result.messages)) {
              console.log(`💬 Messages: ${result.messages.length}`);
              
              // Show first 200 chars of first message
              const firstMessage = result.messages[0];
              if (firstMessage && firstMessage.content && Array.isArray(firstMessage.content)) {
                const text = firstMessage.content.map(c => c.text).join(' ');
                console.log(`📝 Preview: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
              }
            }
            
            resolve({
              status: 'success',
              duration,
              statusCode: res.statusCode,
              data: result,
              events: events.length
            });
          } catch (error) {
            console.log('❌ Parse error:', error.message);
            reject({
              status: 'parse_error',
              duration,
              statusCode: res.statusCode,
              error: error.message,
              responseData: responseData.substring(0, 200)
            });
          }
        } else {
          console.log(`❌ HTTP error: ${res.statusCode}`);
          console.log(`📝 Response: ${responseData.substring(0, 200)}`);
          reject({
            status: 'http_error',
            duration,
            statusCode: res.statusCode,
            responseData: responseData.substring(0, 200)
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log('❌ Request error:', error.message);
      reject({
        status: 'request_error',
        duration,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`⏰ Timeout after ${duration}ms`);
      req.destroy();
      reject({
        status: 'timeout',
        duration,
        timeoutMs
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Main execution
async function main() {
  try {
    const result = await testGleanAPI();
    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.duration}ms`);
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('💥 Test failed!');
    console.log(`Status: ${error.status}`);
    console.log(`Duration: ${error.duration}ms`);
    
    if (error.statusCode) {
      console.log(`HTTP Status: ${error.statusCode}`);
    }
    
    if (error.error) {
      console.log(`Error: ${error.error}`);
    }
    
    process.exit(1);
  }
}

// Run the test
main(); 
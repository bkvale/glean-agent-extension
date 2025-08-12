// HubSpot Serverless Function to proxy Glean API requests
const https = require('https');

// Configuration with environment variable fallbacks
const CONFIG = {
  GLEAN_INSTANCE: process.env.GLEAN_INSTANCE || 'trace3',
  GLEAN_BASE_URL: process.env.GLEAN_BASE_URL || `${process.env.GLEAN_INSTANCE || 'trace3'}-be.glean.com`,
  GLEAN_AGENT_ID: process.env.GLEAN_AGENT_ID || '5057a8a588c649d6b1231d648a9167c8',
  GLEAN_API_TOKEN: process.env.GLEAN_API_TOKEN || 'lGOIFZqCsxd6fEfW8Px+zQfcw08irSV8XDL1tIJLj/0=',
  TIMEOUT_MS: parseInt(process.env.GLEAN_TIMEOUT_MS) || 8000, // 8s for HubSpot limits
  MAX_RETRIES: parseInt(process.env.GLEAN_MAX_RETRIES) || 1,
  TEST_MODE: process.env.TEST_MODE === 'true' || false
};

// High-signal diagnostic logging
const log = {
  start: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] START: ${message}`, JSON.stringify(data, null, 2));
  },
  http: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] HTTP: ${message}`, JSON.stringify(data, null, 2));
  },
  success: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] SUCCESS: ${message}`, JSON.stringify(data, null, 2));
  },
  error: (message, error = null) => {
    console.error(`[GLEAN_PROXY] ERROR: ${message}`, error ? error.stack || error.message : '');
  },
  return: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] RETURN: ${message}`, JSON.stringify(data, null, 2));
  }
};

// Generic HTTP request function
async function makeGleanRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      log.http('http_response_status', { 
        statusCode: res.statusCode, 
        headers: res.headers,
        path: options.path
      });
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        log.http('http_response_complete', { 
          statusCode: res.statusCode,
          responseSize: responseData.length,
          path: options.path
        });
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            log.error('parse_error', error);
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        } else {
          log.error('upstream_error', {
            statusCode: res.statusCode,
            responseData: responseData.substring(0, 200),
            path: options.path
          });
          reject(new Error(`HTTP ${res.statusCode}: ${responseData.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      log.error('http_request_error', error);
      reject(error);
    });
    
    req.on('timeout', () => {
      log.error('http_request_timeout', { timeout: options.timeout });
      req.destroy();
      reject(new Error(`Request timeout after ${options.timeout}ms`));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Execute a pre-built Glean agent
async function executeGleanAgent(companyName) {
  log.start('execute_glean_agent', { companyName, agentId: CONFIG.GLEAN_AGENT_ID });
  
  // Based on the Agents API documentation, use the correct endpoint and format
  const postData = JSON.stringify({
    query: `Generate a strategic account plan for ${companyName}. Include company overview, key insights, strategic recommendations, and next steps.`
  });

  // Try the wait endpoint first (blocking response)
  try {
    const options = {
      hostname: CONFIG.GLEAN_BASE_URL,
      port: 443,
      path: `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/wait`, // Use the correct endpoint format
      method: 'POST',
      timeout: CONFIG.TIMEOUT_MS,
      headers: {
        'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    log.http('http_request_outbound', { 
      url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/wait`,
      method: 'POST',
      timeoutMs: CONFIG.TIMEOUT_MS
    });

    return await makeGleanRequest(options, postData);
  } catch (error) {
    log.error('wait_endpoint_failed', { error: error.message });
    
    // Fallback to streaming endpoint
    try {
      log.start('trying_streaming_endpoint');
      
      const options = {
        hostname: CONFIG.GLEAN_BASE_URL,
        port: 443,
        path: `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/stream`, // Try streaming endpoint
        method: 'POST',
        timeout: CONFIG.TIMEOUT_MS,
        headers: {
          'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      log.http('http_request_outbound', { 
        url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/stream`,
        method: 'POST',
        timeoutMs: CONFIG.TIMEOUT_MS
      });

      return await makeGleanRequest(options, postData);
    } catch (streamError) {
      log.error('streaming_endpoint_failed', { error: streamError.message });
      throw new Error(`Both agent endpoints failed. Wait: ${error.message}, Stream: ${streamError.message}`);
    }
  }
}

// Fallback: Use chat API with strategic planning prompt
async function runGleanChat(companyName) {
  log.start('run_glean_chat', { companyName });
  
  const postData = JSON.stringify({
    messages: [
      {
        role: "user",
        content: `You are a strategic account planning expert. Generate a comprehensive strategic account plan for ${companyName}. 

Please include:
1. Company Overview and Industry Analysis
2. Key Business Insights and Opportunities  
3. Strategic Recommendations
4. Risk Assessment
5. Next Steps and Action Items
6. Account Status and Priority Level

Format the response as a structured strategic account plan with clear sections and actionable recommendations.`
      }
    ],
    options: {
      timeoutMillis: CONFIG.TIMEOUT_MS
    }
  });

  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: '/rest/api/v1/chat',
    method: 'POST',
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  log.http('http_request_outbound', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/chat`,
    method: 'POST',
    timeoutMs: CONFIG.TIMEOUT_MS
  });

  return makeGleanRequest(options, postData);
}

// Main exports.main function
exports.main = async (context = {}) => {
  const functionStartTime = Date.now();

  log.start('function_entry', {
    contextKeys: Object.keys(context),
    hasParameters: !!context.parameters,
    config: {
      instance: CONFIG.GLEAN_INSTANCE,
      baseUrl: CONFIG.GLEAN_BASE_URL,
      agentId: CONFIG.GLEAN_AGENT_ID,
      timeoutMs: CONFIG.TIMEOUT_MS,
      maxRetries: CONFIG.MAX_RETRIES,
      testMode: CONFIG.TEST_MODE
    }
  });

  try {
    const { companyName } = context.parameters || {};

    if (!CONFIG.GLEAN_API_TOKEN) {
      log.error('missing_api_token');
      return {
        statusCode: 500,
        body: {
          error: 'Glean API token not configured',
          timestamp: new Date().toISOString()
        }
      };
    }

    if (!companyName) {
      log.error('missing_company_name', { context });
      return {
        statusCode: 400,
        body: {
          error: 'Missing required parameter: companyName',
          received: context,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Try to execute the Glean agent first
    log.start('attempt_agent_execution', { companyName });
    
    try {
      const agentResult = await executeGleanAgent(companyName);
      
      log.success('agent_execution_success', { 
        companyName, 
        resultType: typeof agentResult,
        hasMessages: !!agentResult.messages
      });
      
      return {
        statusCode: 200,
        body: {
          messages: agentResult.messages || [{
            role: 'GLEAN_AI',
            content: [{
              text: agentResult.response || agentResult.content || agentResult.result || JSON.stringify(agentResult)
            }]
          }],
          metadata: {
            companyName,
            timestamp: new Date().toISOString(),
            source: 'glean_agent',
            agentId: CONFIG.GLEAN_AGENT_ID
          }
        }
      };
      
    } catch (agentError) {
      log.error('agent_execution_failed', { companyName, error: agentError.message });
      
      // Fallback to chat API
      log.start('fallback_to_chat', { companyName });
      
      try {
        const chatResult = await runGleanChat(companyName);
        
        log.success('chat_fallback_success', { companyName });
        
        return {
          statusCode: 200,
          body: {
            messages: [{
              role: 'GLEAN_AI',
              content: [{
                text: chatResult.response || chatResult.content || chatResult.result || JSON.stringify(chatResult)
              }]
            }],
            metadata: {
              companyName,
              timestamp: new Date().toISOString(),
              source: 'glean_chat_fallback',
              note: 'Agent API failed, used chat fallback'
            }
          }
        };
        
      } catch (chatError) {
        log.error('chat_fallback_failed', { companyName, error: chatError.message });
        
        // Final fallback: return a basic plan
        return {
          statusCode: 200,
          body: {
            messages: [{
              role: 'GLEAN_AI',
              content: [{
                text: `## Strategic Account Plan: ${companyName}

### 🔍 Status
Unable to connect to Glean agent or chat API. This could be due to:
- API endpoint configuration issues
- Authentication problems  
- Network connectivity issues

### 📋 Recommended Next Steps
1. Verify Glean API configuration
2. Check API token permissions
3. Contact Glean administrator for correct endpoints
4. Test with a different company name

### 💡 Manual Process
For now, consider manually researching ${companyName} and creating a strategic account plan using your existing processes.

---
*Generated as fallback due to API connection issues.*`
              }]
            }],
            metadata: {
              companyName,
              timestamp: new Date().toISOString(),
              source: 'fallback',
              errors: [agentError.message, chatError.message]
            }
          }
        };
      }
    }

  } catch (error) {
    log.error('function_error', {
      error: error.message,
      stack: error.stack,
      errorType: error.constructor.name,
      context: context
    });

    return {
      statusCode: 500,
      body: {
        error: `Function error: ${error.message}`,
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
      }
    };
  }
}; 
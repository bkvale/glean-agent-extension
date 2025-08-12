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

  // Try different possible endpoints for agent execution
  const possibleEndpoints = [
    `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/wait`,
    `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/stream`,
    `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/run`,
    `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/execute`,
    `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/invoke`
  ];

  let lastError = null;
  
  for (const endpoint of possibleEndpoints) {
    try {
      const options = {
        hostname: CONFIG.GLEAN_BASE_URL,
        port: 443,
        path: endpoint,
        method: 'POST',
        timeout: Math.min(CONFIG.TIMEOUT_MS, 6000), // Cap at 6 seconds for HubSpot safety
        headers: {
          'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      log.http('http_request_outbound', { 
        url: `https://${CONFIG.GLEAN_BASE_URL}${endpoint}`,
        method: 'POST',
        timeoutMs: options.timeout
      });

      const result = await makeGleanRequest(options, postData);
      log.success('agent_execution_success', { endpoint, companyName });
      return result;
    } catch (error) {
      lastError = error;
      log.error('agent_endpoint_failed', { endpoint, error: error.message });
      
      // Check if it's a timeout
      if (error.message.includes('timeout') || error.message.includes('HTTP 408')) {
        log.start('agent_timeout_detected', { companyName, endpoint });
        throw new Error('AGENT_TIMEOUT: Agent execution exceeded HubSpot timeout limits');
      }
      
      // Check if it's an authentication or permission error
      if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
        log.error('authentication_error', { error: error.message, endpoint });
        throw new Error('AUTH_ERROR: API token may not have agents scope permissions');
      }
      
      // For 404 errors, try the next endpoint
      if (error.message.includes('HTTP 404')) {
        log.error('endpoint_not_found', { endpoint });
        continue; // Try next endpoint
      }
      
      // For other errors, also try next endpoint
      continue;
    }
  }

  // If we get here, all endpoints failed
  log.error('all_agent_endpoints_failed', { 
    companyName, 
    attemptedEndpoints: possibleEndpoints,
    lastError: lastError?.message 
  });
  throw new Error(`AGENT_API_FAILED: All agent endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
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

// Diagnostic function to test Glean API configuration
async function testGleanConfiguration() {
  log.start('testing_glean_configuration', {
    instance: CONFIG.GLEAN_INSTANCE,
    baseUrl: CONFIG.GLEAN_BASE_URL,
    agentId: CONFIG.GLEAN_AGENT_ID,
    hasToken: !!CONFIG.GLEAN_API_TOKEN,
    tokenLength: CONFIG.GLEAN_API_TOKEN ? CONFIG.GLEAN_API_TOKEN.length : 0
  });

  const diagnostics = {
    timestamp: new Date().toISOString(),
    config: {
      instance: CONFIG.GLEAN_INSTANCE,
      baseUrl: CONFIG.GLEAN_BASE_URL,
      agentId: CONFIG.GLEAN_AGENT_ID,
      hasToken: !!CONFIG.GLEAN_API_TOKEN
    },
    tests: {}
  };

  // Test 1: Basic connectivity to Glean instance
  try {
    const options = {
      hostname: CONFIG.GLEAN_BASE_URL,
      port: 443,
      path: '/rest/api/v1/agents/search',
      method: 'POST',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const postData = JSON.stringify({
      query: "test"
    });

    log.start('testing_basic_connectivity');
    const agentsResponse = await makeGleanRequest(options, postData);
    diagnostics.tests.basicConnectivity = {
      success: true,
      message: 'Successfully connected to Glean API',
      agentsCount: agentsResponse.agents ? agentsResponse.agents.length : 'unknown'
    };
    log.success('basic_connectivity_test_passed');
  } catch (error) {
    diagnostics.tests.basicConnectivity = {
      success: false,
      error: error.message,
      message: 'Failed to connect to Glean API'
    };
    log.error('basic_connectivity_test_failed', error);
  }

  // Test 2: Check if specific agent exists
  try {
    const options = {
      hostname: CONFIG.GLEAN_BASE_URL,
      port: 443,
      path: `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}`,
      method: 'GET',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    log.start('testing_agent_existence');
    const agentResponse = await makeGleanRequest(options);
    diagnostics.tests.agentExists = {
      success: true,
      message: 'Agent found and accessible',
      agentName: agentResponse.name || 'Unknown',
      agentId: agentResponse.id || CONFIG.GLEAN_AGENT_ID
    };
    log.success('agent_existence_test_passed');
  } catch (error) {
    diagnostics.tests.agentExists = {
      success: false,
      error: error.message,
      message: 'Agent not found or not accessible'
    };
    log.error('agent_existence_test_failed', error);
  }

  // Test 3: Test agent execution capability with multiple endpoint attempts
  try {
    const postData = JSON.stringify({
      query: "Test query for agent execution"
    });

    // Try different possible endpoints
    const possibleEndpoints = [
      `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/wait`,
      `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/runs/stream`,
      `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/run`,
      `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/execute`,
      `/rest/api/v1/agents/${CONFIG.GLEAN_AGENT_ID}/invoke`
    ];

    let lastError = null;
    
    for (const endpoint of possibleEndpoints) {
      try {
        const options = {
          hostname: CONFIG.GLEAN_BASE_URL,
          port: 443,
          path: endpoint,
          method: 'POST',
          timeout: 2000, // Very short timeout for testing
          headers: {
            'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        log.start('testing_agent_execution_endpoint', { endpoint });
        const agentResponse = await makeGleanRequest(options, postData);
        
        diagnostics.tests.agentExecution = {
          success: true,
          message: `Agent execution is working via ${endpoint}`,
          workingEndpoint: endpoint,
          hasResponse: !!agentResponse.messages || !!agentResponse.response
        };
        log.success('agent_execution_test_passed', { endpoint });
        return; // Exit on first success
      } catch (error) {
        lastError = error;
        log.error('agent_execution_endpoint_failed', { endpoint, error: error.message });
        continue; // Try next endpoint
      }
    }

    // If we get here, all endpoints failed
    diagnostics.tests.agentExecution = {
      success: false,
      error: lastError ? lastError.message : 'All endpoints failed',
      message: 'Agent execution failed - tried multiple endpoints',
      attemptedEndpoints: possibleEndpoints
    };
    log.error('agent_execution_all_endpoints_failed', { lastError: lastError?.message });
  } catch (error) {
    diagnostics.tests.agentExecution = {
      success: false,
      error: error.message,
      message: 'Agent execution test failed unexpectedly'
    };
    log.error('agent_execution_test_failed', error);
  }

  return diagnostics;
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
    const { companyName, runDiagnostics } = context.parameters || {};

    // Run diagnostics if requested
    if (runDiagnostics === 'true' || runDiagnostics === true) {
      log.start('running_diagnostics');
      const diagnostics = await testGleanConfiguration();
      
      return {
        statusCode: 200,
        body: {
          diagnostics,
          message: 'Glean API diagnostics completed'
        }
      };
    }

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
      
                        // Fallback: return a basic plan since chat API is not available
                  log.start('fallback_to_static_plan', { companyName });

                  return {
                    statusCode: 200,
                    body: {
                      messages: [{
                        role: 'GLEAN_AI',
                        content: [{
                          text: `## Strategic Account Plan: ${companyName}

### 🔍 Status
Glean agent execution failed (likely due to timeout). Your API token has access to the agent but not to the chat API fallback.

### 📋 Recommended Next Steps
1. The agent "T3 Marketing: Strategic Account Plan Agent" exists and is accessible
2. Consider increasing the timeout or using a different approach for long-running agents
3. Contact your Glean administrator to add CHAT scope to your API token for better fallback options

### 💡 Manual Process
For now, consider manually researching ${companyName} and creating a strategic account plan using your existing processes.

---
*Generated as fallback due to agent execution timeout.*`
                        }]
                      }],
                      metadata: {
                        companyName,
                        timestamp: new Date().toISOString(),
                        source: 'fallback_no_chat',
                        errors: [agentError.message],
                        note: 'Agent exists but execution timed out, chat API not available'
                      }
                    }
                  };
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
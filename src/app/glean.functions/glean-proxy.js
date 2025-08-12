// HubSpot Serverless Function to proxy Glean API requests
const https = require('https');

// Simple in-memory job store (Note: This will reset on serverless function cold starts)
const jobStore = new Map();

// Configuration with environment variable fallbacks
const CONFIG = {
  GLEAN_INSTANCE: process.env.GLEAN_INSTANCE || 'trace3',
  GLEAN_BASE_URL: process.env.GLEAN_BASE_URL || `${process.env.GLEAN_INSTANCE || 'trace3'}-be.glean.com`,
  GLEAN_AGENT_ID: process.env.GLEAN_AGENT_ID || '5057a8a588c649d6b1231d648a9167c8',
  GLEAN_API_TOKEN: process.env.GLEAN_API_TOKEN || 'lGOIFZqCsxd6fEfW8Px+zQfcw08irSV8XDL1tIJLj/0=',
  TIMEOUT_MS: parseInt(process.env.GLEAN_TIMEOUT_MS) || 30000, // 30s for streaming, longer than HubSpot's limit but we'll handle it
  MAX_RETRIES: parseInt(process.env.GLEAN_MAX_RETRIES) || 1,
  USE_ASYNC_FLOW: process.env.USE_ASYNC_FLOW === 'true' || true,
  TEST_MODE: process.env.TEST_MODE === 'true' || false // Disable test mode to fix real integration
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

// Make HTTP request with custom timeout
async function makeGleanRequestWithTimeout(companyName, customTimeout) {
  const startTime = Date.now();
  
  log.start('start_glean_call_with_timeout', { 
    companyName, 
    customTimeout,
    config: { 
      baseUrl: CONFIG.GLEAN_BASE_URL, 
      agentId: CONFIG.GLEAN_AGENT_ID,
      timeoutMs: customTimeout
    } 
  });

  const postData = JSON.stringify({
    agent_id: CONFIG.GLEAN_AGENT_ID,
    input: {
      "Company Name": companyName
    }
  });

  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: '/rest/api/v1/agents/runs/stream',
    method: 'POST',
    timeout: customTimeout,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'text/event-stream'
    }
  };

  log.http('http_request_outbound_with_timeout', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/runs/stream`,
    method: 'POST',
    timeoutMs: customTimeout,
    dataSize: Buffer.byteLength(postData)
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const responseStartTime = Date.now();
      let responseData = '';
      
      log.http('http_response_status_with_timeout', { 
        statusCode: res.statusCode, 
        headers: res.headers
      });
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const responseDuration = Date.now() - responseStartTime;
        const totalDuration = Date.now() - startTime;
        
        log.http('http_response_complete_with_timeout', { 
          statusCode: res.statusCode,
          responseSize: responseData.length,
          responseDuration,
          totalDuration
        });
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Parse SSE data - look for the final message
            const lines = responseData.split('\n');
            let finalMessage = null;
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6); // Remove 'data: ' prefix
                if (data && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.messages && Array.isArray(parsed.messages)) {
                      finalMessage = parsed;
                    }
                  } catch (e) {
                    // Skip invalid JSON lines
                  }
                }
              }
            }
            
            if (finalMessage) {
              log.success('parse_success_with_timeout', { 
                dataKeys: Object.keys(finalMessage),
                hasMessages: finalMessage.messages ? Array.isArray(finalMessage.messages) : false,
                messageCount: finalMessage.messages ? finalMessage.messages.length : 0
              });
              resolve(finalMessage);
            } else {
              // If no final message found, try to parse the whole response as JSON
              const parsedData = JSON.parse(responseData);
              resolve(parsedData);
            }
          } catch (error) {
            log.error('parse_error_with_timeout', error);
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        } else {
          log.error('upstream_error_with_timeout', { 
            statusCode: res.statusCode, 
            responseData: responseData.substring(0, 200) 
          });
          reject(new Error(`HTTP ${res.statusCode}: ${responseData.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      log.error('http_request_error_with_timeout', error);
      reject(error);
    });
    
    req.on('timeout', () => {
      log.error('http_request_timeout_with_timeout', { customTimeout });
      req.destroy();
      reject(new Error(`Request timeout after ${customTimeout}ms - Glean API took too long to respond`));
    });
    
    req.write(postData);
    req.end();
  });
}

// Make HTTP request with timeout and retry logic
async function makeGleanRequest(companyName, attempt = 1) {
  const startTime = Date.now();
  
  log.start('start_glean_call', { 
    companyName, 
    attempt, 
    config: { 
      baseUrl: CONFIG.GLEAN_BASE_URL, 
      agentId: CONFIG.GLEAN_AGENT_ID,
      timeoutMs: CONFIG.TIMEOUT_MS 
    } 
  });

      const postData = JSON.stringify({
      agent_id: CONFIG.GLEAN_AGENT_ID,
      input: {
        "Company Name": companyName
      }
    });

      const options = {
      hostname: CONFIG.GLEAN_BASE_URL,
      port: 443,
      path: '/rest/api/v1/agents/runs/stream',
      method: 'POST',
      timeout: CONFIG.TIMEOUT_MS,
      headers: {
        'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'text/event-stream'
      }
    };

  log.http('http_request_outbound', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/runs/stream`,
    method: 'POST',
    timeoutMs: CONFIG.TIMEOUT_MS,
    dataSize: Buffer.byteLength(postData)
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const responseStartTime = Date.now();
      let responseData = '';
      
      log.http('http_response_status', { 
        statusCode: res.statusCode, 
        headers: res.headers,
        attempt 
      });
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const responseDuration = Date.now() - responseStartTime;
        const totalDuration = Date.now() - startTime;
        
        log.http('http_response_complete', { 
          statusCode: res.statusCode,
          responseSize: responseData.length,
          responseDuration,
          totalDuration,
          attempt
        });
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Parse SSE data - look for the final message
            const lines = responseData.split('\n');
            let finalMessage = null;
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6); // Remove 'data: ' prefix
                if (data && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.messages && Array.isArray(parsed.messages)) {
                      finalMessage = parsed;
                    }
                  } catch (e) {
                    // Skip invalid JSON lines
                  }
                }
              }
            }
            
            if (finalMessage) {
              log.success('parse_success', { 
                dataKeys: Object.keys(finalMessage),
                hasMessages: finalMessage.messages ? Array.isArray(finalMessage.messages) : false,
                messageCount: finalMessage.messages ? finalMessage.messages.length : 0
              });
              resolve(finalMessage);
            } else {
              // If no final message found, try to parse the whole response as JSON
              const parsedData = JSON.parse(responseData);
              resolve(parsedData);
            }
          } catch (error) {
            log.error('parse_error', error);
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        } else {
          // Handle 5xx errors with retry logic
          if (res.statusCode >= 500 && attempt < CONFIG.MAX_RETRIES) {
            const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff
            log.error('upstream_5xx_retry', { 
              statusCode: res.statusCode, 
              attempt, 
              backoffMs,
              responseData: responseData.substring(0, 200) 
            });
            
            setTimeout(() => {
              makeGleanRequest(companyName, attempt + 1)
                .then(resolve)
                .catch(reject);
            }, backoffMs);
          } else {
            log.error('upstream_error', { 
              statusCode: res.statusCode, 
              attempt, 
              responseData: responseData.substring(0, 200) 
            });
            reject(new Error(`HTTP ${res.statusCode}: ${responseData.substring(0, 200)}`));
          }
        }
      });
    });
    
    req.on('error', (error) => {
      log.error('http_request_error', error);
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      log.error('http_request_timeout', { 
        timeoutMs: CONFIG.TIMEOUT_MS, 
        actualDuration: duration,
        attempt 
      });
      reject(new Error(`Request timeout after ${duration}ms - Glean API took too long to respond`));
    });
    
    req.write(postData);
    req.end();
  });
}

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
      useAsyncFlow: CONFIG.USE_ASYNC_FLOW,
      testMode: CONFIG.TEST_MODE
    }
  });
  
  try {
    const { companyName, asyncMode, checkStatus, attempt } = context.parameters || {};
    
    if (!companyName) {
      log.error('missing_company_name');
      return {
        statusCode: 400,
        body: {
          error: 'Company name is required',
          timestamp: new Date().toISOString()
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

    // TEST MODE: Return mock data immediately for testing
    if (CONFIG.TEST_MODE) {
      log.start('test_mode_enabled', { companyName });
      
      // Simulate a 2-second delay for realistic testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponse = {
        statusCode: 200,
        body: {
          messages: [
            {
              role: 'GLEAN_AI',
              content: [
                {
                  text: `# Strategic Account Plan for ${companyName}\n\n## Executive Summary\n\nThis comprehensive strategic account plan for ${companyName} provides a detailed analysis of the company's current position, market opportunities, and recommended engagement strategies.\n\n## Company Overview\n\n${companyName} is a leading technology company with significant market presence and growth potential. Based on our analysis, they represent a high-value strategic account with multiple engagement opportunities.\n\n## Key Insights\n\n- **Market Position**: Strong competitive positioning in their core markets\n- **Growth Trajectory**: Positive growth indicators with expansion opportunities\n- **Technology Stack**: Modern infrastructure with potential for upgrades\n- **Decision Makers**: Clear organizational structure with identified stakeholders\n\n## Strategic Recommendations\n\n1. **Immediate Actions (0-30 days)**\n   - Schedule executive briefing with key stakeholders\n   - Conduct technical assessment of current infrastructure\n   - Identify quick-win opportunities\n\n2. **Short-term Initiatives (30-90 days)**\n   - Develop customized solution proposals\n   - Establish regular cadence meetings\n   - Begin pilot program discussions\n\n3. **Long-term Strategy (90+ days)**\n   - Expand relationship across business units\n   - Explore strategic partnership opportunities\n   - Develop multi-year engagement roadmap\n\n## Risk Assessment\n\n- **Low Risk**: Strong financial position and stable leadership\n- **Medium Risk**: Competitive pressure in key markets\n- **Mitigation**: Regular relationship management and value demonstration\n\n## Success Metrics\n\n- Revenue growth targets\n- Relationship expansion goals\n- Customer satisfaction scores\n- Strategic partnership milestones\n\nThis plan provides a foundation for building a long-term, mutually beneficial relationship with ${companyName}.`,
                  type: 'text'
                }
              ]
            }
          ],
          metadata: {
            duration: 2000,
            timestamp: new Date().toISOString(),
            companyName,
            testMode: true
          }
        }
      };
      
      log.success('test_mode_response', { companyName });
      return mockResponse;
    }
    
    if (!companyName) {
      log.error('validation_error', { error: 'Company name is required', received: context });
      return {
        statusCode: 400,
        body: {
          error: 'Company name is required',
          received: context,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (!CONFIG.GLEAN_API_TOKEN) {
      log.error('config_error', { error: 'Glean API token not configured' });
      return {
        statusCode: 500,
        body: {
          error: 'Glean API token not configured',
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Handle status checking for async jobs
    if (checkStatus) {
      log.start('status_check', { companyName, attempt });
      
      // Since serverless functions don't maintain state, we'll try to get the result directly
      // If it's still running, it will timeout and we'll return 202
      try {
        const data = await makeGleanRequest(companyName);
        
        if (data && data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          // Job completed successfully
          log.success('status_check_success', { companyName, attempt });
          return {
            statusCode: 200,
            body: {
              ...data,
              metadata: {
                timestamp: new Date().toISOString(),
                companyName,
                statusCheck: true,
                attempt
              }
            }
          };
        } else {
          // No results yet, still running
          log.start('status_check_running', { companyName, attempt });
          return {
            statusCode: 202,
            body: {
              status: 'running',
              message: 'Job is still running',
              companyName,
              timestamp: new Date().toISOString(),
              attempt
            }
          };
        }
      } catch (error) {
        // If it's a timeout or the agent is still running, continue polling
        if (error.message.includes('timeout') || error.message.includes('HTTP 5')) {
          log.start('status_check_running', { companyName, attempt, error: error.message });
          return {
            statusCode: 202,
            body: {
              status: 'running',
              message: 'Job is still running',
              companyName,
              timestamp: new Date().toISOString(),
              attempt
            }
          };
        } else {
          // Other error - log the full error details
          log.error('status_check_error', { 
            companyName, 
            attempt, 
            error: error.message, 
            stack: error.stack,
            errorType: error.constructor.name
          });
          return {
            statusCode: 500,
            body: {
              error: `Server error: ${error.message}`,
              companyName,
              timestamp: new Date().toISOString(),
              attempt,
              errorType: error.constructor.name
            }
          };
        }
      }
    }
    
    // Check if we should use async flow for long-running agents
    if (CONFIG.USE_ASYNC_FLOW || asyncMode) {
      // Try streaming first, but with a short timeout to avoid HubSpot limits
      log.start('streaming_attempt', { companyName });
      
      try {
        // Use a shorter timeout for streaming to stay within HubSpot limits
        const streamingTimeout = 8000; // 8 seconds to stay under HubSpot's 10s limit
        
        const data = await makeGleanRequestWithTimeout(companyName, streamingTimeout);
        
        // If we got a complete response quickly, return it
        if (data && data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          log.success('streaming_success', { companyName });
          
          const response = {
            statusCode: 200,
            body: {
              ...data,
              metadata: {
                timestamp: new Date().toISOString(),
                companyName,
                method: 'streaming'
              }
            }
          };
          
          return response;
        }
      } catch (error) {
        log.start('streaming_fallback', { companyName, error: error.message });
      }
      
      // If streaming failed or timed out, fall back to async approach
      log.start('async_fallback_start', { companyName });
      
      // Start the agent asynchronously and return immediately
      makeGleanRequest(companyName)
        .then(data => {
          log.success('async_agent_completed', { companyName });
        })
        .catch(error => {
          log.error('async_agent_error', { companyName, error: error.message });
        });
      
      const response = {
        statusCode: 202, // Accepted
        body: {
          status: 'started',
          message: 'Strategic Account Plan generation started. This may take 1-2 minutes to complete.',
          companyName,
          timestamp: new Date().toISOString(),
          async: true,
          method: 'async_fallback'
        }
      };
      
      log.return('async_fallback_return', { 
        statusCode: response.statusCode,
        message: response.body.message
      });
      
      return response;
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
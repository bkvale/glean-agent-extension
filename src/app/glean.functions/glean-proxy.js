// HubSpot Serverless Function to proxy Glean API requests
const https = require('https');

// Configuration with environment variable fallbacks
const CONFIG = {
  GLEAN_INSTANCE: process.env.GLEAN_INSTANCE || 'trace3',
  GLEAN_BASE_URL: process.env.GLEAN_BASE_URL || `${process.env.GLEAN_INSTANCE || 'trace3'}-be.glean.com`,
  GLEAN_AGENT_ID: process.env.GLEAN_AGENT_ID || '5057a8a588c649d6b1231d648a9167c8',
  GLEAN_API_TOKEN: process.env.GLEAN_API_TOKEN || 'lGOIFZqCsxd6fEfW8Px+zQfcw08irSV8XDL1tIJLj/0=',
  TIMEOUT_MS: parseInt(process.env.GLEAN_TIMEOUT_MS) || 8000, // 8s default, well under HubSpot's 10s limit
  MAX_RETRIES: parseInt(process.env.GLEAN_MAX_RETRIES) || 1
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
      query: `Generate a strategic account plan for ${companyName}`
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
        'Content-Length': Buffer.byteLength(postData)
      }
    };

  log.http('http_request_outbound', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/runs/wait`,
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
                      // Handle streaming response - collect all chunks
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
                      
                      log.success('stream_parse_success', { 
                        totalEvents: events.length,
                        hasFinalEvent: !!finalEvent,
                        dataKeys: Object.keys(result),
                        hasMessages: result.messages ? Array.isArray(result.messages) : false,
                        messageCount: result.messages ? result.messages.length : 0
                      });
                      
                      resolve(result);
                    } catch (error) {
                      log.error('stream_parse_error', error);
                      reject(new Error(`Invalid streaming response: ${error.message}`));
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
      maxRetries: CONFIG.MAX_RETRIES
    }
  });
  
  try {
    const { companyName } = context.parameters || {};
    
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
    
    // Make the Glean API request
    const data = await makeGleanRequest(companyName);
    
    const totalDuration = Date.now() - functionStartTime;
    
    log.success('glean_api_success', { 
      companyName,
      totalDuration,
      dataKeys: Object.keys(data),
      messageCount: data.messages ? data.messages.length : 0
    });
    
    const response = {
      statusCode: 200,
      body: {
        ...data,
        metadata: {
          duration: totalDuration,
          timestamp: new Date().toISOString(),
          companyName
        }
      }
    };
    
    log.return('return_to_ui', { 
      statusCode: response.statusCode,
      bodyKeys: Object.keys(response.body),
      hasMetadata: !!response.body.metadata
    });
    
    return response;
    
  } catch (error) {
    const totalDuration = Date.now() - functionStartTime;
    
    log.error('function_error', error);
    
    // Categorize errors for better UI handling
    let errorCategory = 'unknown';
    let userMessage = 'Failed to generate strategic account plan';
    
    if (error.message.includes('timeout')) {
      errorCategory = 'timeout';
      userMessage = 'The Glean agent is taking longer than expected to respond. This is normal for complex analysis. Please try again in a few minutes.';
    } else if (error.message.includes('HTTP 401')) {
      errorCategory = 'upstream_4xx';
      userMessage = 'Authentication failed. Please check the Glean API token configuration.';
    } else if (error.message.includes('HTTP 404')) {
      errorCategory = 'upstream_404';
      userMessage = 'Glean agent not found. Please check the agent ID configuration.';
    } else if (error.message.includes('HTTP 5')) {
      errorCategory = 'upstream_5xx';
      userMessage = 'Glean service temporarily unavailable. Please try again.';
    }
    
    return {
      statusCode: 500,
      body: {
        error: userMessage,
        category: errorCategory,
        message: error.message,
        details: error.stack,
        duration: totalDuration,
        timestamp: new Date().toISOString()
      }
    };
  }
}; 
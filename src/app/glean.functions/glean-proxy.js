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

// Start a new agent job
async function startAgentJob(companyName) {
  log.start('start_agent_job', { companyName });
  
  const postData = JSON.stringify({
    agent_id: CONFIG.GLEAN_AGENT_ID,
    input: {
      "Company Name": companyName
    }
  });

  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: '/rest/api/v1/agents/runs',
    method: 'POST',
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  log.http('http_request_outbound', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/runs`,
    method: 'POST',
    timeoutMs: CONFIG.TIMEOUT_MS
  });

  return makeGleanRequest(options, postData);
}

// Check job status by ID
async function checkJobStatus(jobId) {
  log.start('check_job_status', { jobId });
  
  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: `/rest/api/v1/agents/runs/${jobId}`,
    method: 'GET',
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  log.http('http_request_outbound', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/runs/${jobId}`,
    method: 'GET',
    timeoutMs: CONFIG.TIMEOUT_MS
  });

  return makeGleanRequest(options);
}

// Get job results by ID
async function getJobResults(jobId) {
  log.start('get_job_results', { jobId });
  
  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: `/rest/api/v1/agents/runs/${jobId}/result`,
    method: 'GET',
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  log.http('http_request_outbound', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/agents/runs/${jobId}/result`,
    method: 'GET',
    timeoutMs: CONFIG.TIMEOUT_MS
  });

  return makeGleanRequest(options);
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
    const { companyName, jobId, action } = context.parameters || {};

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

    // Handle different actions
    if (action === 'check_status' && jobId) {
      // Check status of existing job
      log.start('check_status_action', { jobId });
      
      try {
        const statusData = await checkJobStatus(jobId);
        
        if (statusData.status === 'completed') {
          // Job is complete, get results
          const results = await getJobResults(jobId);
          log.success('job_completed_with_results', { jobId });
          
          return {
            statusCode: 200,
            body: {
              ...results,
              metadata: {
                timestamp: new Date().toISOString(),
                jobId,
                action: 'check_status'
              }
            }
          };
        } else if (statusData.status === 'running' || statusData.status === 'pending') {
          // Job still running
          log.start('job_still_running', { jobId, status: statusData.status });
          
          return {
            statusCode: 202,
            body: {
              status: 'running',
              message: 'Job is still running',
              jobId,
              timestamp: new Date().toISOString(),
              action: 'check_status'
            }
          };
        } else {
          // Job failed or unknown status
          log.error('job_failed', { jobId, status: statusData.status });
          
          return {
            statusCode: 500,
            body: {
              error: `Job failed with status: ${statusData.status}`,
              jobId,
              timestamp: new Date().toISOString(),
              action: 'check_status'
            }
          };
        }
      } catch (error) {
        log.error('check_status_error', { jobId, error: error.message });
        
        return {
          statusCode: 500,
          body: {
            error: `Error checking job status: ${error.message}`,
            jobId,
            timestamp: new Date().toISOString(),
            action: 'check_status'
          }
        };
      }
    } else if (companyName) {
      // Start a new job
      log.start('start_new_job', { companyName });
      
      try {
        const jobData = await startAgentJob(companyName);
        
        if (jobData.id) {
          log.success('job_started', { jobId: jobData.id, companyName });
          
          return {
            statusCode: 202,
            body: {
              status: 'started',
              message: 'Strategic Account Plan generation started. This may take 1-2 minutes to complete.',
              jobId: jobData.id,
              companyName,
              timestamp: new Date().toISOString(),
              action: 'start_job'
            }
          };
        } else {
          log.error('no_job_id_returned', { jobData });
          
          return {
            statusCode: 500,
            body: {
              error: 'No job ID returned from Glean API',
              companyName,
              timestamp: new Date().toISOString(),
              action: 'start_job'
            }
          };
        }
      } catch (error) {
        log.error('start_job_error', { companyName, error: error.message });
        
        return {
          statusCode: 500,
          body: {
            error: `Error starting job: ${error.message}`,
            companyName,
            timestamp: new Date().toISOString(),
            action: 'start_job'
          }
        };
      }
    } else {
      // Missing required parameters
      log.error('missing_parameters', { context });
      
      return {
        statusCode: 400,
        body: {
          error: 'Missing required parameters. Need either companyName (to start job) or jobId + action=check_status (to check status)',
          received: context,
          timestamp: new Date().toISOString()
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
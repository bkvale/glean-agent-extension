// HubSpot Serverless Function to proxy Glean API requests using official SDK
// ⚠️ SECURITY NOTE: This contains hardcoded credentials for testing purposes only.
// TODO: Replace with environment variables before production deployment.
const { Glean } = require('@gleanwork/api-client');

// Configuration with hardcoded values for testing
// TODO: Replace with environment variables for production
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

// Initialize Glean SDK client
const glean = new Glean({
  instance: CONFIG.GLEAN_INSTANCE,
  apiToken: CONFIG.GLEAN_API_TOKEN,
  serverURL: `https://${CONFIG.GLEAN_BASE_URL}`,
  retryConfig: {
    strategy: "backoff",
    backoff: {
      initialInterval: 1000,
      maxInterval: 5000,
      exponent: 1.5,
      maxElapsedTime: 10000,
    },
    retryConnectionErrors: false,
  }
});

// Execute a pre-built Glean agent using the official SDK
async function executeGleanAgent(companyName) {
  log.start('execute_glean_agent', { companyName, agentId: CONFIG.GLEAN_AGENT_ID });

  try {
    // Use the official SDK to run the agent
    const result = await glean.client.agents.run({
      agentId: CONFIG.GLEAN_AGENT_ID,
      input: {
        "Company Name": companyName
      }
    });

    log.success('agent_execution_success', { 
      companyName,
      hasMessages: !!result.messages,
      messageCount: result.messages?.length || 0
    });

    return {
      messages: result.messages || [],
      metadata: {
        source: 'glean_agent_sdk',
        companyName: companyName,
        agentId: CONFIG.GLEAN_AGENT_ID,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    log.error('agent_execution_failed', error);

    // Handle specific error types from the SDK
    if (error.statusCode === 408 || error.message.includes('timeout')) {
      throw new Error('AGENT_TIMEOUT: Agent execution exceeded HubSpot timeout limits');
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      throw new Error('AUTH_ERROR: API token may not have agents scope permissions');
    }

    if (error.statusCode === 404) {
      throw new Error('AGENT_NOT_FOUND: The specified agent does not exist or is not accessible');
    }

    // Re-throw the error with more context
    throw new Error(`AGENT_API_FAILED: ${error.message}`);
  }
}

// Test Glean API configuration and connectivity
async function testGleanConfiguration() {
  log.start('test_glean_configuration', {
    instance: CONFIG.GLEAN_INSTANCE,
    baseUrl: CONFIG.GLEAN_BASE_URL,
    agentId: CONFIG.GLEAN_AGENT_ID,
    hasToken: !!CONFIG.GLEAN_API_TOKEN
  });

  const results = {
    basicConnectivity: { status: 'pending', message: '', data: null },
    agentExists: { status: 'pending', message: '', data: null },
    agentExecution: { status: 'pending', message: '', data: null }
  };

  try {
    // Test 1: Basic connectivity - list agents
    try {
      const agentsResponse = await glean.client.agents.list();
      results.basicConnectivity = {
        status: 'success',
        message: `Successfully connected to Glean API (${agentsResponse.agents?.length || 0} agents found)`,
        data: agentsResponse.agents?.length || 0
      };
    } catch (error) {
      results.basicConnectivity = {
        status: 'error',
        message: `Failed to connect to Glean API: ${error.message}`,
        data: null
      };
    }

    // Test 2: Agent exists and is accessible
    try {
      const agentResponse = await glean.client.agents.retrieve({ agentId: CONFIG.GLEAN_AGENT_ID });
      results.agentExists = {
        status: 'success',
        message: `Agent found and accessible (${agentResponse.name})`,
        data: agentResponse.name
      };
    } catch (error) {
      results.agentExists = {
        status: 'error',
        message: `Agent not found or not accessible: ${error.message}`,
        data: null
      };
    }

    // Test 3: Direct agent execution test (will likely timeout)
    try {
      const testResult = await glean.client.agents.run({
        agentId: CONFIG.GLEAN_AGENT_ID,
        input: { "Company Name": "Configuration Test" }
      });
      results.agentExecution = {
        status: 'success',
        message: 'Agent execution test successful',
        data: testResult
      };
    } catch (error) {
      if (error.message.includes('timeout') || error.statusCode === 408) {
        results.agentExecution = {
          status: 'timeout',
          message: 'Agent execution test timed out (expected for long-running agents)',
          data: null
        };
      } else {
        results.agentExecution = {
          status: 'error',
          message: `Agent execution test failed: ${error.message}`,
          data: null
        };
      }
    }

    return results;

  } catch (error) {
    log.error('test_configuration_failed', error);
    throw new Error(`Configuration test failed: ${error.message}`);
  }
}

// Main serverless function handler
exports.main = async (context = {}, sendResponse) => {
  log.start('serverless_function_called', { 
    action: context.paramsToSend?.action,
    companyName: context.paramsToSend?.companyName,
    testMode: context.paramsToSend?.testMode
  });

  try {
    const { action, companyName, testMode } = context.paramsToSend || {};

    // Handle test mode
    if (action === 'test' || testMode) {
      const testResults = await testGleanConfiguration();
      
      sendResponse({
        statusCode: 200,
        body: {
          success: true,
          message: 'Glean API configuration test completed',
          results: testResults,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Handle agent execution
    if (!companyName) {
      throw new Error('Company name is required for agent execution');
    }

    const result = await executeGleanAgent(companyName);
    
    sendResponse({
      statusCode: 200,
      body: result
    });

  } catch (error) {
    log.error('serverless_function_error', error);
    
    sendResponse({
      statusCode: 500,
      body: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}; 
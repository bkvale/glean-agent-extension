// HubSpot Serverless Function to proxy Glean API requests using official SDK
const { Glean } = require('@gleanwork/api-client');

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

// Test Glean configuration using the official SDK
async function testGleanConfiguration() {
  log.start('test_glean_configuration');

  const diagnostics = {
    config: {
      instance: CONFIG.GLEAN_INSTANCE,
      baseUrl: CONFIG.GLEAN_BASE_URL,
      agentId: CONFIG.GLEAN_AGENT_ID,
      hasToken: !!CONFIG.GLEAN_API_TOKEN
    },
    tests: {}
  };

  try {
    // Test 1: Basic connectivity and agent search
    log.start('testing_basic_connectivity');
    const agentsResult = await glean.client.agents.list({
      query: "Strategic Account Plan"
    });
    
    diagnostics.tests.basicConnectivity = {
      success: true,
      message: 'Successfully connected to Glean API',
      agentsCount: agentsResult.agents?.length || 0
    };

    // Test 2: Check if our specific agent exists
    log.start('testing_agent_exists');
    try {
      const agentResult = await glean.client.agents.retrieve({
        agentId: CONFIG.GLEAN_AGENT_ID
      });
      
      diagnostics.tests.agentExists = {
        success: true,
        message: 'Agent found and accessible',
        agentName: agentResult.name || 'Unknown'
      };
    } catch (error) {
      diagnostics.tests.agentExists = {
        success: false,
        message: 'Agent not found or not accessible',
        error: error.message
      };
    }

    // Test 3: Try a simple agent execution
    log.start('testing_agent_execution');
    try {
      const testResult = await glean.client.agents.run({
        agentId: CONFIG.GLEAN_AGENT_ID,
        input: {
          "Company Name": "Test Company"
        }
      });
      
      diagnostics.tests.agentExecution = {
        success: true,
        message: 'Agent execution successful',
        hasMessages: !!testResult.messages,
        messageCount: testResult.messages?.length || 0
      };
    } catch (error) {
      diagnostics.tests.agentExecution = {
        success: false,
        message: 'Agent execution failed (this is expected if agent takes too long)',
        error: error.message
      };
    }

  } catch (error) {
    log.error('configuration_test_failed', error);
    diagnostics.tests.basicConnectivity = {
      success: false,
      message: 'Failed to connect to Glean API',
      error: error.message
    };
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
    const { companyName, runDiagnostics, testAgentExecution } = context.parameters || {};

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

    // Test agent execution directly if requested
    if (testAgentExecution === 'true' || testAgentExecution === true) {
      log.start('testing_agent_execution_directly');
      
      try {
        const result = await executeGleanAgent(companyName || 'Test Company');
        
        return {
          statusCode: 200,
          body: {
            messages: result.messages || [{
              role: 'GLEAN_AI',
              content: [{
                text: 'Agent execution test completed successfully'
              }]
            }],
            metadata: {
              companyName: companyName || 'Test Company',
              timestamp: new Date().toISOString(),
              source: 'direct_agent_test',
              agentId: CONFIG.GLEAN_AGENT_ID
            }
          }
        };
      } catch (error) {
        log.error('direct_agent_test_failed', error);
        
        return {
          statusCode: 500,
          body: {
            error: `Direct agent test failed: ${error.message}`,
            timestamp: new Date().toISOString()
          }
        };
      }
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

    // Try to execute the Glean agent
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
              text: 'Agent execution completed but no messages returned'
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
      
      // Return a fallback response
      return {
        statusCode: 200,
        body: {
          messages: [{
            role: 'GLEAN_AI',
            content: [{
              text: `## Strategic Account Plan: ${companyName}

### 🔍 Status
Glean agent execution failed: ${agentError.message}

### 📋 Recommended Next Steps
1. Check if the agent "T3 Marketing: Strategic Account Plan Agent" is accessible
2. Verify API token has the correct permissions
3. Consider the agent execution time (may exceed HubSpot timeout limits)

### 💡 Manual Process
For now, consider manually researching ${companyName} and creating a strategic account plan using your existing processes.

---
*Generated as fallback due to agent execution error.*`
            }]
          }],
          metadata: {
            companyName,
            timestamp: new Date().toISOString(),
            source: 'fallback_error',
            errors: [agentError.message],
            note: 'Agent execution failed, showing fallback message'
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
import React, { useState } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

// Content persistence hooks (no-op for now)
const savePlan = async (companyId, content, metadata) => {
  // TODO: Implement storage strategy
  // Preferred: custom object associated to Company for run history/versioning
  // Fallback: long-text Company property
  console.log('savePlan called:', { companyId, contentLength: content?.length, metadata });
  return { success: true, timestamp: new Date().toISOString() };
};

const getLatestPlan = async (companyId) => {
  // TODO: Implement retrieval strategy
  console.log('getLatestPlan called:', { companyId });
  return null;
};

const GleanCard = ({ context, actions }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setError(null);
    setDiagnostics(null);

    try {
      console.log('Running Glean API diagnostics...');

      const response = await hubspot.serverless('glean-proxy', {
        parameters: {
          runDiagnostics: true
        }
      });

      console.log('Diagnostics response:', response);

      if (response.statusCode === 200 && response.body.diagnostics) {
        setDiagnostics(response.body.diagnostics);
      } else {
        throw new Error('Failed to run diagnostics');
      }
    } catch (err) {
      console.error('Error running diagnostics:', err);
      setError(`Diagnostic error: ${err.message}`);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const runStrategicAccountPlan = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let companyName = 'Unknown Company';
      if (actions && actions.fetchCrmObjectProperties) {
        try {
          const companyProperties = await actions.fetchCrmObjectProperties(['name']);
          companyName = companyProperties.name || `Company ID: ${context.crm?.objectId}`;
        } catch (error) {
          console.log('Could not fetch company name, using fallback');
          companyName = context.crm?.objectId ? `Company ID: ${context.crm.objectId}` : 'Unknown Company';
        }
      } else {
        companyName = context.crm?.objectId ? `Company ID: ${context.crm.objectId}` : 'Unknown Company';
      }

      console.log('Starting Glean agent execution for:', companyName);

      const response = await hubspot.serverless('glean-proxy', {
        propertiesToSend: ['name'],
        parameters: {
          companyName: companyName
        }
      });

      console.log('Serverless function response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response statusCode:', response?.statusCode);
      console.log('Response body:', response?.body);

      if (!response) {
        throw new Error('No response from serverless function');
      }

      // Check if the serverless function returned an error
      if (response.statusCode && response.statusCode !== 200) {
        console.error('Serverless function error:', response);
        const errorMessage = response.body?.error || response.body?.message || 'Unknown serverless function error';
        throw new Error(`Serverless function failed: ${errorMessage}`);
      }

      // Extract the response data
      const gleanData = response.body || response;
      
      console.log('Glean data after extraction:', gleanData);
      console.log('Glean data type:', typeof gleanData);
      console.log('Glean data keys:', Object.keys(gleanData || {}));

      // Add validation for response structure
      if (!gleanData || typeof gleanData !== 'object') {
        console.error('Glean data is not an object:', gleanData);
        throw new Error('Invalid response structure: gleanData is not an object');
      }

      // Handle successful response
      if (response.statusCode === 200 && gleanData.messages) {
        console.log('Strategic plan generated successfully:', gleanData);
        
        // Save the plan to persistent storage
        if (gleanData.messages && Array.isArray(gleanData.messages)) {
          const companyId = context.crm?.objectId;
          const planContent = gleanData.messages
            .map(msg => msg.content?.map(c => c.text).join(' '))
            .join('\n\n');
          
          try {
            await savePlan(companyId, planContent, {
              timestamp: new Date().toISOString(),
              companyName,
              source: gleanData.metadata?.source || 'unknown',
              agentId: gleanData.metadata?.agentId
            });
          } catch (saveError) {
            console.warn('Failed to save plan:', saveError);
            // Don't fail the UI if save fails
          }
        }
        
        setResult(gleanData);
        return;
      }

      // Handle unexpected response format
      console.error('Unexpected response format:', gleanData);
      setResult({
        error: true,
        message: 'Received response from Glean but it was in an unexpected format. Please try again.',
        rawData: gleanData
      });
      
    } catch (err) {
      console.error('Error running Glean agent:', err);
      console.error('Error type:', err.name);
      console.error('Error stack:', err.stack);

      // Handle categorized errors from serverless function
      if (err.message.includes('Serverless function failed:')) {
        const errorBody = err.message.replace('Serverless function failed: ', '');
        setError(errorBody);
      } else if (err.message.includes('AGENT_TIMEOUT') || err.message.includes('STREAM_TIMEOUT')) {
        setError(`The Glean agent is taking longer than expected to respond (exceeded HubSpot's timeout limits). This is a known compatibility issue between long-running AI agents and HubSpot's serverless function constraints. The system automatically fell back to using Glean's chat API instead.`);
      } else if (err.message.includes('AUTH_ERROR')) {
        setError(`Authentication error: The Glean API token may not have the required 'agents' scope permissions. Please contact your Glean administrator to ensure the token has access to execute agents.`);
      } else if (err.message.includes('AGENT_NOT_FOUND')) {
        setError(`Agent not found: The specified Glean agent ID does not exist or is not accessible. This could be due to an incorrect agent ID or insufficient permissions. The system automatically fell back to using Glean's chat API instead.`);
      } else if (err.message.includes('AGENT_API_FAILED')) {
        setError(`Glean agent API failed: Unable to execute the pre-built agent. This could be due to API configuration issues or the agent being temporarily unavailable. The system automatically fell back to using Glean's chat API instead.`);
      } else if (err.message.includes('timeout')) {
        setError(`The Glean agent is taking longer than expected to respond. This might be due to network issues or the agent being busy. The system automatically fell back to using Glean's chat API instead.`);
      } else if (err.message.includes('Failed to fetch')) {
        setError(`Network error: Unable to connect to Glean API. This might be a CORS issue or the API endpoint is not accessible from HubSpot. Error: ${err.message}`);
      } else if (err.message.includes('Bearer token')) {
        setError(err.message);
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError(`CORS or network error: ${err.message}. The Glean API might not allow requests from HubSpot's domain.`);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box padding="medium">
      <Text variant="h3">Strategic Account Plan</Text>

                        {!result && !isLoading && !error && !diagnostics && (
                    <Box padding="small">
                      <Text>Generate Strategic Account Plan for this company using Glean AI Agent:</Text>

                      <Box padding="small">
                        <Text variant="small">
                          🤖 Using Glean AI Agent to generate strategic insights
                        </Text>
                      </Box>

                      <Button
                        variant="primary"
                        onClick={runStrategicAccountPlan}
                        disabled={isLoading}
                      >
                        Generate Plan
                      </Button>

                      <Box padding="small">
                        <Button
                          variant="secondary"
                          onClick={runDiagnostics}
                          disabled={isRunningDiagnostics}
                        >
                          {isRunningDiagnostics ? 'Running Diagnostics...' : '🔧 Test Glean API'}
                        </Button>
                      </Box>

                      <Box padding="small">
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            setIsLoading(true);
                            setError(null);
                            try {
                              const response = await hubspot.serverless('glean-proxy', {
                                parameters: {
                                  companyName: 'Test Company',
                                  testAgentExecution: true
                                }
                              });
                              console.log('Direct agent test response:', response);
                              if (response.statusCode === 200) {
                                setResult(response.body);
                              } else {
                                setError(`Agent test failed: ${response.body?.error || 'Unknown error'}`);
                              }
                            } catch (err) {
                              setError(`Agent test error: ${err.message}`);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          disabled={isLoading}
                        >
                          🚀 Test Agent Execution
                        </Button>
                      </Box>
                    </Box>
                  )}

      {isLoading && (
        <Box padding="small">
          <Text>🤖 Running Glean AI Agent to generate strategic plan...</Text>
        </Box>
      )}

                        {error && (
                    <Box padding="small">
                      <Text variant="error">Error: {error}</Text>
                      <Button
                        variant="secondary"
                        onClick={runStrategicAccountPlan}
                      >
                        Try Again
                      </Button>
                    </Box>
                  )}

                  {diagnostics && (
                    <Box padding="small">
                      <Text variant="h4">🔧 Glean API Diagnostics</Text>
                      
                      <Box padding="small">
                        <Text variant="small" fontWeight="bold">Configuration:</Text>
                        <Text variant="small">Instance: {diagnostics.config.instance}</Text>
                        <Text variant="small">Base URL: {diagnostics.config.baseUrl}</Text>
                        <Text variant="small">Agent ID: {diagnostics.config.agentId}</Text>
                        <Text variant="small">Has Token: {diagnostics.config.hasToken ? '✅ Yes' : '❌ No'}</Text>
                      </Box>

                      <Box padding="small">
                        <Text variant="small" fontWeight="bold">Test Results:</Text>
                        
                        {diagnostics.tests.basicConnectivity && (
                          <Box padding="small">
                            <Text variant="small">
                              {diagnostics.tests.basicConnectivity.success ? '✅' : '❌'} Basic Connectivity: 
                              {diagnostics.tests.basicConnectivity.message}
                              {diagnostics.tests.basicConnectivity.agentsCount && 
                                ` (${diagnostics.tests.basicConnectivity.agentsCount} agents found)`
                              }
                            </Text>
                            {!diagnostics.tests.basicConnectivity.success && (
                              <Text variant="error">
                                Error: {diagnostics.tests.basicConnectivity.error}
                              </Text>
                            )}
                          </Box>
                        )}

                        {diagnostics.tests.agentExists && (
                          <Box padding="small">
                            <Text variant="small">
                              {diagnostics.tests.agentExists.success ? '✅' : '❌'} Agent Exists: 
                              {diagnostics.tests.agentExists.message}
                              {diagnostics.tests.agentExists.agentName && 
                                ` (${diagnostics.tests.agentExists.agentName})`
                              }
                            </Text>
                            {!diagnostics.tests.agentExists.success && (
                              <Text variant="error">
                                Error: {diagnostics.tests.agentExists.error}
                              </Text>
                            )}
                          </Box>
                        )}

                        {diagnostics.tests.apiDiscovery && (
                          <Box padding="small">
                            <Text variant="small" fontWeight="bold">
                              {diagnostics.tests.apiDiscovery.success ? '✅' : '❌'} API Discovery: 
                              {diagnostics.tests.apiDiscovery.message}
                            </Text>
                            
                            {diagnostics.tests.apiDiscovery.success && diagnostics.tests.apiDiscovery.results && (
                              <Box padding="small">
                                <Text variant="small">
                                  Working Endpoints: {diagnostics.tests.apiDiscovery.results.workingEndpoints.length}
                                </Text>
                                <Text variant="small">
                                  Tested Endpoints: {diagnostics.tests.apiDiscovery.results.testedEndpoints.length}
                                </Text>
                                
                                {diagnostics.tests.apiDiscovery.results.workingEndpoints.length > 0 && (
                                  <Box padding="small">
                                    <Text variant="small" fontWeight="bold">Working Endpoints:</Text>
                                    {diagnostics.tests.apiDiscovery.results.workingEndpoints.map((endpoint, index) => (
                                      <Text key={index} variant="small">
                                        • {endpoint.method} {endpoint.endpoint} ({endpoint.source})
                                      </Text>
                                    ))}
                                  </Box>
                                )}
                                
                                {diagnostics.tests.apiDiscovery.results.testedEndpoints.length > 0 && (
                                  <Box padding="small">
                                    <Text variant="small" fontWeight="bold">Failed Endpoints:</Text>
                                    {diagnostics.tests.apiDiscovery.results.testedEndpoints.slice(0, 5).map((endpoint, index) => (
                                      <Text key={index} variant="small">
                                        • {endpoint.method || 'POST'} {endpoint.endpoint}: {endpoint.statusCode || 'unknown'} - {endpoint.error}
                                      </Text>
                                    ))}
                                    {diagnostics.tests.apiDiscovery.results.testedEndpoints.length > 5 && (
                                      <Text variant="small">
                                        ... and {diagnostics.tests.apiDiscovery.results.testedEndpoints.length - 5} more
                                      </Text>
                                    )}
                                  </Box>
                                )}
                                
                                {diagnostics.tests.apiDiscovery.results.agentDetails && (
                                  <Box padding="small">
                                    <Text variant="small" fontWeight="bold">Agent Details:</Text>
                                    <Text variant="small">Name: {diagnostics.tests.apiDiscovery.results.agentDetails.name}</Text>
                                    <Text variant="small">ID: {diagnostics.tests.apiDiscovery.results.agentDetails.id}</Text>
                                    {diagnostics.tests.apiDiscovery.results.agentDetails.description && (
                                      <Text variant="small">Description: {diagnostics.tests.apiDiscovery.results.agentDetails.description}</Text>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            )}
                            
                            {!diagnostics.tests.apiDiscovery.success && (
                              <Text variant="error">
                                Error: {diagnostics.tests.apiDiscovery.error}
                              </Text>
                            )}
                          </Box>
                        )}
                      </Box>

                      <Box padding="small">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setDiagnostics(null);
                            setError(null);
                          }}
                        >
                          Back to Generate Plan
                        </Button>
                      </Box>
                    </Box>
                  )}

      {result && !result.error && (
        <Box padding="small">
          <Text variant="success">✅ Strategic Account Plan Generated!</Text>
          <Text variant="small">Company: {result.metadata?.companyName || 'Unknown'}</Text>
          {result.metadata?.source && (
            <Text variant="small">Source: {result.metadata.source}</Text>
          )}
          
          {result.messages && Array.isArray(result.messages) && result.messages.map((message, index) => (
            <Box key={index} padding="small">
              <Text variant="small" fontWeight="bold">
                {message.role === 'GLEAN_AI' ? 'AI Analysis:' : message.role}:
              </Text>
              {message.content && Array.isArray(message.content) && message.content.map((content, contentIndex) => (
                <Text key={contentIndex} variant="small">
                  {content.text}
                </Text>
              ))}
            </Box>
          ))}
          
          <Button
            variant="secondary"
            onClick={runStrategicAccountPlan}
          >
            Generate New Plan
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default GleanCard;

// Register the extension with HubSpot
hubspot.extend(({ context, actions }) => (
  <GleanCard context={context} actions={actions} />
));
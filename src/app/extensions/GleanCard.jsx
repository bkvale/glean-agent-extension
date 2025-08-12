import React, { useState, useEffect } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions }) => {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Get company name from HubSpot context
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const properties = await actions.fetchCrmObjectProperties(['name']);
        setCompanyName(properties.name || 'Unknown Company');
      } catch (error) {
        console.error('Error fetching company name:', error);
        setCompanyName('Unknown Company');
      }
    };
    
    fetchCompanyName();
  }, [actions]);

  const runStrategicAccountPlan = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting Glean agent execution for:', companyName);

      // Use the serverless function to execute the Glean agent
      const response = await hubspot.serverless('glean-proxy', {
        propertiesToSend: ['name'],
        parameters: {
          companyName: companyName
        }
      });

      console.log('Serverless function response:', response);

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

      // Handle successful response
      if (response.statusCode === 200 && gleanData.messages) {
        console.log('Strategic plan generated successfully:', gleanData);
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
      
      // Handle categorized errors from serverless function
      if (err.message.includes('Serverless function failed:')) {
        const errorBody = err.message.replace('Serverless function failed: ', '');
        setError(errorBody);
      } else if (err.message.includes('AGENT_TIMEOUT') || err.message.includes('STREAM_TIMEOUT')) {
        setError(`The Glean agent is taking longer than expected to respond (exceeded HubSpot's timeout limits). This is a known compatibility issue between long-running AI agents and HubSpot's serverless function constraints.`);
      } else if (err.message.includes('AUTH_ERROR')) {
        setError(`Authentication error: The Glean API token may not have the required 'agents' scope permissions. Please contact your Glean administrator to ensure the token has access to execute agents.`);
      } else if (err.message.includes('AGENT_NOT_FOUND')) {
        setError(`Agent not found: The specified Glean agent ID does not exist or is not accessible. This could be due to an incorrect agent ID or insufficient permissions.`);
      } else if (err.message.includes('AGENT_API_FAILED')) {
        setError(`Glean agent API failed: Unable to execute the pre-built agent. This could be due to API configuration issues or the agent being temporarily unavailable.`);
      } else if (err.message.includes('timeout')) {
        setError(`The Glean agent is taking longer than expected to respond. This might be due to network issues or the agent being busy.`);
      } else if (err.message.includes('Failed to fetch')) {
        setError(`Network error: Unable to connect to Glean API. This might be a CORS issue or the API endpoint is not accessible from HubSpot. Error: ${err.message}`);
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
      
      {!result && !isLoading && !error && (
        <Box padding="small">
          <Text>Generate Strategic Account Plan for {companyName} using Glean AI Agent:</Text>

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
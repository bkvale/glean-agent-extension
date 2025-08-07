import React, { useState } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions, runServerlessFunction }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  // Glean API token (can be moved to environment variables later)
  const token = 'LOlifCRAD8smihnO8ETHiku7Rmy5zDO5hEgTruy6luQ=';

  const runStrategicAccountPlan = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get company name
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
      
      console.log('Calling Glean API via HubSpot serverless function for:', companyName);
      
      // Call HubSpot serverless function (bypasses CSP restrictions)
      const serverlessResult = await runServerlessFunction({
        name: 'glean-proxy',
        propertiesToSend: ['name'],
        parameters: {
          companyName: companyName
        }
      });
      
      console.log('Serverless function result:', serverlessResult);
      
      // Handle error responses
      if (serverlessResult.status === 'ERROR') {
        throw new Error(serverlessResult.message || 'Serverless function failed');
      }
      
      // The new format should return the response directly
      if (serverlessResult.response) {
        const response = serverlessResult.response;
        console.log('Response object:', response);
        
        if (response.statusCode && response.statusCode !== 200) {
          const errorData = typeof response.body === 'string' 
            ? JSON.parse(response.body)
            : response.body;
          throw new Error(errorData?.error || errorData?.message || 'Serverless function error');
        }
        
        // Parse the successful response
        const resultData = typeof response.body === 'string' 
          ? JSON.parse(response.body)
          : response.body;
        
        console.log('Parsed result data:', resultData);
        setResult(resultData);
      } else {
        // Direct response format
        console.log('Direct response format:', serverlessResult);
        setResult(serverlessResult);
      }
    } catch (err) {
      console.error('Error running Glean agent:', err);
      console.error('Error type:', err.name);
      console.error('Error stack:', err.stack);
      
      // Provide more specific error messages
      if (err.message.includes('Failed to fetch')) {
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
      {!result && !isLoading && !error && (
        <Box padding="small">
          <Text>Generate Strategic Account Plan for this company using Trace3 Glean Agent:</Text>
          <Button 
            variant="primary" 
            onClick={runStrategicAccountPlan}
            disabled={isLoading}
          >
            Generate Plan
          </Button>
          <Box padding="small">
            <Text variant="microcopy">🔄 Real Glean Integration: Uses HubSpot serverless function to call Trace3 Glean API.</Text>
          </Box>
        </Box>
      )}

      {isLoading && (
        <Box padding="small">
          <Text>⏳ Generating Strategic Account Plan...</Text>
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

      {result && (
        <Box padding="small">
          <Text variant="h4">Strategic Account Plan Results:</Text>
          <Text>Status: {result.run?.status}</Text>
          {result.messages?.map((message, index) => (
            <Box key={index} padding="small">
              <Text variant="bold">{message.role}:</Text>
              {message.content?.map((content, contentIndex) => (
                <Text key={contentIndex}>{content.text}</Text>
              ))}
            </Box>
          ))}
          <Button 
            variant="secondary" 
            onClick={() => {
              setResult(null);
              setError(null);
            }}
          >
            Run New Analysis
          </Button>
        </Box>
      )}
    </Box>
  );
};

hubspot.extend(({ context, actions, runServerlessFunction }) => (
  <GleanCard context={context} actions={actions} runServerlessFunction={runServerlessFunction} />
)); 
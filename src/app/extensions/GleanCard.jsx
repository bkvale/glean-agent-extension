import React, { useState } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions }) => {
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
      if (!token) {
        throw new Error('Missing Glean API token. Add your token to run the analysis.');
      }
      
      // Try to get company name using actions if available
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
      
      console.log('Making Glean API request for company:', companyName);
      console.log('Token length:', token ? token.length : 'No token');
      
      const requestBody = {
        agent_id: '5057a8a588c649d6b1231d648a9167c8',
        input: {
          company_name: companyName
        }
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('https://trace3-be.glean.com/rest/api/v1/agents/runs/wait', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`Glean API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
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
            disabled={isLoading || !token}
          >
            Generate Plan
          </Button>
          {!token && (
            <Box padding="small">
              <Text variant="microcopy">⚠️ Glean API token not configured. Contact your admin to set up the GLEAN_API_TOKEN environment variable.</Text>
            </Box>
          )}
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

hubspot.extend(({ context, actions }) => (
  <GleanCard context={context} actions={actions} />
)); 
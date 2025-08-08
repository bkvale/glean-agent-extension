import React, { useState } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

      console.log('Calling Glean API via HubSpot serverless function for:', companyName);

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

      setResult(response);
    } catch (err) {
      console.error('Error running Glean agent:', err);
      console.error('Error type:', err.name);
      console.error('Error stack:', err.stack);

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
      <Text variant="h3">Strategic Account Plan</Text>

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
          {result.messages?.map((message, index) => (
            <Box key={index} padding="small">
              <Text variant="bold">{message.role === 'GLEAN_AI' ? 'Strategic Account Plan:' : message.role}:</Text>
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
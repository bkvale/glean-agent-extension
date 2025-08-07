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
      // TODO: Replace with actual Bearer token
      const token = 'YOUR_GLEAN_TOKEN_HERE';
      
      if (token === 'YOUR_GLEAN_TOKEN_HERE') {
        throw new Error('Please add your Glean Bearer token to the code. Replace "YOUR_GLEAN_TOKEN_HERE" with your actual token.');
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
      
      const response = await fetch('https://trace3-be.glean.com/rest/api/v1/agents/runs/wait', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: '5057a8a588c649d6b1231d648a9167c8',
          input: {
            company_name: companyName
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Glean API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error running Glean agent:', err);
      
      // Provide more specific error messages
      if (err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to Glean API. Please check your internet connection and Glean token.');
      } else if (err.message.includes('Bearer token')) {
        setError(err.message);
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
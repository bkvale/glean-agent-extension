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

      console.log('Starting Glean knowledge search for:', companyName);

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
              searchResults: gleanData.metadata?.searchResults || 0,
              requestId: gleanData.metadata?.requestId
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
      console.error('Error running Glean search:', err);
      console.error('Error type:', err.name);
      console.error('Error stack:', err.stack);

      // Handle categorized errors from serverless function
      if (err.message.includes('Serverless function failed:')) {
        const errorBody = err.message.replace('Serverless function failed: ', '');
        setError(errorBody);
      } else if (err.message.includes('timeout')) {
        setError(`The Glean search is taking longer than expected to respond. This might be due to network issues or the search query being too complex.`);
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

      {!result && !isLoading && !error && (
        <Box padding="small">
          <Text>Generate Strategic Account Plan for this company using Glean knowledge base search:</Text>
          
          <Box padding="small">
            <Text variant="small">
              🔍 Using Glean search to find relevant company information
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
          <Text>🔍 Searching Glean knowledge base for company information...</Text>
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
          {result.metadata?.searchResults !== undefined && (
            <Text variant="small">Knowledge base results: {result.metadata.searchResults} documents found</Text>
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
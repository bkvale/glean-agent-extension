import React, { useState } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

// Architecture stubs for future async flow and external worker support
const FEATURE_FLAGS = {
  USE_ASYNC_FLOW: false, // Branch A: Start + Poll async flow
  USE_EXTERNAL_WORKER: false // Branch B: External worker service
};

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
  const [isPolling, setIsPolling] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  // Always use async mode since Glean agent is slow
  const asyncMode = true;

  // Poll for completion of async job
  const pollForCompletion = async (companyName, maxAttempts = 30) => {
    setIsPolling(true);
    setPollingCount(0);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setPollingCount(attempt);
      
      try {
        console.log(`Polling attempt ${attempt}/${maxAttempts} for completion...`);
        
        const response = await hubspot.serverless('glean-proxy', {
          propertiesToSend: ['name'],
          parameters: {
            companyName: companyName,
            checkStatus: true,
            attempt: attempt
          }
        });
        
        console.log(`Poll response ${attempt}:`, response);
        
        if (response?.statusCode === 200 && response?.body?.messages) {
          // Job completed successfully
          console.log('Job completed!', response.body);
          setResult(response.body);
          setIsPolling(false);
          return;
        } else if (response?.statusCode === 202) {
          // Still running, continue polling
          console.log('Job still running, continuing to poll...');
          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        } else if (response?.statusCode === 500) {
          // Server error, wait longer and try again
          console.log('Server error, waiting longer before retry...');
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
        } else {
          // Error or unexpected response
          console.error('Unexpected poll response:', response);
          setError('Error checking job status. Please try again.');
          setIsPolling(false);
          return;
        }
      } catch (error) {
        console.error(`Poll attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) {
          setError('Job timed out after 5 minutes. Please try again.');
          setIsPolling(false);
          return;
        }
        // Wait longer on errors
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
      }
    }
    
    setError('Job timed out after 5 minutes. Please try again.');
    setIsPolling(false);
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

      console.log('Calling Glean API via HubSpot serverless function for:', companyName);
      console.log('Async mode enabled:', asyncMode);

      const response = await hubspot.serverless('glean-proxy', {
        propertiesToSend: ['name'],
        parameters: {
          companyName: companyName,
          asyncMode: asyncMode
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
      if (response.statusCode && response.statusCode !== 200 && response.statusCode !== 202) {
        console.error('Serverless function error:', response);
        const errorMessage = response.body?.error || response.body?.message || 'Unknown serverless function error';
        throw new Error(`Serverless function failed: ${errorMessage}`);
      }

      // The serverless function returns { statusCode: 200, body: data }
      // We need to access response.body for the actual Glean data
      const gleanData = response.body || response;
      
      console.log('Glean data after extraction:', gleanData);
      console.log('Glean data type:', typeof gleanData);
      console.log('Glean data keys:', Object.keys(gleanData || {}));

      // Add validation for response structure
      if (!gleanData || typeof gleanData !== 'object') {
        console.error('Glean data is not an object:', gleanData);
        throw new Error('Invalid response structure: gleanData is not an object');
      }

      // Handle async response (status 202)
      if (response.statusCode === 202) {
        setResult({
          async: true,
          status: 'started',
          message: gleanData.message || 'Generation started',
          companyName: gleanData.companyName
        });
        
        // Start polling for completion
        pollForCompletion(companyName);
        return;
      }

      // Handle missing messages gracefully
      if (!gleanData.messages || !Array.isArray(gleanData.messages)) {
        console.error('Invalid response structure - full response:', JSON.stringify(response, null, 2));
        console.error('Invalid response structure - glean data:', JSON.stringify(gleanData, null, 2));
        console.error('Messages property:', gleanData.messages);
        console.error('Messages is array?', Array.isArray(gleanData.messages));
        
        // Instead of throwing, show a user-friendly message
        setResult({
          error: true,
          message: 'Received response from Glean but it was in an unexpected format. Please try again.',
          rawData: gleanData
        });
        return;
      }

                        console.log('Setting result with messages:', gleanData.messages);
                  
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
                        duration: gleanData.metadata?.duration
                      });
                    } catch (saveError) {
                      console.warn('Failed to save plan:', saveError);
                      // Don't fail the UI if save fails
                    }
                  }
                  
                  setResult(gleanData);
    } catch (err) {
      console.error('Error running Glean agent:', err);
      console.error('Error type:', err.name);
      console.error('Error stack:', err.stack);

                        // Handle categorized errors from serverless function
                  if (err.message.includes('Serverless function failed:')) {
                    const errorBody = err.message.replace('Serverless function failed: ', '');
                    setError(errorBody);
                  } else if (err.message.includes('timeout')) {
                    setError(`The Glean agent is taking longer than expected to respond (30+ seconds). This is normal for complex analysis. Consider enabling async mode for long-running agents.`);
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
                      <Text>Generate Strategic Account Plan for this company using Trace3 Glean Agent:</Text>
                      
                      <Box padding="small">
                        <Text variant="small">
                          ⚡ Using async mode for optimal performance
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
          <Text>⏳ Generating Strategic Account Plan...</Text>
        </Box>
      )}

      {isPolling && (
        <Box padding="small">
          <Text>🔄 Checking for completion... (Attempt {pollingCount}/30)</Text>
          <Text variant="small">This may take 2-3 minutes. Checking every 30-60 seconds.</Text>
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

          {/* Handle async response */}
          {result.async && (
            <Box padding="small">
              <Text variant="success">✅ {result.message}</Text>
              <Text variant="small">The agent is running in the background. This may take 1-2 minutes to complete.</Text>
            </Box>
          )}

          {/* Handle error response */}
          {result.error && (
            <Box padding="small">
              <Text variant="error">⚠️ {result.message}</Text>
              <Text variant="small">Please try again or contact support if this persists.</Text>
            </Box>
          )}

          {/* Handle normal response */}
          {result.messages && Array.isArray(result.messages) && (
            result.messages.map((message, index) => (
              <Box key={index} padding="small">
                <Text variant="bold">{message.role === 'GLEAN_AI' ? 'Strategic Account Plan:' : message.role}:</Text>
                {message.content && Array.isArray(message.content) ? (
                  message.content.map((content, contentIndex) => (
                    <Text key={contentIndex}>{content.text || 'No text content'}</Text>
                  ))
                ) : (
                  <Text>No content available</Text>
                )}
              </Box>
            ))
          )}

          {/* Show raw data for debugging */}
          {result.rawData && (
            <Box padding="small">
              <Text variant="small">Debug Info:</Text>
              <Text variant="small">{JSON.stringify(result.rawData, null, 2)}</Text>
            </Box>
          )}

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
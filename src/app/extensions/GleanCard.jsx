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
  const [isPolling, setIsPolling] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [currentJobId, setCurrentJobId] = useState(null);

  // Poll for completion of async job
  const pollForCompletion = async (jobId, maxAttempts = 30) => {
    setIsPolling(true);
    setPollingCount(0);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setPollingCount(attempt);
      
      try {
        console.log(`Polling attempt ${attempt}/${maxAttempts} for job ${jobId}...`);
        
        const response = await hubspot.serverless('glean-proxy', {
          propertiesToSend: ['name'],
          parameters: {
            jobId: jobId,
            action: 'check_status'
          }
        });
        
        console.log(`Poll response ${attempt}:`, response);
        
        if (response?.statusCode === 200 && response?.body?.messages) {
          // Job completed successfully
          console.log('Job completed!', response.body);
          
          // Save the plan to persistent storage
          if (response.body.messages && Array.isArray(response.body.messages)) {
            const companyId = context.crm?.objectId;
            const planContent = response.body.messages
              .map(msg => msg.content?.map(c => c.text).join(' '))
              .join('\n\n');
            
            try {
              await savePlan(companyId, planContent, {
                timestamp: new Date().toISOString(),
                jobId: jobId,
                duration: response.body.metadata?.duration
              });
            } catch (saveError) {
              console.warn('Failed to save plan:', saveError);
              // Don't fail the UI if save fails
            }
          }
          
          setResult(response.body);
          setIsPolling(false);
          setCurrentJobId(null);
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
          setCurrentJobId(null);
          return;
        }
      } catch (error) {
        console.error(`Poll attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) {
          setError('Job timed out after 5 minutes. Please try again.');
          setIsPolling(false);
          setCurrentJobId(null);
          return;
        }
        // Wait longer on errors
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
      }
    }
    
    setError('Job timed out after 5 minutes. Please try again.');
    setIsPolling(false);
    setCurrentJobId(null);
  };

  const runStrategicAccountPlan = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentJobId(null);

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

      console.log('Starting Glean agent job for:', companyName);

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
      if (response.statusCode && response.statusCode !== 200 && response.statusCode !== 202) {
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

      // Handle job started response (status 202)
      if (response.statusCode === 202 && gleanData.jobId) {
        console.log('Job started with ID:', gleanData.jobId);
        setCurrentJobId(gleanData.jobId);
        
        setResult({
          async: true,
          status: 'started',
          message: gleanData.message || 'Generation started',
          companyName: gleanData.companyName,
          jobId: gleanData.jobId
        });
        
        // Start polling for completion
        pollForCompletion(gleanData.jobId);
        return;
      }

      // Handle immediate completion (status 200)
      if (response.statusCode === 200 && gleanData.messages) {
        console.log('Job completed immediately:', gleanData);
        
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
              ⚡ Using job tracking for reliable long-running agents
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
          <Text>⏳ Starting Strategic Account Plan generation...</Text>
        </Box>
      )}

      {isPolling && (
        <Box padding="small">
          <Text>🔄 Checking for completion... (Attempt {pollingCount}/30)</Text>
          <Text variant="small">This may take 2-3 minutes. Checking every 30-60 seconds.</Text>
          {currentJobId && (
            <Text variant="small">Job ID: {currentJobId}</Text>
          )}
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
          {result.async && result.status === 'started' ? (
            <Box>
              <Text variant="success">✅ {result.message}</Text>
              <Text variant="small">Job ID: {result.jobId}</Text>
              <Text variant="small">Company: {result.companyName}</Text>
            </Box>
          ) : (
            <Box>
              <Text variant="success">✅ Strategic Account Plan Generated!</Text>
              <Text variant="small">Company: {result.metadata?.companyName || 'Unknown'}</Text>
              
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
      )}
    </Box>
  );
};

export default GleanCard; 
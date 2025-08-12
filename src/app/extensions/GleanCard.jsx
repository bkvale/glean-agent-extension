import React, { useState, useEffect } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions }) => {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const openGleanAgentModal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Opening Glean agent modal for:', companyName);

      // Create a simple HTML page that embeds the Glean agent
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Strategic Account Plan - ${companyName}</title>
  <script src="https://app.glean.com/embedded-search-latest.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #333; margin: 0 0 10px 0; }
    .header p { color: #666; margin: 0; }
    #glean-app { height: 500px; border: 1px solid #ddd; border-radius: 4px; }
    .loading { text-align: center; padding: 50px; color: #666; }
    .error { color: #e74c3c; text-align: center; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Strategic Account Plan</h1>
      <p>Generating insights for <strong>${companyName}</strong></p>
    </div>
    
    <div id="glean-app">
      <div class="loading">Loading Glean Agent...</div>
    </div>
  </div>

  <script>
    // Wait for the page to load
    window.addEventListener('load', function() {
      try {
        // Check if GleanWebSDK is available
        if (typeof GleanWebSDK !== 'undefined') {
          console.log('GleanWebSDK loaded, rendering agent...');
          // Render the Glean agent
          GleanWebSDK.renderChat(
            document.getElementById('glean-app'),
            {
              agentId: "5057a8a588c649d6b1231d648a9167c8"
            }
          );
        } else {
          console.error('GleanWebSDK not available');
          document.getElementById('glean-app').innerHTML = 
            '<div class="error">Failed to load Glean Web SDK. Please check your internet connection.</div>';
        }
      } catch (error) {
        console.error('Error rendering Glean agent:', error);
        document.getElementById('glean-app').innerHTML = 
          '<div class="error">Error loading Glean agent: ' + error.message + '</div>';
      }
    });
  </script>
</body>
</html>`;

      // Create a data URL for the HTML content
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);

      console.log('Opening iframe modal with data URL...');

      // Open the iframe modal with the Glean agent
      await actions.openIframeModal({
        title: `Strategic Account Plan - ${companyName}`,
        url: dataUrl,
        width: 900,
        height: 700
      });

    } catch (err) {
      console.error('Error opening Glean agent modal:', err);
      setError(`Failed to open Glean agent: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box padding="medium">
      <Text variant="h3">Strategic Account Plan</Text>
      
      {!isLoading && !error && (
        <Box padding="small">
          <Text>Generate Strategic Account Plan for {companyName} using Glean AI Agent:</Text>

          <Box padding="small">
            <Text variant="small">
              🤖 Opens Glean AI Agent in a modal window to avoid timeout issues
            </Text>
            <Text variant="small">
              💡 The agent will run directly in your browser, allowing for longer execution times
            </Text>
          </Box>

          <Button
            variant="primary"
            onClick={openGleanAgentModal}
            disabled={isLoading}
          >
            Open Glean Agent
          </Button>
        </Box>
      )}

      {isLoading && (
        <Box padding="small">
          <Text>🔄 Opening Glean AI Agent in modal window...</Text>
        </Box>
      )}

      {error && (
        <Box padding="small">
          <Text variant="error">Error: {error}</Text>
          <Button
            variant="secondary"
            onClick={openGleanAgentModal}
          >
            Try Again
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
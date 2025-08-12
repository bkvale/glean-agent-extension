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

      // Create an HTML page that embeds the Glean agent
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Strategic Account Plan - ${companyName}</title>
          <script defer src="https://app.glean.com/embedded-search-latest.min.js"></script>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8f9fa;
            }
            .header {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header h1 {
              margin: 0 0 10px 0;
              color: #2c3e50;
              font-size: 24px;
            }
            .header p {
              margin: 0;
              color: #7f8c8d;
              font-size: 14px;
            }
            #glean-app {
              position: relative;
              display: block;
              height: 600px;
              width: 100%;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .loading {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #7f8c8d;
            }
            .error {
              padding: 20px;
              color: #e74c3c;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Strategic Account Plan</h1>
            <p>Generating strategic insights for <strong>${companyName}</strong> using Glean AI Agent</p>
          </div>
          
          <div id="glean-app">
            <div class="loading">Loading Glean Agent...</div>
          </div>

          <script>
            document.addEventListener('DOMContentLoaded', () => {
              try {
                // Check if GleanWebSDK is available
                if (typeof GleanWebSDK !== 'undefined') {
                  // Render the Glean agent
                  GleanWebSDK.renderChat(
                    document.getElementById('glean-app'),
                    {
                      agentId: "5057a8a588c649d6b1231d648a9167c8"
                    }
                  );
                } else {
                  // Fallback if SDK doesn't load
                  document.getElementById('glean-app').innerHTML = 
                    '<div class="error">Failed to load Glean Web SDK. Please refresh the page.</div>';
                }
              } catch (error) {
                console.error('Error rendering Glean agent:', error);
                document.getElementById('glean-app').innerHTML = 
                  '<div class="error">Error loading Glean agent: ' + error.message + '</div>';
              }
            });
          </script>
        </body>
        </html>
      `;

      // Create a blob URL for the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      // Open the iframe modal with the Glean agent
      await actions.openIframeModal({
        title: `Strategic Account Plan - ${companyName}`,
        url: blobUrl,
        width: 800,
        height: 700
      });

      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

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
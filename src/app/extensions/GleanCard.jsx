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

      // Open the Glean agent directly in the iframe modal
      await actions.openIframeModal(
        {
          uri: 'https://app.glean.com/agents/5057a8a588c649d6b1231d648a9167c8',
          title: `Strategic Account Plan - ${companyName}`,
          width: 1000,
          height: 800,
          flush: true
        },
        () => {
          console.log('Glean agent modal closed');
        }
      );

    } catch (err) {
      console.error('Error opening Glean agent modal:', err);
      setError(`Failed to open Glean agent: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAgentLink = async () => {
    try {
      const agentUrl = 'https://app.glean.com/agents/5057a8a588c649d6b1231d648a9167c8';
      await actions.copyTextToClipboard(agentUrl);
      actions.addAlert({
        type: 'success',
        message: 'Glean agent link copied to clipboard!'
      });
    } catch (error) {
      console.error('Error copying agent link:', error);
      actions.addAlert({
        type: 'warning',
        message: 'Failed to copy agent link to clipboard.'
      });
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
              🤖 Opens the Glean AI Agent directly in a modal window
            </Text>
            <Text variant="small">
              💡 The agent will run in your browser, allowing for full execution time
            </Text>
          </Box>

          <Box padding="small">
            <Button
              variant="primary"
              onClick={openGleanAgentModal}
              disabled={isLoading}
            >
              Open Glean Agent
            </Button>
          </Box>

          <Box padding="small">
            <Text variant="small">
              Or copy the agent link to access it later:
            </Text>
            <Button
              variant="secondary"
              onClick={copyAgentLink}
            >
              Copy Agent Link
            </Button>
          </Box>
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
import React, { useState, useEffect } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions }) => {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const openGleanModal = async () => {
    setIsLoading(true);
    
    try {
      // Construct the Glean URL with the agent and company name
      const gleanUrl = `https://trace3-be.glean.com/agents/5057a8a588c649d6b1231d648a9167c8?company=${encodeURIComponent(companyName)}`;
      
      // Open iframe modal using the correct HubSpot API
      await actions.openIframeModal({
        title: `Strategic Account Plan - ${companyName}`,
        url: gleanUrl,
        width: 1200,
        height: 800
      });
    } catch (error) {
      console.error('Error opening Glean modal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box padding="medium">
      <Text variant="h3">Strategic Account Plan</Text>
      
      <Box padding="small">
        <Text>
          Generate a comprehensive strategic account plan for {companyName} using Glean AI.
        </Text>
        
        <Box padding="small">
          <Text variant="small">
            🤖 This will open the "T3 Marketing: Strategic Account Plan Agent" in a new window.
          </Text>
        </Box>
        
        <Box padding="small">
          <Button
            variant="primary"
            onClick={openGleanModal}
            disabled={isLoading}
          >
            {isLoading ? 'Opening...' : '🚀 Generate Strategic Account Plan'}
          </Button>
        </Box>
        
        <Box padding="small">
          <Text variant="small">
            💡 The agent will automatically start generating a strategic account plan for {companyName}. 
            You can interact with it directly in the Glean interface.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default GleanCard;

// Register the extension with HubSpot
hubspot.extend(({ context, actions }) => (
  <GleanCard context={context} actions={actions} />
));
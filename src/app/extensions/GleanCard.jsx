import React, { useState, useEffect } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions }) => {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [iframeStatus, setIframeStatus] = useState('idle');

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

  const openGleanAgentIframe = async () => {
    setIsLoading(true);
    setError(null);
    setIframeStatus('loading');

    try {
      console.log('Opening Glean agent iframe for:', companyName);

      // Open the Glean agent directly in the iframe modal
      // NOTE: This will be blocked by X-Frame-Options: DENY header
      // and CORS policies when the iframe tries to make API calls to apps-be.glean.com
      await actions.openIframeModal(
        {
          uri: 'https://app.glean.com/agents/5057a8a588c649d6b1231d648a9167c8',
          title: `Strategic Account Plan - ${companyName}`,
          width: 1000,
          height: 800,
          flush: true
        },
        () => {
          console.log('Glean agent iframe modal closed');
          setIframeStatus('closed');
        }
      );

      setIframeStatus('loaded');

    } catch (err) {
      console.error('Error opening Glean agent iframe:', err);
      setError(`Failed to open Glean agent iframe: ${err.message}`);
      setIframeStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const openGleanAgentNewTab = () => {
    const agentUrl = 'https://app.glean.com/agents/5057a8a588c649d6b1231d648a9167c8';
    window.open(agentUrl, '_blank', 'noopener,noreferrer');
    
    actions.addAlert({
      type: 'success',
      message: 'Glean agent opened in new tab (bypasses iframe restrictions)'
    });
  };

  return (
    <Box padding="medium">
      <Text variant="h3">Strategic Account Plan - Iframe Prototype</Text>
      
      <Box padding="small">
        <Text variant="small" fontWeight="bold">
          🔬 Iframe Embed Prototype - Demonstrates Security Limitations
        </Text>
        <Text variant="small">
          This prototype shows the iframe approach up to the point where security policies block it.
        </Text>
      </Box>

      {!isLoading && !error && (
        <Box padding="small">
          <Text>Generate Strategic Account Plan for {companyName} using Glean AI Agent:</Text>

          <Box padding="small">
            <Text variant="small" fontWeight="bold">
              Option 1: Iframe Modal (Will be blocked)
            </Text>
            <Text variant="small">
              Attempts to embed Glean agent in iframe - blocked by X-Frame-Options: DENY
            </Text>
            <Button
              variant="primary"
              onClick={openGleanAgentIframe}
              disabled={isLoading}
            >
              Try Iframe Embed
            </Button>
          </Box>

          <Box padding="small">
            <Text variant="small" fontWeight="bold">
              Option 2: New Tab (Works around restrictions)
            </Text>
            <Text variant="small">
              Opens Glean agent in new tab - bypasses all iframe security limitations
            </Text>
            <Button
              variant="secondary"
              onClick={openGleanAgentNewTab}
            >
              Open in New Tab
            </Button>
          </Box>

          {iframeStatus === 'loaded' && (
            <Box padding="small">
              <Text variant="success">
                ✅ Iframe loaded successfully! However, the Glean agent inside may be blocked by:
              </Text>
              <Text variant="small">
                • X-Frame-Options: DENY header
              </Text>
              <Text variant="small">
                • CORS policies blocking API calls to apps-be.glean.com
              </Text>
              <Text variant="small">
                • Content Security Policy restrictions
              </Text>
            </Box>
          )}
        </Box>
      )}

      {isLoading && (
        <Box padding="small">
          <Text>🔄 Opening Glean agent iframe...</Text>
        </Box>
      )}

      {error && (
        <Box padding="small">
          <Text variant="error">Error: {error}</Text>
          <Text variant="small">
            This error demonstrates the iframe security limitations we're documenting.
          </Text>
          <Button
            variant="secondary"
            onClick={openGleanAgentIframe}
          >
            Try Again
          </Button>
        </Box>
      )}

      <Box padding="small">
        <Text variant="small" fontWeight="bold">
          🔍 Technical Notes for Reviewers:
        </Text>
        <Text variant="small">
          • Iframe loads the Glean UI but internal API calls fail due to CORS
        </Text>
        <Text variant="small">
          • X-Frame-Options: DENY prevents iframe embedding in production
        </Text>
        <Text variant="small">
          • apps-be.glean.com API calls are blocked by same-origin policy
        </Text>
        <Text variant="small">
          • This demonstrates why iframe embedding isn't viable for complex web apps
        </Text>
      </Box>
    </Box>
  );
};

export default GleanCard;

// Register the extension with HubSpot
hubspot.extend(({ context, actions }) => (
  <GleanCard context={context} actions={actions} />
));
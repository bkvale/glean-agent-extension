import React, { useState, useEffect, useRef } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = ({ context, actions }) => {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGleanReady, setIsGleanReady] = useState(false);
  const [error, setError] = useState(null);
  const gleanContainerRef = useRef(null);

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

  // Load Glean Web SDK safely
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const loadGleanSDK = async () => {
      try {
        // Check if already loaded
        if (window.GleanWebSDK) {
          setIsGleanReady(true);
          return;
        }

        // Load the Glean Web SDK script
        const script = document.createElement('script');
        script.src = 'https://app.glean.com/embedded-search-latest.min.js';
        script.defer = true;
        
        script.onload = () => {
          // Listen for Glean ready event
          window.addEventListener('glean:ready', () => {
            setIsGleanReady(true);
          });
          
          // If already ready, set immediately
          if (window.GleanWebSDK) {
            setIsGleanReady(true);
          }
        };
        
        script.onerror = (error) => {
          console.error('Failed to load Glean Web SDK:', error);
          setError('Failed to load Glean AI Agent. Please refresh the page and try again.');
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Glean SDK:', error);
        setError('Failed to load Glean AI Agent.');
      }
    };

    loadGleanSDK();
  }, []);

  // Initialize Glean chat when ready
  useEffect(() => {
    if (typeof window === 'undefined' || !isGleanReady || !gleanContainerRef.current || !companyName) {
      return;
    }

    try {
      // Follow the Glean embed guidelines exactly
      window.GleanWebSDK.renderChat(gleanContainerRef.current, {
        agentId: "5057a8a588c649d6b1231d648a9167c8",
        initialMessage: `Generate a strategic account plan for ${companyName}. Include company overview, key insights, strategic recommendations, and next steps.`,
        backend: "https://trace3-be.glean.com/",
        landingPage: "chat",
        authMethod: "sso",
        themeVariant: "auto",
        customizations: {
          features: {
            agentLibrary: false,      // Focus on our specific agent
            applicationLibrary: false,
            createPrompt: false,      // Simplify UI
            promptLibrary: false,
            chatMenu: true,           // Keep chat history
            chatSettings: true,       // Keep settings
            clearChat: true,          // Allow clearing chat
            feedback: true,           // Keep feedback
            newChatButton: true       // Allow new chats
          },
          container: {
            border: "1px solid #e1e5e9",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            horizontalMargin: 0,
            verticalMargin: 16
          }
        }
      });
      
    } catch (error) {
      console.error('Error initializing Glean chat:', error);
      setError('Failed to initialize Glean AI Agent. Please refresh the page and try again.');
    }
  }, [isGleanReady, companyName]);

  // Show error state
  if (error) {
    return (
      <Box padding="medium">
        <Text variant="h3">Strategic Account Plan</Text>
        <Box padding="small">
          <Text variant="error">Error: {error}</Text>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box padding="medium">
      <Text variant="h3">Strategic Account Plan</Text>
      
      {!isGleanReady && (
        <Box padding="small">
          <Text>Loading Glean AI Agent...</Text>
        </Box>
      )}
      
      {isGleanReady && companyName && (
        <Box padding="small">
          <Text variant="small">
            🤖 Glean AI Agent ready for {companyName}
          </Text>
          
          <Box padding="small">
            <Text variant="small">
              The agent will automatically start generating a strategic account plan. 
              You can interact with it directly in the chat interface below.
            </Text>
          </Box>
          
          {/* Glean Chat Container - following embed guidelines */}
          <Box 
            ref={gleanContainerRef}
            style={{
              position: 'relative',
              display: 'block',
              height: '600px',
              width: '100%',
              minHeight: '400px'
            }}
          />
        </Box>
      )}
      
      {isGleanReady && !companyName && (
        <Box padding="small">
          <Text variant="error">Unable to load company information</Text>
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
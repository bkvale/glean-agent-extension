import React, { useState, useEffect, useRef } from 'react';
import { hubspot, Text, Box, Button } from '@hubspot/ui-extensions';

// Save plan to HubSpot (keeping this for manual save functionality)
const savePlan = async (actions, planContent, companyName) => {
  try {
    // For now, we'll save to a custom property if it exists
    // In a real implementation, you might want to create a custom object or use a long text property
    console.log('Saving plan to HubSpot:', { planContent, companyName });
    
    // This is a placeholder - you'd need to implement actual saving logic
    // based on your HubSpot setup (custom objects, properties, etc.)
    return true;
  } catch (error) {
    console.error('Error saving plan:', error);
    return false;
  }
};

// Get the latest plan (placeholder)
const getLatestPlan = async (actions, companyName) => {
  try {
    // This would fetch the latest saved plan for the company
    // Implementation depends on how you're storing the data
    return null;
  } catch (error) {
    console.error('Error getting latest plan:', error);
    return null;
  }
};

const GleanCard = ({ context, actions }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGleanReady, setIsGleanReady] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [chatHandle, setChatHandle] = useState(null);
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

  // Load Glean Web SDK
  useEffect(() => {
    const loadGleanSDK = () => {
      // Check if Glean SDK is already loaded
      if (window.GleanWebSDK) {
        setIsGleanReady(true);
        return;
      }

      // Load the Glean Web SDK script
      const script = document.createElement('script');
      script.src = 'https://trace3-be.glean.com/embedded-search-latest.min.js';
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
      };
      
      document.head.appendChild(script);
    };

    loadGleanSDK();
  }, []);

  // Initialize Glean chat when ready
  useEffect(() => {
    if (isGleanReady && gleanContainerRef.current && companyName && !chatHandle) {
      try {
        const handle = window.GleanWebSDK.renderChat(gleanContainerRef.current, {
          agentId: "5057a8a588c649d6b1231d648a9167c8", // T3 Marketing: Strategic Account Plan Agent
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
        
        setChatHandle(handle);
        
        // Listen for chat events
        handle.on("chat:id_update", (event) => {
          console.log("Chat updated:", event.chatId);
        });
        
        // Listen for page view events
        handle.on("chat:page_view", (event) => {
          console.log("Chat page viewed");
        });
        
      } catch (error) {
        console.error('Error initializing Glean chat:', error);
      }
    }
  }, [isGleanReady, companyName, chatHandle]);

  const handleSaveToHubSpot = async () => {
    setIsLoading(true);
    try {
      // This would capture the chat content and save to HubSpot
      // For now, we'll show a placeholder message
      console.log('Save to HubSpot functionality would be implemented here');
      
      // You could implement this by:
      // 1. Capturing the chat content from the iframe
      // 2. Using the existing serverless function to save to CRM fields
      // 3. Or creating a new serverless function for saving
      
    } catch (error) {
      console.error('Error saving to HubSpot:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          
          {/* Glean Chat Container */}
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
          
          {/* Save to HubSpot Button */}
          <Box padding="small">
            <Button
              variant="secondary"
              onClick={handleSaveToHubSpot}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : '💾 Save Plan to HubSpot'}
            </Button>
            <Text variant="small">
              Click this button to save the generated plan to HubSpot CRM fields
            </Text>
          </Box>
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
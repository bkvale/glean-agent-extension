import React from 'react';
import { hubspot, Text, Box } from '@hubspot/ui-extensions';

const GleanCard = ({ context }) => {
  console.log('GleanCard component rendering with context:', context);
  
  try {
    return (
      <Box padding="medium">
        <Text>Strategic Account Plan</Text>
        <Text>Hello from Glean Test Card!</Text>
        <Text>Extension is working!</Text>
        <Text>Context: {JSON.stringify(context)}</Text>
      </Box>
    );
  } catch (error) {
    console.error('Error in GleanCard:', error);
    return (
      <Box padding="medium">
        <Text>Error loading content</Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }
};

hubspot.extend(({ context, actions }) => (
  <GleanCard context={context} />
)); 
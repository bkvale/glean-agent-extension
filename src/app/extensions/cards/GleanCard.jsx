import React from 'react';
import { Text, Box, Button } from '@hubspot/ui-extensions';

const GleanCard = () => {
  console.log('GleanCard component loaded');
  
  return (
    <Box padding="medium">
      <Text variant="h3">Strategic Account Plan</Text>
      <Text>Hello from Glean Test Card!</Text>
      <Button 
        variant="primary" 
        onClick={() => console.log('Button clicked')}
      >
        Test Button
      </Button>
    </Box>
  );
};

export default GleanCard; 
import React from 'react';
import { hubspot, Text, Box } from '@hubspot/ui-extensions';

hubspot.extend<'crm.record.sidebar'>(({ context, actions }) => (
  <GleanCard context={context} />
));

const GleanCard = ({ context }) => {
  return (
    <Box padding="medium">
      <Text>Strategic Account Plan</Text>
      <Text>Hello from Glean Test Card!</Text>
      <Text>Extension is working!</Text>
    </Box>
  );
}; 
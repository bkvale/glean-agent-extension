// HubSpot Serverless Function to proxy Glean API requests
// This bypasses Content Security Policy restrictions in UI Extensions

const fetch = require('node-fetch');

exports.main = async (context, sendResponse) => {
  console.log('Glean proxy function called with context:', JSON.stringify(context, null, 2));
  
  try {
    const { companyName } = context.body || context.parameters || {};
    
    if (!companyName) {
      return sendResponse({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Company name is required',
          received: context
        })
      });
    }
    
    console.log('Making Glean API request for company:', companyName);
    
    // Get the private app access token from environment variables
    const gleanToken = process.env.GLEAN_API_TOKEN;
    
    if (!gleanToken) {
      return sendResponse({
        statusCode: 500,
        body: JSON.stringify({
          error: 'Glean API token not configured in environment variables'
        })
      });
    }
    
    const response = await fetch('https://trace3-be.glean.com/rest/api/v1/agents/runs/wait', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gleanToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: '5057a8a588c649d6b1231d648a9167c8',
        input: {
          company_name: companyName
        }
      })
    });

    console.log('Glean API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Glean API error response:', errorText);
      return sendResponse({
        statusCode: response.status,
        body: JSON.stringify({
          error: `Glean API error: ${response.status} ${response.statusText}`,
          details: errorText
        })
      });
    }

    const data = await response.json();
    console.log('Glean API success, returning data');
    
    sendResponse({
      statusCode: 200,
      body: JSON.stringify(data)
    });
    
  } catch (error) {
    console.error('Glean proxy function error:', error);
    
    sendResponse({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate strategic account plan',
        message: error.message,
        details: error.stack
      })
    });
  }
}; 
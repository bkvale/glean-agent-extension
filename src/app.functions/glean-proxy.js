// HubSpot Serverless Function to proxy Glean API requests
exports.main = async (context = {}) => {
  console.log('Glean proxy function called with context:', JSON.stringify(context, null, 2));
  
  try {
    const { companyName } = context.parameters || {};
    
    if (!companyName) {
      return {
        statusCode: 400,
        body: {
          error: 'Company name is required',
          received: context
        }
      };
    }
    
    console.log('Making Glean API request for company:', companyName);
    
    // Use the Glean API token directly for now
    const gleanToken = 'LOlifCRAD8smihnO8ETHiku7Rmy5zDO5hEgTruy6luQ=';
    
    if (!gleanToken) {
      return {
        statusCode: 500,
        body: {
          error: 'Glean API token not configured'
        }
      };
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
      return {
        statusCode: response.status,
        body: {
          error: `Glean API error: ${response.status} ${response.statusText}`,
          details: errorText
        }
      };
    }

    const data = await response.json();
    console.log('Glean API success, returning data');
    
    return {
      statusCode: 200,
      body: data
    };
    
  } catch (error) {
    console.error('Glean proxy function error:', error);
    
    return {
      statusCode: 500,
      body: {
        error: 'Failed to generate strategic account plan',
        message: error.message,
        details: error.stack
      }
    };
  }
}; 
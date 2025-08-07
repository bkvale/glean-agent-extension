// HubSpot Serverless Function to proxy Glean API requests
// This bypasses Content Security Policy restrictions in UI Extensions

exports.main = async (event, callback) => {
  console.log('Glean proxy function called with event:', JSON.stringify(event));
  
  try {
    const { companyName } = event.inputFields || event.body || {};
    
    if (!companyName) {
      throw new Error('Company name is required');
    }
    
    console.log('Making Glean API request for company:', companyName);
    
    // Use built-in fetch if available, otherwise try node-fetch
    const fetch = globalThis.fetch || require('node-fetch');
    
    const response = await fetch('https://trace3-be.glean.com/rest/api/v1/agents/runs/wait', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer LOlifCRAD8smihnO8ETHiku7Rmy5zDO5hEgTruy6luQ=',
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
      throw new Error(`Glean API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Glean API success, returning data');
    
    callback({
      statusCode: 200,
      body: JSON.stringify(data)
    });
    
  } catch (error) {
    console.error('Glean proxy function error:', error);
    
    callback({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate strategic account plan',
        message: error.message,
        details: error.stack
      })
    });
  }
}; 
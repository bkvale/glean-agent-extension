// HubSpot Serverless Function to proxy Glean API requests
const axios = require('axios');

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
    
    // Get the private app access token from environment variables
    const gleanToken = process.env['GLEAN_API_TOKEN'];
    
    if (!gleanToken) {
      return {
        statusCode: 500,
        body: {
          error: 'Glean API token not configured in environment variables'
        }
      };
    }
    
    const response = await axios.post('https://trace3-be.glean.com/rest/api/v1/agents/runs/wait', {
      agent_id: '5057a8a588c649d6b1231d648a9167c8',
      input: {
        company_name: companyName
      }
    }, {
      headers: {
        'Authorization': `Bearer ${gleanToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Glean API success, returning data');
    
    return {
      statusCode: 200,
      body: response.data
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
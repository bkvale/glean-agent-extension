// HubSpot Serverless Function to proxy Glean API requests
const https = require('https');

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
    
    // Use the Glean API token with AGENTS scope
    const gleanToken = 'lGOIFZqCsxd6fEfW8Px+zQfcw08irSV8XDL1tIJLj/0=';
    
    if (!gleanToken) {
      return {
        statusCode: 500,
        body: {
          error: 'Glean API token not configured'
        }
      };
    }
    
    const postData = JSON.stringify({
      agent_id: '5057a8a588c649d6b1231d648a9167c8',
      input: {
        "Company Name": companyName
      }
    });

    const options = {
      hostname: 'trace3-be.glean.com',
      port: 443,
      path: '/rest/api/v1/agents/runs/wait',
      method: 'POST',
      timeout: 8000, // 8 second timeout (well under HubSpot's 10s limit)
      headers: {
        'Authorization': `Bearer ${gleanToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(responseData);
              resolve(parsedData);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout - Glean API took too long to respond'));
      });
      
      req.write(postData);
      req.end();
    });
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